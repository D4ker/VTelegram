const Constants = require("./../constants");

const ExportLib = require("./export-lib");

// Получение прямой ссылки на документ
function getDirectUrl(url) {
    return url;
}

function getMediaUrls(msgId, msgMediaElement) {
    const mediaElements = msgMediaElement.getElementsByTagName('a');
    const audiomsgsElements = msgMediaElement.getElementsByClassName('audio-msg-track clear_fix');

    const mediaObj = {
        photos: [],
        videos: [],
        docs: [],
        audiomsgs: [],
        audios: [],
        wall_posts: []
    };

    for (let media of mediaElements) {
        if (media.getAttribute('data-photo-id')) { // фото
            const photoObj = JSON.parse(`${media.getAttribute('onclick').match(`"temp":({.*?})`)[1]}`);
            let max = -1;
            let photoUrl = '';
            for (let photo in photoObj) {
                if (photo[1] === '_') {
                    const photoWidth = parseInt(photoObj[photo][1], 10);
                    const photoHeight = parseInt(photoObj[photo][2], 10);
                    const photoSize = photoWidth * photoHeight;
                    if (photoSize > max) {
                        max = photoSize;
                        photoUrl = photoObj[photo][0];
                    }
                }
            }
            mediaObj.photos.push(photoUrl);
        } else if (media.getAttribute('data-video')) { // видео

            // mediaObj.videos.push();
        } else if (Constants.docTypes.indexOf(media.getAttribute('class')) !== -1) { // документы
            const url = getDirectUrl(Constants.MEDIA_PREFIX + media.getAttribute('href'));
            mediaObj.docs.push(url);
        } else if (media.getAttribute('class') === 'post_link') { // посты из групп
            const url = Constants.MEDIA_PREFIX + media.getAttribute('href');
            mediaObj.wall_posts.push(url);
        } else if (media.getAttribute('audio')) { // аудио (музыка)
            // mediaObj.audios.push();
        }
    }

    for (let audiomsg of audiomsgsElements) { // аудиосообщения
        mediaObj.audiomsgs.push(audiomsg.getAttribute('data-mp3'));
    }

    return mediaObj;
}

export function exportUrl(msgId, msgDateTime, msgSender, msgMediaElement) {
    const mediaObj = getMediaUrls(msgId, msgMediaElement);
    for (let media in mediaObj) {
        for (let url of mediaObj[media]) {
            ExportLib.gImportedData.text += `${msgDateTime} - ${msgSender}: <${media}> ::: ${url}\n`;
        }
    }
}

export function exportCloud(msgId, msgDateTime, msgSender, msgMediaElement) {

}

export function exportBot(msgId, msgDateTime, msgSender, msgMediaElement) {

}