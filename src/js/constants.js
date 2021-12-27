export const requestURL = {
    'start_history': 'https://vk.com/al_im.php?act=a_start',
    'history': 'https://vk.com/al_im.php?act=a_history'
};

// Сколько сообщений приходит в самом начале
export const START_MSG_CHUNK = 30;
// Сколько сообщений приходит за запрос
export const MSG_CHUNK = 100;

export const UPDATE_TABS_MSG = 'updatedURL';
export const VK_MSG_PATH = 'vk.com/im';
export const VK_MSG_ID_PARAM = 'sel';

export const CONVERSATION_START_ID = 2000000000;

// Режимы экспорта медиа
export const EXPORT_MEDIA_URL_MODE = 0;
export const EXPORT_MEDIA_CLOUD_MODE = 1;
export const EXPORT_MEDIA_BOT_MODE = 2;

export const MEDIA_PREFIX = 'vk.com';

export const docTypes = [
    'page_doc_title', // документ (в том числе видео-документ)
    'page_post_thumb_unsized', // фото-документ
    'page_doc_photo_href', // гифка
];

export const driveScopes = {
    'file': 'https://www.googleapis.com/drive/v3/files',
    'uploadFile': 'https://www.googleapis.com/upload/drive/v3/files'
};

export const TELEGRAM_CNV_PATH = 'https://t.me/';

export const errors = {
    NO_ERROR: "Ошибок не найдено",
    PHONE_FORMAT_ERROR: "Номер телефона не соответствует формату",
    EMPTY_VALUE: "Не введено значение",
    SESSION_PASSWORD_NEEDED: "Ошибка авторизации, требуется пароль"
};
