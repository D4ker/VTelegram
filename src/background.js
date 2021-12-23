const Constants = require("./js/constants");
const Drive = require("./js/drive");

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        if (changeInfo.url) {
            chrome.tabs.sendMessage(tabId, {
                message: Constants.UPDATE_TABS_MSG
            });
        }
    }
);

//для одного файла
// Drive.createChatFolder('one_more_chat_folder')
// .then(folderParams => {
//     console.log(folderParams);
//     Drive.uploadFile(folderParams['id'], {
//         linkUrl: 'https://sun9-13.userapi.com/impg/La1aeW1HDkkFHK-DPEl5nk5OELYCMUZTxwq23Q/HVo7fMAEZ3c.jpg?size=531x546&quality=96&sign=ac985e90ecf64a0b9cb170d63b545742&type=album',  
//         fileName: 'test' });
// });

// Drive.createChatFolder('____more_chat_folder')
// .then(folderParams => {
//     console.log(folderParams);
//     let files = [];
//     for (let i = 0; i < 20; i++) {
//         files.push({
//         linkUrl: 'https://sun9-13.userapi.com/impg/La1aeW1HDkkFHK-DPEl5nk5OELYCMUZTxwq23Q/HVo7fMAEZ3c.jpg?size=531x546&quality=96&sign=ac985e90ecf64a0b9cb170d63b545742&type=album',  
//         fileName: 'test' });
//     }
//     
//     Drive.uploadFiles(folderParams['id'], files);
// });
