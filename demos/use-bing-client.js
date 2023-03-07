import { BingAIClient } from '../index.js';

const bingAIClient = new BingAIClient({
    // Necessary for some people in different countries, e.g. China (https://cn.bing.com)
    host: '',
    // "_U" cookie from bing.com
    userToken: '',
    // If the above doesn't work, provide all your cookies as a string instead
    cookies: '',
    // A proxy string like "http://<ip>:<port>"
    proxy: '',
    // (Optional) Set to true to enable `console.debug()` logging
    debug: false,
});

let response = await bingAIClient.sendMessage('Write a short poem about cats', {
    onProgress: (token) => {
        process.stdout.write(token);
    },
});
console.log(response);

response = await bingAIClient.sendMessage('Now write it in French', {
    toneStyle: 'balanced', //or creative, precise
    conversationSignature: response.conversationSignature,
    conversationId: response.conversationId,
    clientId: response.clientId,
    invocationId: response.invocationId,
    onProgress: (token) => {
        process.stdout.write(token);
    },
});
console.log(response);
