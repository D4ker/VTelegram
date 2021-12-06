// Код Влада

const TgCore = require('./tg_core');

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

export async function interface() {
    await authorize();
}
