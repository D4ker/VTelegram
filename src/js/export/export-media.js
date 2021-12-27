const Lib = require("./../lib");

const Constants = require("./../constants");

const ExportLib = require("./export-lib");

// Получение прямой ссылки на документ
function getDirectUrl(url) {
    return url;
}

async function getVideoUrl(videoElement) {
    const videoData = Lib.toUrlData({
        act: 'show',
        al: 1,
        autoplay: 1,
        list: videoElement.getAttribute('data-list'),
        module: 'im',
        video: videoElement.getAttribute('data-video')
    });
    const result = await Lib.request(Constants.requestURL['video'], 'POST', videoData);
    if (result.ok) {
        const jsonVideoData = await result.json();

        // Получаем прямые ссылки только на видео из вк
        if (jsonVideoData['payload'][1][4]['player']['type'] !== 'vk') {
            return false;
        }

        const video = jsonVideoData['payload'][1][4]['player']['params'][0];
        // const duration = video.duration;
        // const preview = video.jpg;
        const urls = Object.keys(video).filter((key) => /url\d+/.test(key)).sort();
        const url = video[urls[urls.length - 1]];

        return url;
    }
}

async function getMediaUrls(msgId, msgMediaElement) {
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
        } else if (media.getAttribute('data-video') && media.classList.contains('page_post_thumb_video')) { // видео
            const url = await getVideoUrl(media);
            if (url) {
                mediaObj.videos.push(url);
            }
        } else if (Constants.docTypes.filter(value => media.classList.contains(value)).length !== 0) { // документы
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

export async function exportUrl(msgId, msgDateTime, msgSender, msgMediaElement) {
    const mediaObj = await getMediaUrls(msgId, msgMediaElement);
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