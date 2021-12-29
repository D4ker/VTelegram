const Constants = require('./../constants');

const MainForm = require('./../interface/main-form').default;

let gButton = null;

export function active(state) {
    if (state) {
        gButton.className = 'button_disabled';
        gButton.style.pointerEvents = 'none';
        gButton.style.cursor = 'default';
        gButton.style.backgroundColor = '#dadada';
    } else {
        gButton.className = '';
        gButton.style.pointerEvents = 'auto';
        gButton.style.cursor = 'pointer';
        gButton.style.backgroundColor = '';
    }
}

// Функция для создания кнопки экспорта
function create() {
    const divElement = document.createElement('div');
    divElement.setAttribute('id', 'ui_rmenu_export_div_vt');
    divElement.style.padding = '0 0 6px 0';
    document.getElementsByClassName('page_block ui_rmenu _im_right_menu')[0].style.padding = '6px 0 0 0';

    const sepElement = document.createElement('div');
    sepElement.setAttribute('class', 'ui_rmenu_sep');

    gButton = document.createElement('a');
    gButton.textContent = 'Экспортировать';
    gButton.setAttribute('id', 'ui_rmenu_export_vt');
    gButton.setAttribute('class', 'ui_rmenu_item');

    if (document.getElementsByClassName('im-page js-im-page im-page_classic im-page_history-show')) {
        const rightMenu = document.getElementsByClassName('page_block ui_rmenu _im_right_menu ui_rmenu_pr')[0];
        rightMenu.appendChild(divElement);
        divElement.appendChild(sepElement);
        divElement.appendChild(gButton);
    }

    // При нажатии на кнопку экспортировать историю
    gButton.onclick = async function fun() {
        MainForm.show();

        // await TgLib.authorize()
        // let invitationLink = prompt('Enter invitation link (https://t.me/+k-b1fZW60vE0ZmZi): ');
        // const {gChat, users} = await TgLib.getUsersByInvitationLink(invitationLink);
        // console.log(gChat);
        // console.log(users);
        // await TgLib.startImport(gChat, ExportLib.gImportedData.text);

        // await TgLib.runInterface(ExportLib.gImportedData.text);
    }
}

// Функция, делающая кнопку экспорта видимой только когда пользователь в беседе
function show() {
    if (location.host + location.pathname === Constants.VK_MSG_PATH) {
        if (gButton === null) {
            create();
            gButton = document.getElementById('ui_rmenu_export_div_vt');
        }

        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get(Constants.VK_MSG_ID_PARAM)) {
            gButton.style.display = 'block';
        } else {
            gButton.style.display = 'none';
        }
    }
}

// Функция для инициализации кнопки в content
export function init() {
    // Встраиваем кнопку, если в ссылке есть параметр sel
    chrome.runtime.onMessage.addListener(
        function (message) {
            if (message.type === Constants.UPDATE_TABS_MSG) {
                show();
            }
        }
    );

// Отображаем кнопку на случай, если пользователь перешел сразу в беседу
    show();
}
