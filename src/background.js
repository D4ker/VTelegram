const Constants = require("./js/constants");
const Lib = require('./js/lib');

const Drive = require("./js/drive");
const ExportLib = require('./js/export/export-lib');

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        if (changeInfo.url) {
            chrome.tabs.sendMessage(tabId, {
                type: Constants.UPDATE_TABS_MSG
            });
        }
    }
);

chrome.runtime.onMessage.addListener(
    async function (message) {
        if (message.type === Constants.msgBackgroundType.START_EXPORT) {
            console.log('START EXPORT!!!');
            await ExportLib.exportHistory(message.text);
            Lib.createFile(ExportLib.gImportedData.text, 'file.txt', 'plain/text');
        }
        return true;
    }
);

// Пример отправки данных ИЗ content.js В background.js
// chrome.runtime.sendMessage({
//     type: Constants.msgBackgroundType.DEFAULT,
//     text: 'text'
// });

// Пример отправки данных ИЗ background.js В content.js
// chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, {
//         type: Constants.msgContentType.DEFAULT,
//         text: message.text
//     });
// });

// Пример ОБРАБОТЧИКА пришедших сообщений ИЗ background.js В content.js
// chrome.runtime.onMessage.addListener(
//     function (message) {
//         if (message.type === Constants.msgContentType.DEFAULT) {
//             console.log(message.text);
//         }
//         return true;
//     }
// );
