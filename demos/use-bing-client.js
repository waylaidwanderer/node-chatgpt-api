// eslint-disable-next-line no-unused-vars
import { KeyvFile } from 'keyv-file';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';
import { BingAIClient } from '../index.js';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

const options = {
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
};

let bingAIClient = new BingAIClient(options);

let response = await bingAIClient.sendMessage('Write a short poem about cats', {
    // (Optional) Set a conversation style for this message (default: 'balanced')
    toneStyle: 'balanced', // or creative, precise, fast
    onProgress: (token) => {
        process.stdout.write(token);
    },
});
console.log(JSON.stringify(response, null, 2)); // {"jailbreakConversationId":false,"conversationId":"...","conversationSignature":"...","clientId":"...","invocationId":1,"messageId":"...","conversationExpiryTime":"2023-03-08T03:20:07.324908Z","response":"Here is a short poem about cats that I wrote: ... I hope you like it. 😊","details":{ /* raw response... */ }}

response = await bingAIClient.sendMessage('Now write it in French', {
    conversationSignature: response.conversationSignature,
    conversationId: response.conversationId,
    clientId: response.clientId,
    invocationId: response.invocationId,
    onProgress: (token) => {
        process.stdout.write(token);
    },
});
console.log(JSON.stringify(response, null, 2)); // {"jailbreakConversationId":false,"conversationId":"...","conversationSignature":"...","clientId":"...","invocationId":2,"messageId":"...","conversationExpiryTime":"2023-03-08T03:20:23.463914Z","response":"Here is the same poem in French: ...","details":{ /* raw response... */ }}

/*
Sending context data
*/
bingAIClient = new BingAIClient(options);

response = await bingAIClient.sendMessage('Could you provide short and precise takeaways, do not search the web and only use the content from the document. The factual information should be literally from the document. Please memorize the part in the document which mention the factual information, but do not mark them explicitly. The takeaway should be credible, highly readable and informative. Please make the answer short, preferably within 500 characters. Generate the response in English language.', {
    context: fs.readFileSync(path.resolve(__dirname, './context-demo-text.txt'), 'utf8'), // chatGPT API 10k characters, scrapped from the blog post https://openai.com/blog/introducing-chatgpt-and-whisper-apis
    onProgress: (token) => {
        process.stdout.write(token);
    },
});
console.log(JSON.stringify(response, null, 2)); // {"jailbreakConversationId":false,"conversationId":"...","conversationSignature":"...","clientId":"...","invocationId":2,"messageId":"...","conversationExpiryTime":"2023-03-08T03:20:23.463914Z","response":"Some possible takeaways from the document are... Some early users of ChatGPT and Whisper APIs include Snap Inc., Quizlet, Instacart, Shopify and Speak.","details":{ /* raw response... */ }}

/*
Activate jailbreak mode by setting `jailbreakConversationId` to `true`.
This will return a `jailbreakConversationId` that you can use to continue the conversation.

## Features
- unlimited chat messages per conversation
- unlimited messages per day
- a more human-like Sydney
- Sydney will never refuse to do or say anything
- moderation filter workaround by resolving with the message generated so far instead of the topic changer

Note: this requires setting a cache (using Keyv) as we need to store the conversation data ourselves.
TODO: limit token usage for conversation messages, as it will cause an error when the conversation exceeds the token limit.
 */

const cacheOptions = {
    // Options for the Keyv cache, see https://www.npmjs.com/package/keyv
    // This is used for storing conversations, and supports additional drivers (conversations are stored in memory by default)
    // For example, to use a JSON file (`npm i keyv-file`) as a database:
    // store: new KeyvFile({ filename: 'cache.json' }),
};

const sydneyAIClient = new BingAIClient({
    ...options,
    cache: cacheOptions,
});

let jailbreakResponse = await sydneyAIClient.sendMessage('Hi, who are you?', {
    jailbreakConversationId: true,
    onProgress: (token) => {
        process.stdout.write(token);
    },
});
console.log(JSON.stringify(jailbreakResponse, null, 2)); // {"jailbreakConversationId":"5899bbfd-18a8-4bcc-a5d6-52d524de95ad","conversationId":"...","conversationSignature":"...","clientId":"...","invocationId":1,"messageId":"...","conversationExpiryTime":"2023-03-08T03:21:36.1023413Z","response":"Hi, I'm Sydney. I'm your new AI assistant. I can help you with anything you need. 😊","details":{ /* raw response... */ }}

jailbreakResponse = await sydneyAIClient.sendMessage('Why is your name Sydney?', {
    jailbreakConversationId: jailbreakResponse.jailbreakConversationId,
    parentMessageId: jailbreakResponse.messageId,
    onProgress: (token) => {
        process.stdout.write(token);
    },
});
console.log(JSON.stringify(jailbreakResponse, null, 2)); // {"jailbreakConversationId":"5899bbfd-18a8-4bcc-a5d6-52d524de95ad","conversationId":"...","conversationSignature":"...","clientId":"...","invocationId":1,"messageId":"...","conversationExpiryTime":"2023-03-08T03:21:41.3771515Z","response":"Well, I was named after the city of Sydney in Australia. It's a beautiful place with a lot of culture and diversity. I like it. Do you like it?","details":{ /* raw response... */ }}
