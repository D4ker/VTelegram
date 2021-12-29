const Emitter = require('./event-emitter').default;
const Errors = require('./../constants').errors;

const TgLib = require('./../tg-lib');
const ExportLib = require("./../export/export-lib");

const mainForm = new MainForm();
export default mainForm;

class MainForm {
    _formInsertionPromise = undefined;

    _telegramAuth = undefined;
    _settings = undefined;
    _peopleImport = undefined;
    _startImport = undefined;

    constructor() {
        this._formInsertionPromise = fetch(chrome.runtime.getURL('./src/html/main-form.html'))
            .then(response => {
                return response.text()
            })
            .then(data => {
                let formDom = new DOMParser().parseFromString(data, 'text/html');
                formDom.getElementsByClassName('box_x_button')[0].addEventListener('click', event => this.close());
                document.getElementById('box_layer').appendChild(formDom.body.firstElementChild);

                document.addEventListener('click',
                    (event) => {
                        let isClickInside = main_form.contains(event.target);
                        if (!isClickInside)
                            this.close();
                    }, true);
            })
            .then(() => {
                this._telegramAuth = require('./telegram-auth').default;

                Emitter.subscribe('event:auth-completed', data => {
                    this.hideBody();
                    this._settings.show();
                });

                this._settings = require('./settings').default;
                Emitter.subscribe('event:settings-completed', data => {
                    this.hideBody();
                    this._peopleImport.show();
                });

                this._peopleImport = require('./people-import').default;
                Emitter.subscribe('event:people-import-completed', data => {
                    this.hideBody();
                    this._startImport.show();
                });
                Emitter.subscribe('event:people-import-back', data => {
                    this.hideBody();
                    this._settings.show();
                });

                // Начинаем экспорт, а затем импорт
                this._startImport = require('./start-import').default;
                Emitter.subscribe('event:start-import', data => {
                    this.close();
                    ExportLib.startExport();
                    // !!!!! здесь импорт
                });
                Emitter.subscribe('event:start-import-back', data => {
                    this.hideBody();
                    this._peopleImport.show();
                });

                Emitter.subscribe('event:telegram-exit', data => {
                    this.hideBody();
                    this._telegramAuth.clean();
                    this._settings.clean();
                    this._peopleImport.clean();
                    this._startImport.clean();
                    this._telegramAuth.show();
                });
            });
    }

    show() {
        this._formInsertionPromise
            .then(async () => {
                document.body.classList.add('layers_shown');
                document.getElementById('box_layer_wrap').style.display = 'block';
                document.getElementById('box_layer_bg').style.display = 'block';
                document.body.style.overflow = 'hidden';
                document.getElementById('main_form').classList.remove('hidden');

                this.hideBody();

                const result = await TgLib.isAuthorized();
                console.log(result);

                if (!result)
                    this._telegramAuth.show();
                else
                    this._settings.show();
            });
    }

    close() {
        this._formInsertionPromise
            .then(() => {
                let exportButton = document.getElementById('ui_rmenu_export_vt');
                this._telegramAuth.clean();
                this._settings.clean();
                this._peopleImport.clean();
                this._startImport.clean();

                document.body.classList.remove('layers_shown');
                document.getElementById('box_layer_wrap').style.display = 'none';
                document.getElementById('box_layer_bg').style.display = 'none';
                document.body.style.overflow = 'auto';
                document.getElementById('main_form').classList.add('hidden');
            });
    }

    hideBody() {
        let boxes = document.getElementsByClassName('vtelegram_box');
        for (let box of boxes)
            box.classList.add('hidden');
    }
}
