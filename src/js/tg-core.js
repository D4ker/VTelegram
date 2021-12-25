// методы для взаимодействия c Tg API
const MTProto = require('@mtproto/core/envs/browser');
const {sleep} = require('@mtproto/core/src/utils/common');

// API обработчик ошибок
class API {
    constructor() {
        this.mtproto = new MTProto({
            api_id: 'xxxxxxxx',
            api_hash: 'xxxxxxxx'
        });
    }

    async call(method, params, options = {}) {
        try {
            const result = await this.mtproto.call(method, params, options);

            return result;
        } catch (error) {
            console.log(`${method} error:`, error);

            const {error_code, error_message} = error;

            if (error_code === 420) {
                const seconds = Number(error_message.split('FLOOD_WAIT_')[1]);
                const ms = seconds * 1000;

                await sleep(ms);

                return this.call(method, params, options);
            }

            if (error_code === 303) {
                const [type, dcIdAsString] = error_message.split('_MIGRATE_');

                const dcId = Number(dcIdAsString);

                // If auth.sendCode call on incorrect DC need change default DC, because
                // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
                if (type === 'PHONE') {
                    await this.mtproto.setDefaultDc(dcId);
                } else {
                    Object.assign(options, {dcId});
                }

                return this.call(method, params, options);
            }

            return Promise.reject(error);
        }
    }
}

export const api = new API();

// Методы для авторизации
// Получить текущего пользователя который взаимодействует с API
export async function getUser() {
    try {
        const user = await api.call('users.getFullUser', {
            id: {
                _: 'inputUserSelf',
            },
        });

        return user;
    } catch (error) {
        return null;
    }
}

// Отправить код авторизации на телефон
export function sendCode(phone) {
    return api.call('auth.sendCode', {
        phone_number: phone,
        settings: {
            _: 'codeSettings',
        },
    });
}

// Вход по коду, телефону и ответу метода sendCode()
export function signIn({code, phone, phone_code_hash}) {
    return api.call('auth.signIn', {
        phone_code: code,
        phone_number: phone,
        phone_code_hash: phone_code_hash,
    });
}

// Получить пароль аккаунта в зашифрованном виде
export function getPassword() {
    return api.call('account.getPassword');
}

// Сравнить введённый пароль с зашифрованным из функции getPassword()
export function checkPassword({srp_id, A, M1}) {
    return api.call('auth.checkPassword', {
        password: {
            _: 'inputCheckPasswordSRP',
            srp_id,
            A,
            M1,
        },
    });
}

// Выход из аккаунта пользователя
export function logOut() {
    return api.call('auth.logOut')
}

// Методы для импорта в Tg
// 1 этап: передаём 100 строк экспортированной переписки для валидации
export function checkHistoryImport(import_head) {
    return api.call('messages.checkHistoryImport', {
        import_head: import_head
    });
}

// 2 этап: передаём чат куда будем импортировать для валидации
export function checkHistoryImportPeer(peer) {
    return api.call('messages.checkHistoryImportPeer', {
        peer: peer
    });
}

// 3 этап: передаём чат, сообщения и количество медиа
export function initHistoryImport({peer, file, media_count}) {
    return api.call('messages.initHistoryImport', {
        peer: peer,
        file: file,
        media_count: media_count
    });
}

// 4 этап: подгрузка медиафайлов по каналу назначения, id импорта (возвращается из initHistory), медиа и его название
export function uploadImportedMedia({peer, import_id, file_name, media}) {
    return api.call('messages.uploadImportedMedia', {
        peer: peer,
        import_id: import_id,
        file_name: file_name,
        media: media
    });
}

// 5 этап: запуск процесса импорта, опять передаём чат и id импорта
export function startHistoryImport({peer, import_id}) {
    return api.call('messages.startHistoryImport', {
        peer: peer,
        import_id: import_id
    });
}

// Работа с пользователями
// Добавить пользователя в беседу по inputUser
export function inviteToChannel ({channel, users}) {
    return api.call('channels.inviteToChannel', {
        channel: channel,
        users: users
    })
}

// Получение user_id из @username для добавления в беседу
export function resolveUsername(username) {
    return api.call('contacts.resolveUsername', {
        username: username
    })
}

// Ищет user_id по @username?????
export function search({q, limit}) {
    return api.call('contacts.search', {
        q: q,
        limit: limit
    })
}

// Получение user_id по номеру телефона (inputPhoneContact)
export function importContacts(contacts) {
    return api.call('contacts.importContacts', {
        contacts: contacts
    })
}

// Работа с чатами и каналами
// Методы для получения chat_id по инвайт линку (валидация линка и получение инфы)
export function checkChatInvite(hash) {
    return api.call('messages.checkChatInvite', {
        hash: hash
    });
}

// Создать канал
export function createChannel({flags, broadcast, megagroup, for_import, title, about, geo_point, address}) {
    return api.call('channels.createChannel', {
        flags: flags,
        broadcast: broadcast,
        megagroup: megagroup,
        for_import: for_import,
        title: title,
        about: about,
        geo_point: geo_point,
        address: address
    })
}

// Метод для получения всех участников из КАНАЛА
export function getParticipants({channel, filter, offset, limit, hash}) {
    return api.call('channels.getParticipants', {
        channel: channel,
        filter: filter,
        offset: offset,
        limit: limit,
        hash: hash
    });
}

// Метод получения всех участников из ЧАТА
export function getFullChat(chat_id) {
    return api.call('messages.getFullChat', {
        chat_id: chat_id
    })
}

// Разрешить просмотр предыдущих сообщений для новых учатсников чата (устраняет баг с peerChat)
export function togglePreHistoryHidden({channel, enabled}) {
    return api.call('channels.togglePreHistoryHidden', {
        channel: channel,
        enabled: enabled
    })
}

// Управление параметром флуда (с каким интервалом отправлять сообщения)
export function toggleSlowMode({channel, seconds}) {
    return api.call('channels.toggleSlowMode', {
        channel: channel,
        seconds: seconds
    })
}

// На всякий случай – метод для получения всех чатов
export function getAllChats(except_ids) {
    return api.call('messages.getAllChats', {
        except_ids: except_ids
    })
}