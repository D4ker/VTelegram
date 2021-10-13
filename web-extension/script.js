// Расширение для экспорта диалогов из ВК и импорта в Telegram

const requestURL = {
    'start_history': 'https://vk.com/al_im.php?act=a_start',
    'history': 'https://vk.com/al_im.php?act=a_history'
};

// Сколько сообщений приходит в самом начале
const START_MSG_CHUNK = 30;
// Сколько сообщений приходит за запрос
const MSG_CHUNK = 100;

const UPDATE_TABS_MSG = 'updatedURL';
const VK_MSG_PATH = 'vk.com/im';
const VK_MSG_ID_PARAM = 'sel';

const CONVERSATION_START_ID = 2000000000;

// Отправка запроса
async function request(url, method = 'GET', data = null) {
    const headers = {};
    let body;
    if (data) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['x-requested-with'] = 'XMLHttpRequest';
        body = JSON.stringify(data);
    }

    const response = await fetch(url, {
        method: method,
        headers: headers,
        body: body
    });

    return response;
}

// Функция для отправки запросов телеграм-боту
function sendData(data) {
    console.log(data);
    // Код для отправки данных
}

// Функция для получения блока сообщений
async function sendHistoryPart(peer, offset) {
    const offsetData = `act=a_history&al=1&gid=0&im_v=3` +
        `&offset=${offset}&peer=${peer}&toend=0&whole=0`;
    const result = await request(requestURL['history'], 'POST', offsetData);
    if (result.ok) {
        const jsonOffsetData = await result.json();
        const currentData = jsonOffsetData['payload'][1][1];
        // Мы не можем наверняка знать, сколько сообщений было удалено пользователями
        if (Object.keys(currentData).length) {
            sendData(currentData);
        }
    }
}

// Функция для получения всей истории переписки
async function exportHistory(peer) {
    // Получение первого сообщения с основной информацией
    const startData = `act=a_start&al=1&block=true&gid=0&history=1&im_v=3` +
        `&msgid=false&peer=${peer}&prevpeer=0`;
    const result = await request(requestURL['start_history'], 'POST', startData);
    if (result.ok) {
        const jsonStartData = await result.json();

        // Число сообщений, отправленных в ьеседу за все время (вместе с удаленными)
        const countOfMsgs = jsonStartData['payload'][1][0]['lastmsg_meta'][8];

        const remainder = countOfMsgs % MSG_CHUNK;
        let startOffset = countOfMsgs - remainder + START_MSG_CHUNK;
        if (remainder <= START_MSG_CHUNK) {
            startOffset -= MSG_CHUNK;
        }

        for (let currentOffset = startOffset; currentOffset >= START_MSG_CHUNK; currentOffset -= MSG_CHUNK) {
            await sendHistoryPart(peer, currentOffset);
        }

        await sendData(jsonStartData['payload'][1][0]['msgs']);
    }
}

// Функция, делающая кнопку экспорта видимой только когда пользователь в беседе
function showButton() {
    if (location.host + location.pathname === VK_MSG_PATH) {
        let exportButton = document.getElementById('ui_rmenu_export_div_vt');
        if (!exportButton) {
            createButton();
            exportButton = document.getElementById('ui_rmenu_export_div_vt');
        }

        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get(VK_MSG_ID_PARAM)) {
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
        const selID = urlParams.get(VK_MSG_ID_PARAM);
        if (selID) {
            activeButton(exportButton, false);
            if (selID[0] === 'c') {
                await exportHistory(CONVERSATION_START_ID + parseInt(selID.slice(1)));
            } else {
                await exportHistory(selID);
            }
            activeButton(exportButton, true);
        }
    }
}

// Встраиваем кнопку, если в ссылке есть параметр sel
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === UPDATE_TABS_MSG) {
            showButton();
        }
    }
);

// Отображаем кнопку на случай, если пользователь перешел сразу в беседу
showButton();
