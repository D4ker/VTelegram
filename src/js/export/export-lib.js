const Constants = require('./../constants');
const Lib = require('./../lib');

const ExportMedia = require("./export-media");

// Глобальные переменные
export let gImportedData = updateGlobalVars(); // данные для импорта в Телеграм

function updateGlobalVars() {
    return {
        text: '',
        senders: {}, // список людей, состоящих в беседе
        left_senders: {}, // список людей, состоящих в беседе, но затем покинувших её
        media_export_mode: Constants.EXPORT_MEDIA_URL_MODE // режим экспорта медиа
    }
}

// Функция для получения списка людей, состоящих в беседе
function setSendersDataList(senders) {
    for (let sender in senders) {
        gImportedData.senders[senders[sender].id] = {
            name: senders[sender].name,
            photo: senders[sender].photo
        };
    }
}

// Функция для добавления в список людей, состоящих в беседе, удаленные из нее аккаунты
function addSenderDataToList(msgElement, senderId) {
    const senderDataElement = msgElement
        .getElementsByClassName('nim-peer--photo')[0]
        .getElementsByTagName('img')[0];
    const senderData = {
        name: senderDataElement.getAttribute('alt'),
        photo: senderDataElement.getAttribute('src')
    };
    gImportedData.left_senders[senderId] = senderData;
    gImportedData.senders[senderId] = senderData;
}

// Функция для обработки отступов, эмодзи и т.д. в сообщениях + получение DOM-элемента с медиа
function getMsgData(msgId, msgDataElement) {
    let mediaElement = null;
    let msgText = '';
    for (const el of msgDataElement.childNodes) {
        if (el.nodeName === '#text') { // текст
            msgText += el.textContent ? el.textContent : el.innerText;
        } else if (el.nodeName === 'A') {
            msgText += el.innerText;
        } else if (el.className === 'emoji') { // эмодзи
            msgText += el.getAttribute('alt');
        } else if (el.nodeName === 'BR') { // перенос строки
            msgText += '\n';
        } else if (el.className === 'im-mess--lbl-was-edited _im_edit_time') {
            const editTimestamp = el.getAttribute('data-time');
            msgText += `\n------------\n`;
            msgText += `(изменено ${Lib.formatTime(editTimestamp)})`;
        } else if (el.className === `_im_msg_media${msgId}`) { // медиа
            mediaElement = el;
        } else { // другое
            console.log('Unknown msg data:');
            console.log([el]);
            console.log(el.innerText);
        }
    }
    return {
        text: msgText,
        media: mediaElement
    };
}

// Функция для отправки запросов телеграм-боту
function sendData(dataJSON, dataHTML) {
    const vkDoc = new DOMParser().parseFromString(dataHTML, "text/html");
    for (let key in dataJSON) {
        const msgJsonData = dataJSON[key];

        const msgId = msgJsonData[0]; // id сообщения
        const msgElement = vkDoc.getElementsByClassName(`_im_mess_${msgId}`)[0];

        const msgDataElement = msgElement.getElementsByClassName(`im-mess--text wall_module _im_log_body`)[0];
        const msgData = getMsgData(msgId, msgDataElement);

        const msgRootElement = msgElement.parentElement.parentElement.parentElement;
        let senderId = Number(msgRootElement.getAttribute('data-peer'));

        if (gImportedData.senders[senderId] === undefined) {
            addSenderDataToList(msgRootElement, senderId);
        }

        const msgSender = gImportedData.senders[senderId].name; // имя отправителя
        const msgDateTime = Lib.formatTime(msgJsonData[3]); // время отправки сообщения
        const msgText = msgData.text; // текст сообщения
        const msgMediaInfo = msgJsonData[5]; // информация о имеющихся медиа в сообщении

        if (msgText) {
            gImportedData.text += `${msgDateTime} - ${msgSender}: ${msgText}\n`;
        }

        const msgMediaElement = msgData.media;
        if (msgMediaInfo.hasOwnProperty('attach_count') && msgMediaElement !== null) {
            if (gImportedData.media_export_mode === Constants.EXPORT_MEDIA_URL_MODE) {
                ExportMedia.exportUrl(msgId, msgDateTime, msgSender, msgMediaElement);
            } else if (gImportedData.media_export_mode === Constants.EXPORT_MEDIA_CLOUD_MODE) {
                ExportMedia.exportCloud(msgId, msgDateTime, msgSender, msgMediaElement);
            } else if (gImportedData.media_export_mode === Constants.EXPORT_MEDIA_BOT_MODE) {
                ExportMedia.exportBot(msgId, msgDateTime, msgSender, msgMediaElement);
            }
        }
    }

    // console.log(gImportedData.text);
    // console.log(gImportedData.left_senders);
    // Код для отправки данных
}

// Функция для получения блока сообщений
async function sendHistoryPart(peer, offset) {
    const offsetData = Lib.toUrlData({
        act: 'a_history',
        al: 1,
        gid: 0,
        im_v: 3,
        offset: offset,
        peer: peer,
        toend: 0,
        whole: 0
    });
    const result = await Lib.request(Constants.requestURL['history'], 'POST', offsetData);
    if (result.ok) {
        const jsonOffsetData = await result.json();
        const currentData = jsonOffsetData['payload'][1][1];
        // Мы не можем наверняка знать, сколько сообщений было удалено пользователями
        if (Object.keys(currentData).length) {
            sendData(currentData, jsonOffsetData['payload'][1][0]);
        }
    }
}

// Функция для получения всей истории переписки
export async function exportHistory(peer) {
    updateGlobalVars(); // обнуляем глобальные переменные

    // Получение первого сообщения с основной информацией
    const startData = Lib.toUrlData({
        act: 'a_start',
        al: 1,
        block: true,
        gid: 0,
        history: 1,
        im_v: 3,
        msgid: false,
        peer: peer,
        prevpeer: 0
    });
    const result = await Lib.request(Constants.requestURL['start_history'], 'POST', startData);
    if (result.ok) {
        const jsonStartData = await result.json();

        // Получаем список людей, состоящих в беседе
        setSendersDataList(jsonStartData['payload'][1][1]);

        // Число сообщений, отправленных в ьеседу за все время (вместе с удаленными)
        const countOfMsgs = jsonStartData['payload'][1][0]['lastmsg_meta'][8];

        const remainder = countOfMsgs % Constants.MSG_CHUNK;
        let startOffset = countOfMsgs - remainder + Constants.START_MSG_CHUNK;
        if (remainder <= Constants.START_MSG_CHUNK) {
            startOffset -= Constants.MSG_CHUNK;
        }

        for (let currentOffset = startOffset; currentOffset >= Constants.START_MSG_CHUNK; currentOffset -= Constants.MSG_CHUNK) {
            await sendHistoryPart(peer, currentOffset);
        }

        await sendData(jsonStartData['payload'][1][0]['msgs'], jsonStartData['payload'][1][0]['history']);
    }
}
