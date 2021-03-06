const Constants = require("./js/constants");

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        if (changeInfo.url) {
            chrome.tabs.sendMessage(tabId, {
                message: Constants.UPDATE_TABS_MSG
            });
        }
    }
);
