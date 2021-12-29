const Emitter = require('./event-emitter').default;

const Errors = require('./../constants').errors;

const TgLib = require('./../tg-lib')

const telegramAuth = new TelegramAuth();
export default telegramAuth;

class TelegramAuth {
    _formInsertionPromise = undefined;
    gPhoneCodeHash = '';
    gPhone = '';
    gFloodTime = '00:00:00';

    constructor() {
        this._formInsertionPromise = fetch(chrome.runtime.getURL('./src/html/telegram-auth-form.html'))
            .then(response => {
                return response.text();
            })
            .then(data => {
                let formDom = new DOMParser().parseFromString(data, 'text/html');

                formDom.getElementById('validation_send_phone').addEventListener('click', this.sendPhoneHandler);
                formDom.getElementById('validation_send_code').addEventListener('click', this.sendCodeHandler);
                formDom.getElementById('validation_send_password').addEventListener('click', this.sendPasswordHandler);

                formDom.getElementById('validation_phone').addEventListener('keydown',
                    async (event) => {
                        if (event.keyCode == 10 || event.keyCode == 13)
                            await this.sendPhoneHandler(event);
                    });
                formDom.getElementById('validation_code').addEventListener('keydown',
                    async (event) => {
                        if (event.keyCode == 10 || event.keyCode == 13)
                            await this.sendCodeHandler(event);
                    });
                formDom.getElementById('validation_password').addEventListener('keydown',
                    async (event) => {
                        if (event.keyCode == 10 || event.keyCode == 13)
                            await this.sendPasswordHandler(event);
                    });

                formDom.getElementById('validation_other_phone').addEventListener('click',
                    (event) => this.clean());

                document.getElementsByClassName('popup_box_container')[0].appendChild(formDom.body.firstElementChild);
            });
    }

    show() {
        this._formInsertionPromise
            .then(() => telegram_auth_form.classList.remove('hidden'));
    }

    hide() {
        this._formInsertionPromise
            .then(() => telegram_auth_form.classList.add('hidden'));
    }

    clean() {
        this.clearPhoneValidationErrorHTML();

        this.gPhoneCodeHash = '';
        this.gPhone = '';
        this.gFloodTime = '00:00:00';

        document.getElementById('validation_phone').value = '';
        document.getElementById('validation_code').value = '';
        document.getElementById('validation_password').value = '';

        this.unsetPhoneBlockReadOnly();
        this.showPhoneButton();

        this.unsetCodeBlockReadOnly();
        this.hideCodeBlock();

        this.unsetPasswordBlockReadOnly();
        this.hidePasswordBlock();
    }

    sendPhoneHandler = async event => {
        let phone = document.getElementById('validation_phone').value;

        let error = await this.sendPhone(phone);

        if (error === Errors.NO_ERROR) {
            this.clearPhoneValidationErrorHTML();
            this.showCodeBlock();
            this.setPhoneBlockReadOnly();
            this.hidePhoneButton();
            document.getElementById('validation_code').focus();
        } else
            this.errorHandler(error);
    }

    sendCodeHandler = async event => {
        let code = document.getElementById('validation_code').value;

        let error = await this.sendCode(code);

        if (error === Errors.NO_ERROR) {
            //Если все ок, меняем окошко
            this.clearPhoneValidationErrorHTML();
            this.setCodeBlockReadOnly();
            this.hideCodeButton();
            Emitter.emit('event:auth-completed', {});
        } else
            this.errorHandler(error);
    }

    sendPasswordHandler = async event => {
        let password = document.getElementById('validation_password').value;

        let error = await this.sendPassword(password);

        if (error === Errors.NO_ERROR) {
            this.clearPhoneValidationErrorHTML();
            this.setPasswordBlockReadOnly();
            this.hidePasswordBlock();
            Emitter.emit('event:auth-completed', {});
        } else
            this.errorHandler(error);
    }

    async sendPhone(phone) {
        if (!(/^(\s*)?(\+)?\d{1,3}[ ]?[- ()]?\d{3}[- ()]?([- ]?\d){6,12}(\s*)?$/.test(phone)))
            return Errors.PHONE_FORMAT_ERROR;

        const result = await TgLib.getCodeByPhone(phone)
        console.log(result)
        if (result.state === 'err') {
            if (result.data === Errors.FLOOD_WAIT)
                this.gFloodTime = result.time;
            return result.data;
        }
        this.gPhone = phone;
        this.gPhoneCodeHash = result.data;
        return Errors.NO_ERROR;
    }

    async sendCode(code) {
        if (!(/^[0-9]+$/.test(code)))
            return Errors.PHONE_FORMAT_ERROR;

        const result = await TgLib.authByCode(code, this.gPhone, this.gPhoneCodeHash);
        if (result.state === 'err')
            return result.data;

        return Errors.NO_ERROR;
    }

    async sendPassword(password) {
        const result = await TgLib.authByPass(password)
        if (result.state === 'err')
            return result.data;

        return Errors.NO_ERROR;
    }

    showPhoneButton() {
        document.getElementById('validation_phone_submit').style.display = 'block';
    }

    setPhoneBlockReadOnly() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_other_phone').style.display = 'block';
                document.getElementById('validation_phone').classList.add('vtelegram_validation_readonly');
                document.getElementById('validation_phone').setAttribute('readonly', '');
            });
    }

    unsetPhoneBlockReadOnly() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_other_phone').style.display = 'none';
                document.getElementById('validation_phone').classList.remove('vtelegram_validation_readonly');
                document.getElementById('validation_phone').removeAttribute('readonly');
            });
    }

    hidePhoneButton() {
        document.getElementById('validation_phone_submit').style.display = 'none';
    }

    showCodeBlock() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_code_submit').style.display = 'block';
                document.getElementById('validation_code_row').style = 'overflow: visible; margin-top: 0px; margin-bottom: 10px; padding-top: 0px; padding-bottom: 0 px';
                document.getElementById('validation_resend').style.display = 'block';
            });
    }

    showCodeButton() {
        document.getElementById('validation_code_submit').style.display = 'block';
    }

    setCodeBlockReadOnly() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_code').classList.add('vtelegram_validation_readonly');
                document.getElementById('validation_code').setAttribute('readonly', '');
            });
    }

    unsetCodeBlockReadOnly() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_code').classList.remove('vtelegram_validation_readonly');
                document.getElementById('validation_code').removeAttribute('readonly');
            });
    }

    hideCodeButton() {
        document.getElementById('validation_code_submit').style.display = 'none';
    }

    hideCodeBlock() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_code_row').style.display = 'none';
                document.getElementById('validation_resend').style.display = 'none;';
                document.getElementById('validation_code_submit').style.display = 'none';
            });
    }

    showPasswordBlock() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_password_submit').style.display = 'block';
                document.getElementById('validation_password_row').style = 'overflow: visible; margin-top: 0px; margin-bottom: 10px; padding-top: 0px; padding-bottom: 0 px';
            });
    }

    showPasswordButton() {
        document.getElementById('validation_password_submit').style.display = 'block';
    }

    setPasswordBlockReadOnly() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_password').classList.add('vtelegram_validation_readonly');
                document.getElementById('validation_password').setAttribute('readonly', '');
            });
    }

    unsetPasswordBlockReadOnly() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_password').classList.remove('vtelegram_validation_readonly');
                document.getElementById('validation_password').removeAttribute('readonly');
            });
    }

    hidePasswordButton() {
        document.getElementById('validation_password_submit').style.display = 'none';
    }

    hidePasswordBlock() {
        this._formInsertionPromise
            .then(() => {
                document.getElementById('validation_password_submit').style.display = 'none';
                document.getElementById('validation_password_row').style.display = 'none';
            });
    }

    clearPhoneValidationErrorHTML() {
        this._formInsertionPromise
            .then(() => document.getElementById('validation_submit_result').innerHTML = '');
    }

    phoneValidationErrorHTML(errorString) {
        this._formInsertionPromise
            .then(() => document.getElementById('validation_submit_result').innerHTML =
                `<div class="vtelegram_msg msg error"><div class="msg_text">${errorString}</div></div>`);
    }

    errorHandler(error) {
        switch (error) {
            case Errors.NO_ERROR:
                console.log('VTelegram: все хорошо, жизнь продолжается :)');
                break;

            case Errors.PHONE_FORMAT_ERROR:
                this.phoneValidationErrorHTML('<b>Ошибка формата номера телефона</b>.<br>Введите номер <b>в международном формате</b> без лишних символов. Например: +7 921 0000007');
                break;

            case Errors.PHONE_NUMBER_FLOOD:
                this.phoneValidationErrorHTML('<b>Превышено количество попыток получения кода</b>.<br>Вы выполняли этот запрос слишком часто. Пожалуйста, попробуйте позже');
                break;

            case Errors.PHONE_PASSWORD_FLOOD:
                this.phoneValidationErrorHTML('<b>Превышено количество попыток входа для телефона</b>.<br>Вы выполняли этот запрос слишком часто. Пожалуйста, попробуйте позже');
                break;

            case Errors.PHONE_NUMBER_INVALID:
                this.phoneValidationErrorHTML('<b>Ошибка идентификации пользователя по телефону</b>.<br>Возможно, номер введён некорректно или пользователя с таким номером не существует');
                break;

            case Errors.PHONE_NUMBER_UNOCCUPIED:
                this.phoneValidationErrorHTML('<b>Пользователя с таким номером не существутет</b>.<br>Проверьте корректность номера телефона, либо зарегистрируйтесь в Telegram');
                break;

            case Errors.PHONE_CODE_FORMAT_ERROR:
                this.phoneValidationErrorHTML('<b>Ошибка формата введённого кода</b>.<br>Удостоверьтесь в том, что не содержит каких-либо символов, кроме цифр');
                break;

            // Добавить resendCode???????????
            case Errors.PHONE_CODE_INVALID:
                this.phoneValidationErrorHTML('<b>Неправильный код</b>.<br>Проверьте корректность введённого кода или перезагрузите страницу, чтобы получить новый');
                break;

            // Добавить resendCode???????????
            case Errors.PHONE_CODE_EXPIRED:
                this.phoneValidationErrorHTML('<b>Истёк срок действия этого кода</b>.<br>Пожалуйста, перезагрузите страницу и введите новый код');
                break;

            case Errors.PASSWORD_HASH_INVALID:
                this.phoneValidationErrorHTML('<b>Неправильный пароль</b>.<br>Проверьте корректность введённых вами данных');
                break;

            case Errors.UNEXPECTED_ERROR:
                this.phoneValidationErrorHTML('<b>Упс... Что-то пошло не так!</b>.<br>Попробуйте перезагрузить страницу. Если проблема не решится – свяжитесь с разработчиками');
                break;

            case Errors.FLOOD_WAIT:
                this.phoneValidationErrorHTML('<b>Лимит запросов исчерпан</b>.<br>Повторите запрос через ' + this.gFloodTime);
                break;

            case Errors.SESSION_PASSWORD_NEEDED:
                this.setCodeBlockReadOnly();
                this.hideCodeBlock();
                this.showPasswordBlock();
                this.phoneValidationErrorHTML(' <b>Ошибка авторизации</b>.<br>Аккаунт защищен двухфакторной авторизацией. Введите пароль.');
                break;

            default:
                throw new Error('No handlers occurred.');
        }
    }
}

