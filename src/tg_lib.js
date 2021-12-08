const Lib = require('./lib');
const TgCore = require('./tg_core');

const CryptoJS = require('crypto-js');

// Код Влада
// процесс авторизации
export async function authorize() {
    const user = await TgCore.getUser();

    if (!user) {

        // заменить
        var phone = prompt('Enter your phone: ');
        console.log('You entered ' + phone);

        const {phone_code_hash} = await TgCore.sendCode(phone);

        // заменить
        var code = prompt('Enter the code: ');
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

            const password = 'USER_PASSWORD';

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

// Код Саши
export async function runInterface(fileText) {
    await authorize();

    const chat = await TgCore.api.call('messages.checkChatInvite', {
        hash: 'sg1KIzmWisc5ZGVi'
    });

    const inputPeer = {
        _: 'inputPeerChannel',
        channel_id: chat.chat.id,
        access_hash: chat.chat.access_hash
    };

    console.log(chat);
    console.log(inputPeer);

    const check = await TgCore.api.call('messages.checkHistoryImport', {
        import_head: fileText.slice(0, 100)
    });
    console.log(check);

    // const file = createFile(gImportedText, 'console.txt', 'text/plain');

    const checkPeer = await TgCore.api.call('messages.checkHistoryImportPeer', {
        peer: inputPeer
    });

    console.log(checkPeer);

    const byteTextArray = Lib.toUTF8Array(fileText);

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
        name: 'import_file.txt',
        md5_checksum: CryptoJS.MD5(fileText)
    };

    console.log('pre-init');

    const initHistoryImport = await TgCore.api.call('messages.initHistoryImport', {
        peer: inputPeer,
        file: inputFile,
        media_count: 0
    });

    console.log('init');
    console.log(initHistoryImport);

    const historyImport = await TgCore.api.call('messages.startHistoryImport', {
        peer: inputPeer,
        import_id: initHistoryImport.id
    });

    console.log(historyImport);
}
