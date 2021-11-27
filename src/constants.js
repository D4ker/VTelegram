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

export const MEDIA_TYPE_PHOTO = 'photo';
export const MEDIA_TYPE_VIDEO = 'video';
export const MEDIA_TYPE_DOC = 'doc';
export const MEDIA_TYPE_AUDIO = 'audio';

export const MEDIA_KIND_AUDIOMSG = 'audiomsg'; // голосовое сообщение (тип медиа - doc)
