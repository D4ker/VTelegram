// Расширение для экспорта диалогов из ВК и импорта в Telegram

const Iconv = require('iconv').Iconv;

const Constants = require('./constants');
const Lib = require('./lib');

// Глобальные переменные
var gMediaExportMode = Constants.EXPORT_MEDIA_URL_MODE; // режим экспорта медиа
var gImportedText = ''; // текст для импорта в Телеграм

function exportUrl(msgId, msgDateTime, msgSender, msgMediaData, vkDoc) {
    const mediaCount = parseInt(msgMediaData['attach_count'], 10);
    const mediaElementsDocBlock = vkDoc.getElementsByClassName(`_im_msg_media${msgId}`)[0];
    const mediaElements = mediaElementsBlock.getElementsByTagName('a')

    for (let i = 1; i <= mediaCount; i++) {
        const currentAttachKey = `attach${i}_type`;

        if (msgMediaData.hasOwnProperty(currentAttachKey)) {
            const mediaType = msgMediaData[currentMediaKey]

            for (let media of mediaElements) {
                if (media.getAttribute('data-photo-id')) {
                    console.log(media);
                }
            }

        } else {
            break;
        }
    }

    gImportedText += `${msgDateTime} - ${msgSender}: ${msgText}\n`;
}

function exportCloud(msgId, msgDateTime, msgSender, msgMediaData, vkDoc) {

}

function exportBot(msgId, msgDateTime, msgSender, msgMediaData, vkDoc) {

}

// Функция для отправки запросов телеграм-боту
function sendData(dataJSON, dataHTML) {
    for (let key in dataJSON) {
        const msgData = dataJSON[key];

        const msgId = msgData[0]; // id сообщения
        const msgSender = msgData[2]; // id отправителя
        const msgDateTime = Lib.formatTime(msgData[3]); // время отправки сообщения
        const msgText = msgData[4]; // текст сообщения
        const msgMediaData = msgData[5]; // текст сообщения

        if (msgText) {
            gImportedText += `${msgDateTime} - ${msgSender}: ${msgText}\n`;
        }

        /*if (msgMediaData.hasOwnProperty('attach_count')) {
            const vkDoc = new DOMParser().parseFromString(dataHTML, "text/html");
            if (gMediaExportMode == EXPORT_MEDIA_URL_MODE) {
                exportUrl(msgId, msgDateTime, msgSender, msgMediaData, vkDoc);
            } else if (gMediaExportMode == EXPORT_MEDIA_CLOUD_MODE) {
                exportCloud(msgId, msgDateTime, msgSender, msgMediaData, vkDoc);
            } else if (gMediaExportMode == EXPORT_MEDIA_BOT_MODE) {
                exportBot(msgId, msgDateTime, msgSender, msgMediaData, vkDoc);
            }
        }*/
    }

    console.log(gImportedText);
    // Код для отправки данных
}

// Function to download data to a file
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

// Функция для получения блока сообщений
async function sendHistoryPart(peer, offset) {
    const offsetData = `act=a_history&al=1&gid=0&im_v=3` +
        `&offset=${offset}&peer=${peer}&toend=0&whole=0`;
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
async function exportHistory(peer) {
    // Получение первого сообщения с основной информацией
    const startData = `act=a_start&al=1&block=true&gid=0&history=1&im_v=3` +
        `&msgid=false&peer=${peer}&prevpeer=0`;
    const result = await Lib.request(Constants.requestURL['start_history'], 'POST', startData);
    if (result.ok) {
        const jsonStartData = await result.json();

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

// Функция, делающая кнопку экспорта видимой только когда пользователь в беседе
function showButton() {
    if (location.host + location.pathname === Constants.VK_MSG_PATH) {
        let exportButton = document.getElementById('ui_rmenu_export_div_vt');
        if (!exportButton) {
            createButton();
            exportButton = document.getElementById('ui_rmenu_export_div_vt');
        }

        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get(Constants.VK_MSG_ID_PARAM)) {
            exportButton.style.display = 'block';
        } else {
            exportButton.style.display = 'none';
        }
    }
}

function activeButton(button, state) {
    if (state) {
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = '';
    } else {
        button.style.pointerEvents = 'none';
        button.style.cursor = 'default';
        button.style.backgroundColor = '#dadada';
    }
}

// Функция для создания кнопки экспорта
async function createButton() {
    const divElement = document.createElement('div');
    divElement.setAttribute('id', 'ui_rmenu_export_div_vt');
    divElement.style.padding = '0 0 6px 0';
    document.getElementsByClassName('page_block ui_rmenu _im_right_menu')[0]
        .style.padding = '6px 0 0 0'

    const sepElement = document.createElement('div');
    sepElement.setAttribute('class', 'ui_rmenu_sep');

    const exportButton = document.createElement('a');
    exportButton.textContent = 'Экспортировать';
    exportButton.setAttribute('id', 'ui_rmenu_export_vt');
    exportButton.setAttribute('class', 'ui_rmenu_item');

    if (document.getElementsByClassName('im-page js-im-page im-page_classic im-page_history-show')) {
        const rightMenu = document.getElementsByClassName('page_block ui_rmenu _im_right_menu ui_rmenu_pr')[0];
        rightMenu.appendChild(divElement);
        divElement.appendChild(sepElement);
        divElement.appendChild(exportButton);
    }

    // При нажатии на кнопку экспортировать историю
    exportButton.onclick = async function fun() {
        const urlParams = new URLSearchParams(location.search);
        const selID = urlParams.get(Constants.VK_MSG_ID_PARAM);
        if (selID) {
            activeButton(exportButton, false);
            if (selID[0] === 'c') {
                await exportHistory(Constants.CONVERSATION_START_ID + parseInt(selID.slice(1)));
            } else {
                await exportHistory(selID);
            }
            download(gImportedText, 'console.txt', 'text/plain');
            activeButton(exportButton, true);
        }
    }
}

// Встраиваем кнопку, если в ссылке есть параметр sel
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === Constants.UPDATE_TABS_MSG) {
            showButton();
        }
    }
);

// Отображаем кнопку на случай, если пользователь перешел сразу в беседу
showButton();
