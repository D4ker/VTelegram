const Emitter = require('./event-emitter').default;
const Constants = require('./../constants');
const Errors = Constants.errors;

const settings = new Settings();
export default settings;

class Settings {
    _formInsertionPromise = undefined;
    _isCursorInsideIdd = false;

    videoImportType = Constants.EXPORT_MEDIA_URL_MODE;
    imageImportType = Constants.EXPORT_MEDIA_URL_MODE;
    docImportType = Constants.EXPORT_MEDIA_URL_MODE;
    
    constructor() {
        this._formInsertionPromise = fetch(chrome.runtime.getURL('./src/html/settings-form.html'))
            .then(response => {
                return response.text()
            })
            .then(data => {
                let formDom = new DOMParser().parseFromString(data, 'text/html');

                //адрес беседы
                let currentCode = '';
                formDom.getElementById('settings_change_button').addEventListener('click',
                    (event) => {
                        let currentLink = document.getElementById('settings_addr').value;
                        currentCode = currentLink.slice(Constants.TELEGRAM_CNV_PATH.length, currentLink.length);
                        document.getElementById('chgaddr').classList.add('unfolded');
                    });

                formDom.getElementById('settings_addr').addEventListener('input',
                    (event) => {
                        if (event.target.value.length === 0)
                            document.getElementById('settings_address_submit').classList.add('button_disabled');
                        else
                            document.getElementById('settings_address_submit').classList.remove('button_disabled');
                    });
                
                formDom.getElementById('settings_cancel_button').addEventListener('click',
                    (event) => {
                        if (currentCode.length === 0) {
                            document.getElementById('settings_address_telegram').innerText = '';
                            document.getElementById('settings_address_telegram').nextSibling.textContent = 'Адрес не введен';
                            document.getElementById('settings_addr').value = '';
                        } else {
                            document.getElementById('settings_address_telegram').innerText = Constants.TELEGRAM_CNV_PATH;
                            document.getElementById('settings_address_telegram').nextSibling.textContent = currentCode;
                        }

                        document.getElementById('chgaddr').classList.remove('unfolded');
                    });

                formDom.getElementById('settings_address_submit').addEventListener('click', this.settingsAddressHandler);
                
                //чекбоксы с материалами
                formDom.getElementById('settings_check_video_label').addEventListener('click',
                    (event) => this.changeCheckboxSelection(document.getElementById('settings_check_video')));

                formDom.getElementById('settings_check_image_label').addEventListener('click',
                    (event) => this.changeCheckboxSelection(document.getElementById('settings_check_image')));

                formDom.getElementById('settings_check_doc_label').addEventListener('click',
                    (event) => this.changeCheckboxSelection(document.getElementById('settings_check_doc')));

                document.addEventListener('click', 
                    (event) => {
                        const iddPopups = document.getElementsByClassName("idd_popup");
                        for (let popup of iddPopups) {
                            var isClickInside = popup.contains(event.target);
                            if (!isClickInside)
                                popup.style.display = 'none';
                        }
                    }, true);
                
                formDom.getElementById('settings_next_button').addEventListener('click',
                    (event) => {
                        Emitter.emit('event:settings-completed', {});
                    });
                
                formDom.getElementById('settings_exit_telegram_button').addEventListener('click', 
                    (event) => {
                        Emitter.emit('event:telegram-exit', {});
                    });
                
                document.getElementsByClassName('popup_box_container')[0].appendChild(formDom.body.firstElementChild);

                for (let item of document.querySelectorAll('.vtelegram_box .settings_narrow_row'))
                    this.setDropDownToElement(item);
            })
    }

    show() {
        this._formInsertionPromise
            .then(() => settings_form.classList.remove('hidden'));
    }

    hide() {
        this._formInsertionPromise
            .then(() => settings_form.classList.add('hidden'));
    }

    clean() {
        this._formInsertionPromise
            .then(() => {
                this.clearConvAddressErrorHTML();
                settings_addr.value = '';
                document.getElementById('settings_address_telegram').innerText = '';
                document.getElementById('settings_address_telegram').nextSibling.textContent = 'Адрес не введен';
                document.getElementById('settings_addr').value = '';
                document.getElementById('chgaddr').classList.remove('unfolded');

                for (let input of document.getElementsByClassName('blind_label'))
                    input.checked = 0;

                for (let elem of document.querySelectorAll('.vtelegram_box .settings_narrow_row')) {
                    elem.getElementsByClassName('idd_popup')[0].style.display = 'none';
                    elem.getElementsByClassName('idd_selected_value')[0].innerText = 'Прямой импорт';
                    elem.getElementsByClassName('idd_hl')[0].classList.remove('idd_hl');
                    elem.getElementsByClassName('default')[0].classList.add('idd_hl');
                    elem.getElementsByClassName('idd_header')[0].innerText = 'Прямой импорт';
                    elem.getElementsByClassName('idd_wrap')[0].classList.add('disabled');
                }
            });
    }

    getConvAddress() {
        return document.getElementById('settings_addr').value;
    }
    
    settingsAddressHandler = event => {
        //!!!!! обработка ссылки на беседу телеграм
        let convLink = document.getElementById('settings_addr').value;
        let convCode = convLink.slice(Constants.TELEGRAM_CNV_PATH.length, convLink.length);
        let err = this.sendConvAddress(convCode);

        if (err === Errors.NO_ERROR) {
            this.clearConvAddressErrorHTML();

            document.getElementById('settings_address_telegram').innerText = Constants.TELEGRAM_CNV_PATH;
            document.getElementById('settings_address_telegram').nextSibling.textContent = convCode;
            document.getElementById('chgaddr').classList.remove('unfolded');
        } else
            this.errorHandler(err);
    }

    setDropDownToElement(elem) {
        let selectedValue = elem.getElementsByClassName('idd_selected_value')[0];

        selectedValue.addEventListener('click',
            (event) => {
                let header = elem.getElementsByClassName('idd_header')[0];
                header.innerText = event.target.innerText;
                elem.getElementsByClassName('idd_popup')[0].style.display = 'block';
            });

        elem.getElementsByClassName('idd_header')[0].addEventListener('click',
            (event) => {
                elem.getElementsByClassName('idd_popup')[0].style.display = 'none';
            });

        for (let iddItem of elem.querySelectorAll('.idd_items_wrap .idd_item')) {
            iddItem.addEventListener('mouseenter',
                (event) => {
                    this._isCursorInsideIdd = true;
                    event.target.classList.add('idd_hover');
                    ;
                });

            iddItem.addEventListener('mouseleave',
                (event) => {
                    this._isCursorInsideIdd = false;
                    event.target.classList.remove('idd_hover');
                });

            iddItem.addEventListener('click',
                (event) => {
                    for (let item of elem.getElementsByClassName('idd_popup'))
                        item.style.display = 'none';

                    let textValue = iddItem.getElementsByClassName('idd_item_name')[0].innerText;
                    
                    elem.getElementsByClassName('idd_selected_value')[0].innerText = textValue;
                    elem.getElementsByClassName('idd_popup')[0].style.display = 'none';
                    elem.getElementsByClassName('idd_hl')[0].classList.remove('idd_hl');
                    iddItem.classList.add('idd_hl');
                    
                    this.changeTypeImport(event.currentTarget);
                });
        }
    }

    convAddressErrorHTML(errorString) {
        document.getElementById('settings_error_addr').innerHTML = `<div class="msg error"><div class="msg_text">${errorString}</div></div>`;
    }

    clearConvAddressErrorHTML() {
        document.getElementById('settings_error_addr').innerHTML = '';
    }

    sendConvAddress(code) {
        //!!!!!!!! здесь все отправляем и возвращаем ошибку
        if (code.length === 0)
            return Errors.EMPTY_VALUE;

        return Errors.NO_ERROR;
    }

    changeCheckboxSelection(elem) {
        if (elem.checked) {
            let comboBox = document.querySelector('#' + elem.id + '~.idd_wrap');
            comboBox.getElementsByClassName('idd_popup')[0].style.display = 'none';
            comboBox.classList.add('disabled');
            elem.checked = 0;
        } else {
            document.querySelector('#' + elem.id + '~.idd_wrap').classList.remove('disabled');
            elem.checked = 1;
        }
    }
    
    changeTypeImport(elem) {
        let fileType = elem.id.substr(0, elem.id.indexOf('_'));
        let importType = elem.id.substr(elem.id.indexOf('_') + 1, elem.id.length);
        
        switch (fileType) {
            case 'video':
                this.videoImportType = this.strToImportType(importType);
                break;
            
            case 'image':
                this.imageImportType = this.strToImportType(importType);
                break;
                
            case 'doc':
                this.docImportType = this.strToImportType(importType);
                break;
                
            default:
                throw new Error('VTelegram error: No handler occured for file type: ' + fileType);
                
        };
    }

    strToImportType(str) {
        switch (str) {
            case 'idd_item_drive_links':
                return Constants.EXPORT_MEDIA_CLOUD_MODE;
                break;
                
            case 'idd_item_direct':
                return Constants.EXPORT_MEDIA_BOT_MODE;
                break;
                
            case 'idd_item_vk_links':
                return Constants.EXPORT_MEDIA_URL_MODE;
                break;
                
            default:
                throw new Error('VTelegram error: No handler occured for import type: ' + str);
        };
    }
    
    errorHandler(err) {
        switch (err) {
            case Errors.EMPTY_VALUE:
                this.clearConvAddressErrorHTML();
                this.convAddressErrorHTML('<b>Поле пустое.</b> Введите код беседы или нажмите Отмена.');
                break;

            case Errors.NO_ERROR:
                break;

            default:
                throw new Error('No handler occured');
        }
    }
}; 
