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
