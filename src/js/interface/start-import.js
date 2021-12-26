const Emitter = require('./event-emitter').default;

const startImport = new StartImport();
export default startImport;

class StartImport {

    _formInsertionPromise = undefined;

    constructor() {
        this._formInsertionPromise = fetch(chrome.runtime.getURL('./src/html/start-import-form.html'))
            .then(response => {
                return response.text();
            })
            .then(data => {
                const formDom = new DOMParser().parseFromString(data, 'text/html');

                formDom.getElementById('start_import_button').addEventListener('click',
                    (event) => Emitter.emit('event:start-import', {}));

                formDom.getElementById('start_import_back_button').addEventListener('click',
                    (event) => Emitter.emit('event:start-import-back', {}));
                
                formDom.getElementById('start_import_exit_telegram_button').addEventListener('click', 
                    (event) => {
                        Emitter.emit('event:telegram-exit', {});
                    });
                document.getElementsByClassName('popup_box_container')[0].appendChild(formDom.body.firstElementChild);
            })
    }

    show() {
        this._formInsertionPromise
            .then(() => import_start_form.classList.remove('hidden'));
    }

    hide() {
        this._formInsertionPromise
            .then(() => import_start_form.classList.add('hidden'));
    }

    clean() {
    }
}
