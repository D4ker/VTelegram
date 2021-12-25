const Constants = require('./../constants');
const Lib = require('./../lib');

// Глобальные переменные
let gSenders = {}; // список людей, состоящих в беседе
let gLeftSenders = {}; // список людей, состоящих в беседе, но затем покинувших её
let gMediaExportMode = Constants.EXPORT_MEDIA_URL_MODE; // режим экспорта медиа
let gImportedText = ''; // текст для импорта в Телеграм

function updateGlobalVars() {
    gSenders = {}; // список людей, состоящих в беседе
    gLeftSenders = {}; // список людей, состоящих в беседе, но затем покинувших её
    gMediaExportMode = Constants.EXPORT_MEDIA_URL_MODE; // режим экспорта медиа
    gImportedText = ''; // текст для импорта в Телеграм
}

function getDirectUrl(url) {
    return url;
}

function getMediaUrls(msgId, msgMediaData, vkDoc) {
    const mediaElementsDocBlock = vkDoc.getElementsByClassName(`_im_msg_media${msgId}`)[0];

    if (mediaElementsDocBlock === undefined) {
        return {};
    }

    const mediaElements = mediaElementsDocBlock.getElementsByTagName('a');
    const audiomsgsElements = mediaElementsDocBlock.getElementsByClassName('audio-msg-track clear_fix');

    const mediaObj = {
        photos: [],
        videos: [],
        docs: [],
        audiomsgs: [],
        audios: [],
        wall_posts: []
    };

    for (let media of mediaElements) {
        if (media.getAttribute('data-photo-id')) { // фото
            const photoObj = JSON.parse(`${media.getAttribute('onclick').match(`"temp":({.*?})`)[1]}`);
            let max = -1;
            let photoUrl = '';
            for (let photo in photoObj) {
                if (photo[1] === '_') {
                    const photoWidth = parseInt(photoObj[photo][1], 10);
                    const photoHeight = parseInt(photoObj[photo][2], 10);
                    const photoSize = photoWidth * photoHeight;
                    if (photoSize > max) {
                        max = photoSize;
                        photoUrl = photoObj[photo][0];
                    }
                }
            }
            mediaObj.photos.push(photoUrl);
        } else if (media.getAttribute('data-video')) { // видео

            // mediaObj.videos.push();
        } else if (Constants.docTypes.indexOf(media.getAttribute('class')) !== -1) { // документы
            const url = getDirectUrl(Constants.MEDIA_PREFIX + media.getAttribute('href'));
            mediaObj.docs.push(url);
        } else if (media.getAttribute('class') === 'post_link') { // посты из групп
            const url = Constants.MEDIA_PREFIX + media.getAttribute('href');
            mediaObj.wall_posts.push(url);
        } else if (media.getAttribute('audio')) { // аудио (музыка)
            // mediaObj.audios.push();
        }
    }

    for (let audiomsg of audiomsgsElements) { // аудиосообщения
        mediaObj.audiomsgs.push(audiomsg.getAttribute('data-mp3'));
    }

    return mediaObj;
}

function exportUrl(msgId, msgDateTime, msgSender, msgMediaData, vkDoc) {
    const mediaObj = getMediaUrls(msgId, msgMediaData, vkDoc);
    for (let media in mediaObj) {
        for (let url of mediaObj[media]) {
            gImportedText += `${msgDateTime} - ${msgSender}: <${media}> ::: ${url}\n`;
        }
    }
}

function exportCloud(msgId, msgDateTime, msgSender, msgMediaData, vkDoc) {

}

function exportBot(msgId, msgDateTime, msgSender, msgMediaData, vkDoc) {

}

// Функция для получения списка людей, состоящих в беседе
function setSendersDataList(senders) {
    for (let sender in senders) {
        gSenders[senders[sender].id] = {
            name: senders[sender].name,
            photo: senders[sender].photo
        };
    }
}

// Функция для добавления в список людей, состоящих в беседе, удаленные из нее аккаунты
function addSenderDataToList(dataHTML, senderId) {
    const vkDoc = new DOMParser().parseFromString(dataHTML, "text/html");
    const msgElementsDocBlock = vkDoc.getElementsByClassName('im-mess-stack _im_mess_stack');
    for (let msgElement of msgElementsDocBlock) {
        if (msgElement.getAttribute('data-peer') === `${senderId}`) {
            const senderDataElement = msgElement
                .getElementsByClassName('nim-peer--photo')[0]
                .getElementsByTagName('img')[0];
            const senderData = {
                name: senderDataElement.getAttribute('alt'),
                photo: senderDataElement.getAttribute('src')
            };
            gLeftSenders[senderId] = senderData;
            gSenders[senderId] = senderData;
            return;
        }
    }
}

// Функция для обработки отступов, эмодзи и т.д. в сообщениях
function getFormatMsg(msg) {
    return msg;
}

// Функция для отправки запросов телеграм-боту
function sendData(dataJSON, dataHTML) {
    for (let key in dataJSON) {
        const msgData = dataJSON[key];

        let senderId = 0;
        if (msgData[5].hasOwnProperty('from')) {
            senderId = msgData[5].from;
        } else if (msgData[5].hasOwnProperty('oaid')) {
            senderId = msgData[5].oaid;
        } else {
            senderId = msgData[2];
        }

        if (gSenders[senderId] === undefined) {
            addSenderDataToList(dataHTML, senderId);
        }

        const msgId = msgData[0]; // id сообщения
        const msgSender = gSenders[senderId].name; // имя отправителя
        const msgDateTime = Lib.formatTime(msgData[3]); // время отправки сообщения
        const msgText = getFormatMsg(msgData[4]); // текст сообщения
        const msgMediaData = msgData[5]; // медиа-данные сообщения

        if (msgText) {
            gImportedText += `${msgDateTime} - ${msgSender}: ${msgText}\n`;
        }

        if (msgMediaData.hasOwnProperty('attach_count')) {
            const vkDoc = new DOMParser().parseFromString(dataHTML, "text/html");
            if (gMediaExportMode === Constants.EXPORT_MEDIA_URL_MODE) {
                exportUrl(msgId, msgDateTime, msgSender, msgMediaData, vkDoc);
            } else if (gMediaExportMode === Constants.EXPORT_MEDIA_CLOUD_MODE) {
                exportCloud(msgId, msgDateTime, msgSender, msgMediaData, vkDoc);
            } else if (gMediaExportMode === Constants.EXPORT_MEDIA_BOT_MODE) {
                exportBot(msgId, msgDateTime, msgSender, msgMediaData, vkDoc);
            }
        }
    }

    // console.log(gImportedText);
    // console.log(gLeftSenders);
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
