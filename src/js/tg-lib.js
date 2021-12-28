// Код Влада
// обёртка для удобного использования API

const Lib = require('./lib');
const TgCore = require('./tg-core');
const CryptoJS = require('crypto-js');
const Errors = require('./constants').errors

// Запускает процесс авторизации
export async function authorize() {
    const user = await TgCore.getUser();

    if (!user) {

        // заменить
        const phone = prompt('Enter your phone: ');
        console.log('You entered ' + phone);

        const {phone_code_hash} = await TgCore.sendCode(phone);

        // заменить
        const code = prompt('Enter the code: ');
        console.log('You entered ' + code);

        try {
            const signInResult = await TgCore.signIn({
                code,
                phone,
                phone_code_hash,
            });

            if (signInResult._ === 'auth.authorizationSignUpRequired') {
                console.log(`error:`, signInResult._);
            }
        } catch (error) {
            if (error.error_message !== 'SESSION_PASSWORD_NEEDED') {
                console.log(`error:`, error);

                return;
            }

            // 2FA
            // заменить
            const password = prompt('Enter password for 2FA: ');
            console.log('You entered ' + password);

            const {srp_id, current_algo, srp_B} = await TgCore.getPassword();
            const {g, p, salt1, salt2} = current_algo;

            const {A, M1} = await TgCore.api.mtproto.crypto.getSRPParams({
                g,
                p,
                salt1,
                salt2,
                gB: srp_B,
                password,
            });

            const checkPasswordResult = await TgCore.checkPassword({srp_id, A, M1});
        }
    }
}

// Авторизация
// Проверяет авторизован ли пользователь
export async function isAuthorized() {
    try {
        const id = {_: 'inputUserSelf'}
        const user = await TgCore.getFullUser(id);
        return user;
    }catch (error){
        return null
    }
}

// Запрос кода по номеру телефона
export async function getCodeByPhone(phone) {
    try {
        const {phone_code_hash} = await TgCore.sendCode(phone);
        return {state: 'ok', data: phone_code_hash};
    } catch (error){
        console.log('error:', error)
        switch (error.error_message){
            case 'PHONE_NUMBER_INVALID':
                return {state: 'err', data: Errors.PHONE_NUMBER_INVALID}
            case 'PHONE_NUMBER_FLOOD':
                return {state: 'err', data: Errors.PHONE_NUMBER_FLOOD}
            case 'PHONE_PASSWORD_FLOOD':
                return {state: 'err', data: Errors.PHONE_PASSWORD_FLOOD}
            default:
                return {state: 'err', data: Errors.UNEXPECTED_ERROR}
        }
    }
}

// Авторизация с помощью кода (без 2FA)
export async function authByCode(code, phone, phone_code_hash){
    try {
        const signInResult = await TgCore.signIn({
            code,
            phone,
            phone_code_hash,
        });

        if (signInResult._ === 'auth.authorizationSignUpRequired') {
            console.log(`error:`, signInResult._);
            return {state: 'err', data: Errors.PHONE_NUMBER_UNOCCUPIED};
        }

        return {state: 'ok', data: signInResult}
    } catch (error) {
        console.log('error:', error)
        switch (error.error_message){
            case 'PHONE_NUMBER_UNOCCUPIED':
                return {state: 'err', data: Errors.PHONE_NUMBER_UNOCCUPIED}
            case 'PHONE_NUMBER_INVALID':
                return {state: 'err', data: Errors.PHONE_NUMBER_INVALID}
            case 'PHONE_CODE_EXPIRED':
                return {state: 'err', data: Errors.PHONE_CODE_EXPIRED}
            case 'PHONE_CODE_INVALID':
                return {state: 'err', data: Errors.PHONE_CODE_INVALID}
            case 'SESSION_PASSWORD_NEEDED':
                return {state: 'err', data: Errors.SESSION_PASSWORD_NEEDED}
            default:
                return {state: 'err', data: Errors.UNEXPECTED_ERROR}
        }
    }
}

// Авторизация с паролем (для 2FA)
export async function authByPass(password) {
    try{
        const {srp_id, current_algo, srp_B} = await TgCore.getPassword();
        const {g, p, salt1, salt2} = current_algo;

        const {A, M1} = await TgCore.api.mtproto.crypto.getSRPParams({
            g,
            p,
            salt1,
            salt2,
            gB: srp_B,
            password,
        });

        const checkPasswordResult = await TgCore.checkPassword({srp_id, A, M1});
        return {state: 'ok', data: checkPasswordResult}
    } catch (error) {
        console.log('error:', error)
        switch (error.error_message) {
            case 'PASSWORD_HASH_INVALID':
                return {state: 'err', data: Errors.PASSWORD_HASH_INVALID}
            default:
                return {state: 'err', data: Errors.UNEXPECTED_ERROR}
        }
    }
}

// Выход из аккаунта пользователя
export async function logOut() {
    console.log('User logged out')
    return TgCore.logOut()
}


// Принимает инвайт линк (https://t.me/+v0F9TuhlPaxjMjMy) с помощью которого выбирается чат
// Возвращает объект чата и его пользователей чата
export async function getUsersByInvitationLink(invitationLink) {
    let invitationHash = '';

    if (invitationLink.includes('.me/+'))
        invitationHash = invitationLink.split('.me/+')[1];
    else if (invitationLink.includes('joinchat/'))
        invitationHash = invitationLink.split('joinchat/')[1];
    else
        invitationHash = invitationLink.split('.me/')[1];

    const gChat = await TgCore.checkChatInvite(invitationHash);
    console.log(gChat);

    if(gChat.chat._ === "chat") {
        const participants = await TgCore.getFullChat(gChat.chat.id);
        console.log(participants);

        return {state: 'ok', gChat:gChat, users:participants.users};
    } else if(gChat.chat._ === "channel") {
        const inputChannel = {
            _: 'inputChannel',
            channel_id: gChat.chat.id,
            access_hash: gChat.chat.access_hash
        };
        const channelParticipantsFilter = {
            _: 'channelParticipantsSearch',
            q: ''
        };
        const participants = await TgCore.getParticipants({
            channel: inputChannel,
            filter: channelParticipantsFilter,
            offset: 0,
            limit: 200,
            hash: 0
        });
        console.log(participants)

        return {state: 'ok', gChat:gChat, users:participants.users};
    }else{
        // Ошибка получения канала по ссылке (тип не чат и не канал)
        return {state: 'err', gChat:'', users:''};
    }
}

// Запускает процесс импорта после всех настроек
export async function startImport(gChat, data) {
    console.log(await TgCore.checkHistoryImport(data));

    let inputPeer = null;
    if(gChat.chat._ === "chat") {
        inputPeer = {
            _: 'inputPeerChat',
            chat_id: gChat.chat.id,
        };
    }else if(gChat.chat._ === "channel"){
        inputPeer = {
            _: 'inputPeerChannel',
            channel_id: gChat.chat.id,
            access_hash: gChat.chat.access_hash
        };
    }else{
        return false;
    }
    console.log(await TgCore.checkHistoryImportPeer(inputPeer));

    const inputFile = await upload_file(data, 'import_file.txt');

    inputPeer = {
        _: 'inputPeerChannel',
        channel_id: gChat.chat.id,
        access_hash: gChat.chat.access_hash
    };
    let initHistoryCallback = await TgCore.initHistoryImport({
        peer: inputPeer,
        file: inputFile,
        media: 0, // изменить
    });
    console.log(initHistoryCallback)

    console.log(await TgCore.startHistoryImport({
        peer: inputPeer,
        import_id: initHistoryCallback.id
    }));

}

// загрузка inputFile на сервер с разбиением (для текста и изображений)
async function upload_file(data, name) {
    const byteTextArray = Lib.toUTF8Array(data);
    const byteTextArrayLength = byteTextArray.length;
    const fileId = Date.now();
    let filePart = 524288;

    while (byteTextArrayLength < filePart && filePart > 1024) {
        filePart = filePart / 2;
    }

    let part = 0;
    for (let i = 0; i < byteTextArrayLength; i += filePart, part++) {
        const savedPart = await TgCore.api.call('upload.saveFilePart', {
            file_id: fileId,
            file_part: part,
            bytes: byteTextArray.slice(i, i + filePart)
        });
        console.log(savedPart);
    }

    const inputFile = {
        _: 'inputFile',
        id: fileId,
        parts: part,
        name: name,
        md5_checksum: CryptoJS.MD5(data)
    };

    console.log('pre-init');

    return inputFile;
}
