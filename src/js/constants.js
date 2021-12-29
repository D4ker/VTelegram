export const requestURL = {
    start_history: 'https://vk.com/al_im.php?act=a_start',
    history: 'https://vk.com/al_im.php?act=a_history',
    video: 'https://vk.com/al_video.php?act=show'
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
export const EXPORT_MEDIA_NONE = -1;
export const EXPORT_MEDIA_URL_MODE = 0;
export const EXPORT_MEDIA_CLOUD_MODE = 1;
export const EXPORT_MEDIA_BOT_MODE = 2;

export const MEDIA_PREFIX = 'https://vk.com';

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
    PHONE_NUMBER_FLOOD: "Вы запрашивали код слишком много раз",
    PHONE_PASSWORD_FLOOD: "Превышено количество попыток входа для номера телефона",
    PHONE_NUMBER_INVALID: "Пользователя с таким номером не существует",

    PHONE_NUMBER_UNOCCUPIED: "Код верный, пользователь с таким номером не существует в Телеграм",
    PHONE_CODE_FORMAT_ERROR: "Неверный формат кода (символы, пробелы, пустая строка)",
    PHONE_CODE_EXPIRED: "Истёк срок действия кода",
    PHONE_CODE_INVALID: "Не правильная пара телефон-код-хэш",

    SESSION_PASSWORD_NEEDED: "Ошибка авторизации, требуется пароль",

    PASSWORD_HASH_INVALID: "Неправильный пароль для 2FA",

    UNEXPECTED_ERROR: "Какая-то необрабатываемая ошибка",
    EMPTY_VALUE: "Не введено значение",
};

export const msgBackgroundType = {
    DEFAULT: 0,
    START_EXPORT: 1
};

export const msgContentType = {
    DEFAULT: 0
};
