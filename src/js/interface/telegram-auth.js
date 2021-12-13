const Emitter = require('./event-emitter').default;

const Errors = require('./../constants').errors;

const telegramAuth = new TelegramAuth();
export default telegramAuth;

class TelegramAuth {
    _formInsertionPromise = undefined;
    
    constructor() {
        this._formInsertionPromise = fetch(chrome.runtime.getURL('./src/html/telegram-auth-form.html'))
            .then(response => { return response.text(); })
            .then(data => {
                let formDom = new DOMParser().parseFromString(data, 'text/html');
                
                formDom.getElementById('validation_send_phone').addEventListener('click', this.sendPhoneHandler);
                formDom.getElementById('validation_send_code').addEventListener('click', this.sendCodeHandler);
                formDom.getElementById('validation_send_password').addEventListener('click', this.sendPasswordHandler);
                  
                formDom.getElementById('validation_phone').addEventListener('keydown',
                    (event) => { 
                        if (event.keyCode == 10 || event.keyCode == 13)
                            this.sendPhoneHandler(event);
                    });
                formDom.getElementById('validation_code').addEventListener('keydown',
                    (event) => {
                        if (event.keyCode == 10 || event.keyCode == 13)
                            this.sendCodeHandler(event);
                    });
                formDom.getElementById('validation_password').addEventListener('keydown', 
                    (event) => {
                        if (event.keyCode == 10 || event.keyCode == 13)
                            this.sendPasswordHandler(event);
                    });
                
                formDom.getElementById('validation_other_phone').addEventListener('click', 
                    (event) => this.clean());
                
                formDom.getElementById('auth_next_button').addEventListener('click', (event) => Emitter.emit('event:auth-completed', { }));
                
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
        
        document.getElementById('validation_phone').value = '';
        document.getElementById('validation_code').value = '';
        document.getElementById('validation_password').value = '';
        
        this.unsetPhoneBlockReadOnly();
        this.showPhoneButton();
        
        this.unsetCodeBlockReadOnly();
        this.hideCodeBlock();
        
        this.unsetPasswordBlockReadOnly();
        this.hidePasswordBlock();
        
        document.getElementById('auth_next_button').classList.add('button_disabled');
    }
    
    sendPhoneHandler = event =>
    {
        let phone = document.getElementById('validation_phone').value;
        
        let error = this.sendPhone(phone);
        
        if (error === Errors.NO_ERROR) {
            this.clearPhoneValidationErrorHTML();
            this.showCodeBlock();
            this.setPhoneBlockReadOnly();
            this.hidePhoneButton();
            document.getElementById('validation_code').focus();
        } else
            this.errorHandler(error);
    }
    
    sendCodeHandler = event =>
    {
        let code = document.getElementById('validation_code').value;
        
        let error = this.sendCode(code);                        
        
        if (error === Errors.NO_ERROR) {
            //Если все ок, меняем окошко
            this.clearPhoneValidationErrorHTML();
            this.setCodeBlockReadOnly();
            this.hideCodeButton();
            document.getElementById('auth_next_button').classList.remove('button_disabled');
            Emitter.emit('event:auth-completed', { });
        } else
            this.errorHandler(error);
    }

    sendPasswordHandler = event => {
        let password = document.getElementById('validation_password').value;
        
        let error = this.sendPassword(password);
        
        if (error === Errors.NO_ERROR) {
            this.clearPhoneValidationErrorHTML();
            this.setPasswordBlockReadOnly();
            this.hidePasswordBlock();
            document.getElementById('auth_next_button').classList.remove('button_disabled');
            Emitter.emit('event:auth-completed', { });
        } else
            this.errorHandler(error);
    }
    
    sendPhone(phone) {
        //!!!!!!!!!!!! проверить телефон и отправить(ниже прост пример ошибки из инета)
        if (!(/(\+7|8)[- _]*\(?[- _]*(\d{3}[- _]*\)?([- _]*\d){7}|\d\d[- _]*\d\d[- _]*\)?([- _]*\d){6})/g.test(phone)))
            return Errors.PHONE_FORMAT_ERROR;

        return Errors.NO_ERROR;
    }
    
    sendCode(code) {
        //!!!!!!!!!!!!!! проверить код и отправить
        //ниже пример якобы ошибки
        return Errors.SESSION_PASSWORD_NEEDED
    }
    
    sendPassword(password) {
        //!!!!!!!!!! проверить пароль и отправить
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
                this.phoneValidationErrorHTML('<b>Неверный номер телефона</b>.<br>Введите номер <b>в международном формате</b>. Например: +7 921 0000007');
                break;
                
            case Errors.SESSION_PASSWORD_NEEDED:
                this.setCodeBlockReadOnly();
                this.hideCodeBlock();
                this.showPasswordBlock();
                this.phoneValidationErrorHTML(' <b>Ошибка авторизации</b>.<br>Аккаунт защищен двухфакторной авторизацией. Введите пароль.');
                break;
                
            default:
                throw new Error('No handlers occured.');
        };
    }
}; 

