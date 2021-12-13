const Emitter = require('./event_emitter').default;
const Constants = require('./../constants');
const Errors = Constants.errors;
const Lib = require('./../lib');

const peopleImport = new PeopleImport();
export default peopleImport;

class PeopleImport {
    _formInsertionPromise = undefined;
    _convUserData = [];
    _usersLoaded = false;
    
    constructor() {
        this._formInsertionPromise = fetch(chrome.runtime.getURL('./src/html/people_import_form.html'))
            .then(response => { return response.text() })
            .then((data) => {
                let formDom = new DOMParser().parseFromString(data, 'text/html');
                formDom.getElementById('import_people_next_button').addEventListener('click',
                    (event) => Emitter.emit('event:people-import-completed', { }));
                
                formDom.getElementById('people_import_back_button').addEventListener('click',
                    (event) => Emitter.emit('event:people-import-back', { }));
                
                return formDom;
            })
            .then(formDom => {
                document.getElementsByClassName('popup_box_container')[0].appendChild(formDom.body.firstElementChild);
            });
    }
    
    show() {
        this._formInsertionPromise
        .then(() => {
            people_import_form.classList.remove('hidden');
            
            if (!this._usersLoaded) {
                this.loadConversationMembers();
                this._usersLoaded = true;
            }
        })
    }
    
    hide() {
        this._formInsertionPromise
        .then(() => people_import_form.classList.add('hidden'));
    }
    
    clean() {
        this.cleanMemberList();
        this._usersLoaded = false;
    }
    
    userDataHandler = event => {
        //!!!!!!!!!! здесь получаем данные по номеру телефона и @user нику и отправляем
        let idAttr = event.currentTarget.getAttribute('id');
        let userId = idAttr.slice('settings_address_submit'.length, idAttr.length);
        let data = document.getElementById(`flist_acc${userId}`).value;
        let error = this.sendData(data);
        
        if (error === Errors.NO_ERROR) {
            this.clearPeopleImportErrorHTML(userId);
            document.getElementById(`flist_item_wrap${userId}`).classList.remove('unfolded');
        }
        else
            this.errorHandler(userId, error);
        event.stopPropagation();
    }
    
    sendData(data) {
        //!!!!!! отправляем данные
        if (data.length === 0)
            return Errors.EMPTY_VALUE;
        
        return Errors.NO_ERROR;
    }
    
    errorHandler(userId, err) {
        switch (err) {
            case Errors.NO_ERROR:
                break;
                
            case Errors.EMPTY_VALUE:
                this.clearPeopleImportErrorHTML(userId);
                this.peopleImportErrorHTML(userId, '<b>Поле пустое</b>. Введите номер телефона или никнейм.');
                break;
                
            default:
                throw new Error('No handler occured');
        }
    }
    
    clearPeopleImportErrorHTML(userId) {
        this._formInsertionPromise
        .then(() => document.getElementById(`flist_error_acc${userId}`).innerHTML = '');
    }

    peopleImportErrorHTML(userId, errorString) {
        this._formInsertionPromise
        .then(() => document.getElementById(`flist_error_acc${userId}`).innerHTML = 
            `<div class="vtelegram_msg msg error"><div class="msg_text">${errorString}</div></div>`);
    }
    
    loadConversationMembers() {
        this._formInsertionPromise
        .then(async () => {
            const urlParams = new URLSearchParams(location.search);
            const selID = urlParams.get(Constants.VK_MSG_ID_PARAM);
            let dialogId;
            
            if (selID) {
                dialogId = (selID[0] === 'c') ? dialogId = Constants.CONVERSATION_START_ID + parseInt(selID.slice(1)) : dialogId = selID;
                const startData = `act=a_start&al=1&block=true&gid=0&history=1&im_v=3` +
                                    `&msgid=false&peer=${dialogId}&prevpeer=0`;
                const result = await Lib.request(Constants.requestURL['start_history'], 'POST', startData);
                if (result.ok) {
                    const jsonStartData = await result.text()              
                                                .then(text => { return JSON.parse(text); });

                    this._convUserData = jsonStartData['payload'][1][1];
                    for (let user of this._convUserData) {        
                        
                        let userListElem = new DOMParser();
                        userListElem = userListElem.parseFromString(
                        `<div id="flist_item_wrap${user['id']}" class="flist_line">
                            <div class="flist_item_wrap flist_info_block" id="flist_item${user['id']}">
                                <div class="flist_item clear_fix" tabindex="0" role="link" aria-label="${user['name']}">
                                    <div class="flist_item_img">
                                        <img class="flist_item_thumb" src="${user['photo']}" alt="${user['name']}">
                                    </div>
                                    <div class="flist_item_name">${user['name']}</div>
                                </div>
                            </div>
                            <div class="flist_change_block">
                                <div class="clear_fix" tabindex="0" role="link" aria-label="${user['name']}" style="margin-bottom: 14px;">
                                    <div class="flist_item_img">
                                        <img class="flist_item_thumb" src="${user['photo']}" alt="${user['name']}">
                                    </div>
                                    <div class="flist_item_name">${user['name']}</div>
                                </div>
                                <div id="flist_error_acc${user['id']}"></div>
                                <div class="settings_row clear_fix">
                                    <div class="settings_label">Телефон или никнейм</div>
                                    <a id="flist_cancel_button${user['id']}" class="settings_right_control" tabindex="0" role="link">Отмена</a>
                                    <div class="settings_labeled">
                                        <div class="prefix_input_wrap" id="flist_acc_wrap${user['id']}" style="width: 200px;">
                                            <div class="prefix_input_field">
                                                <input id="flist_acc${user['id']}" type="text" class="prefix_input" maxlength="20" value="" autocomplete="off" style="padding-left: 9px;">
                                                <div class="prefix_input_border"></div>
                                            </div>
                                        </div>
                                        <div class="settings_row_hint">Введите <b>номер телефона пользователя или никнейм формата @user</b>.</div>
                                        <div class="settings_row_hint">Если данные не будут введены, пользователь будет импортирован с именем и фамилией во ВКонтате без привязки к аккаунту.</div>
                                    </div>
                                </div>
                                <div class="settings_row_button_wrap">
                                    <button id="settings_address_submit${user['id']}" class="flat_button">Добавить аккаунт</button>
                                </div>
                            </div> 
                        </div>`
                        , 'text/html');
                        
                        userListElem.getElementById(`flist_item_wrap${user['id']}`).addEventListener('click', 
                            (event) => {
                                for (let userDiv of document.getElementsByClassName('flist_line'))
                                    userDiv.classList.remove('unfolded');
                                
                                event.currentTarget.classList.add('unfolded');
                            }
                        );
                        
                        userListElem.getElementById(`flist_cancel_button${user['id']}`).addEventListener('click', 
                            (event) => {
                                let idAttr = event.currentTarget.getAttribute('id');
                                let userId = idAttr.slice('flist_cancel_button'.length, idAttr.length);
                                document.getElementById(`flist_item_wrap${userId}`).classList.remove('unfolded');
                                event.stopPropagation();
                            }
                        );
                        
                        userListElem.getElementById(`settings_address_submit${user['id']}`).addEventListener('click', this.userDataHandler);
                        
                        document.getElementById('flist_all_list').appendChild(userListElem.body.firstElementChild);
                    }
                }
            }
        });
    }
    
    cleanMemberList() {
        for (let user of this._convUserData)
            document.getElementById(`flist_item_wrap${user['id']}`).remove();
        
        this._convUserData = [];
    }
}; 
