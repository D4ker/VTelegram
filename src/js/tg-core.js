// Код Влада

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

// методы для авторизации
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

export function sendCode(phone) {
    return api.call('auth.sendCode', {
        phone_number: phone,
        settings: {
            _: 'codeSettings',
        },
    });
}

export function signIn({code, phone, phone_code_hash}) {
    return api.call('auth.signIn', {
        phone_code: code,
        phone_number: phone,
        phone_code_hash: phone_code_hash,
    });
}

export function getPassword() {
    return api.call('account.getPassword');
}

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
export function startHistoryImport(peer, import_id) {
    return api.call('messages.startHistoryImport', {
        peer: peer,
        import_id: import_id
    });
}
