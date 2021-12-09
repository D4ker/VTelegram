function transformWindows1251ToUTF8(response) {
    const transformedBody = response.body
        .pipeThrough(new TextDecoderStream("windows-1251"))
        .pipeThrough(new TextEncoderStream());
    return new Response(transformedBody);
}

// Отправка запроса
export async function request(url, method = 'GET', data = null) {
    const headers = {};
    let body;
    if (data) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['x-requested-with'] = 'XMLHttpRequest';
        body = JSON.stringify(data);
    }

    const response = await fetch(url, {
        method: method,
        headers: headers,
        body: body
    });

    return transformWindows1251ToUTF8(response);
}

// Функция для форматирования даты
export function formatTime(s) {
    const dtFormat = new Intl.DateTimeFormat('UTC', {
        nu: 'arab',
        ca: 'gregory',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
    return dtFormat.format(new Date(s * 1e3));
}

// Функция для преобразования JSON в UrlParams (для запросов)
export function toUrlData(obj) {
    const data = [];
    for (const key in obj) {
        let value = obj[key];
        if (typeof obj[key] === 'object') {
            value = JSON.stringify(obj[key]);
        }
        data.push([key, value]);
    }
    return new URLSearchParams(data).toString();
}

// Function to download data to a file
export function createFile(data, filename, type) {
    const file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        const a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

export function toUTF8Array(str) {
    const utf8 = [];
    for (let i = 0; i < str.length; i++) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
        } else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >> 18),
                0x80 | ((charcode >> 12) & 0x3f),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}
