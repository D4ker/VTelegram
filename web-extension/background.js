const UPDATE_TABS_MSG = 'updatedURL';

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        if (changeInfo.url) {
            chrome.tabs.sendMessage(tabId, {
                message: UPDATE_TABS_MSG
            });
        }
    }
);
