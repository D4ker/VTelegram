const Constants = require('./../constants');
const Lib = require('./../lib');

const ExportLib = require('./export-lib');

const MainForm = require('./../interface/main-form').default;

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
function createButton() {
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
            MainForm.show();
            // if (selID[0] === 'c') {
            //     await ExportLib.exportHistory(Constants.CONVERSATION_START_ID + parseInt(selID.slice(1)));
            // } else {
            //     await ExportLib.exportHistory(selID);
            // }

            // await TgLib.authorize()
            // let invitationLink = prompt('Enter invitation link (https://t.me/+k-b1fZW60vE0ZmZi): ');
            // const {gChat, users} = await TgLib.getUsersByInvitationLink(invitationLink);
            // console.log(gChat);
            // console.log(users);
            // await TgLib.startImport(gChat, ExportLib.gImportedData.text);


            // Lib.createFile(ExportLib.gImportedData.text, 'file.txt', 'plain/text');
            // await TgLib.runInterface(ExportLib.gImportedData.text);
            activeButton(exportButton, true);
        }
    }
}

// Встраиваем кнопку, если в ссылке есть параметр sel
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === Constants.UPDATE_TABS_MSG) {
            showButton();
        }
    }
);

// Отображаем кнопку на случай, если пользователь перешел сразу в беседу
showButton();
