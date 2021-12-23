/*========= Google Drive updating part ==========*/
/* только для background.js */

//links - массив объектов, у которых поля: fileName - имя файла, linkUrl - url файла

export function uploadFiles(folderId, links) {
    getToken()
    .then(async () => {
        let driveLinks = {}; 
        for (let linkInfo of links) {
            let driveLink = /*remove await */await uploadMediaToDrive(linkInfo['linkUrl'], linkInfo['fileName'], folderId); 
            driveLinks[linkInfo['linkUrl']] = driveLink;
        }
        return driveLinks;
    });
}

export function uploadFile(folderId, link) {
    getToken()
    .then(() => {
        return uploadMediaToDrive(link['linkUrl'], link['fileName'], folderId); 
    });
}

export function createChatFolder(folderName) {
    return setMainExtFolder()
    .then(rootFolderId => {
        return createFolder(folderName, rootFolderId)
        .then(parseJson);
    });
}

function getToken() {
    return new Promise((resolve, reject) => {
        try {
            chrome.identity.getAuthToken({ interactive: true }, token => resolve(token));
        } catch(err) {
            reject(ex);
        }
    });
}

let processStatus = function (response) {
    if (response.status === 200 ||
        response.status === 0) {
        return Promise.resolve(response)
    } else
        return Promise.reject(new Error('Error loading: ' + url));
};

let parseText = function (response) {
    return response.text();
};

let parseBlob = function (response) {
    return response.blob();
};

let parseJson = function (response) {
    return response.json();
};

//нужна, чтобы обрабатывать документы
async function blobToHtml(blob) {
    let html = await new Promise((resolve) => {            
        let reader = new FileReader();
        reader.onload = (e) => resolve(reader.result);
        reader.readAsText(blob);
    });
                 
    return html;
}

//скачивание файлов с вк для разных типов
function downloadFile(url)
{
    return fetch(url)
        .then(processStatus)
        .then(parseBlob); 
};

//если файл существует, возвращает промис с результатом
function fileExist(driveId) {
    return getToken()
    .then(async token => {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}?fields=trashed`, {
            method: 'GET',
            headers: new Headers({ 'authorization': 'Bearer ' + token, }),
        })
        let json = await response.json(); 
        if (response.ok && (json['trashed'] !== true)) 
            return true;
        else
            return false;
    });
}

//создаем папку
function createFolder(fileName, parent = 'root') {
    let file_metadata = {
        name: fileName,
        mimeType: 'application/vnd.google-apps.folder'
    }
    if (parent !== 'root')        
        file_metadata = Object.assign(file_metadata, { parents: [ parent ]} );

    return getToken()
    .then(token => {
        let headers = new Headers({ 
                        'authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                        });
        return fetch(`https://www.googleapis.com/drive/v3/files`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(file_metadata)
        });
    });
}

//создаем главную папку с чатами и сохраняем ид в хранилище
function setMainExtFolder() {
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get("VTelegramChatsFolderId", function(result) {
            if (result["VTelegramChatsFolderId"]) {
                fileExist(result["VTelegramChatsFolderId"])
                .then(exist => {
                    if (!exist) {
                        createFolder("VTelegramChatsFolder")
                        .then(result => {
                            result.json()
                            .then(json => {
                                chrome.storage.sync.set({ 'VTelegramChatsFolderId' : json['id'] }); 
                                resolve(json['id']);
                            }); 
                        });
                        return;
                    }
                    resolve(result["VTelegramChatsFolderId"]);
                });
            } else {
                createFolder("VTelegramChatsFolder") 
                .then(result => {
                    result.json()
                    .then(json => { 
                        chrome.storage.sync.set({ 'VTelegramChatsFolderId' : json['id'] } ); 
                        resolve(json['id']);
                    });
                })
            }
        });
    });
}

function uploadMediaToDrive(url, fileName = 'file', folderId) {
    return downloadFile(url)
    .then(blob => { 
        let file = blob;
        const metadata = { 
                            name: fileName,
                            parents: [ folderId ],
                        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)],
                                        { type: 'application/json' }));
        

        form.append('file', file);
        getToken()
        .then(token => {
            let headers = new Headers({ 
                'authorization': 'Bearer ' + token,
            });
            
            return fetch('https://www.googleapis.com/upload/drive/v3/files?fields=id,webViewLink&uploadType=multipart', {
                method: 'POST',
                headers: headers,
                body: form
            })
            .then(parseJson)
            .then(data => { 
                const metadata = {
                                    role: 'reader',
                                    type: 'anyone'
                                };
                getToken()
                .then(token => {
                    fetch(`https://www.googleapis.com/drive/v3/files/${data['id']}/permissions`, {
                        method: 'POST',
                        headers: new Headers({ 
                                                Authorization: 'Bearer ' + token,
                                                'Content-Type': 'application/json'
                                            }),
                        body: JSON.stringify(metadata)
                    });
                });

                return data['webViewLink']; 
            });
        });
    });
}
