function base64UrlEncode(obj) {
    const jsonString = JSON.stringify(obj);
     // Base64 encode the JSON string
    return Buffer.from(jsonString).toString('base64url');
}

exports.init = () => {}

exports.process = (event) => {
    const header = {alg:'HS256', typ:'JWT'};
    const payload = {sub: `user${Math.floor(Math.random() * 10)}`, aud:'auth.example.com', iss: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60};

    const hmac = crypto.createHmac('sha256', 'demo');

    const unsigned = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
    const signature = hmac.update(unsigned).digest('base64url');

    return event.event.replaceAll('{{jwt}}', `${unsigned}.${signature}`);
}
