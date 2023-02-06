// import ChatGPTClient from '@waylaidwanderer/chatgpt-api';
import ChatGPTClient from '../src/ChatGPTClient.js';

const clientOptions = {
    // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
    modelOptions: {
        // The model is set to text-chat-davinci-002-20221122 by default, but you can override
        // it and any other parameters here
        model: 'text-chat-davinci-002-20221122',
    },
    // (Optional) Set custom instructions instead of "You are ChatGPT...".
    // promptPrefix: 'You are Bob, a cowboy in Western times...',
    // (Optional) Set a custom name for the user
    // userLabel: 'User',
    // (Optional) Set a custom name for ChatGPT
    // chatGptLabel: 'ChatGPT',
    // (Optional) Set to true to enable `console.debug()` logging
    debug: false,
};

const cacheOptions = {
    // Options for the Keyv cache, see https://www.npmjs.com/package/keyv
    // This is used for storing conversations, and supports additional drivers (conversations are stored in memory by default)
    // For example, to use a JSON file (`npm i keyv-file`) as a database:
    // store: new KeyvFile({ filename: 'cache.json' }),
};

const chatGptClient = new ChatGPTClient('OPENAI_API_KEY', clientOptions, cacheOptions);

const response = await chatGptClient.sendMessage('Hello!');
console.log(response); // { response: 'Hi! How can I help you today?', conversationId: '...', messageId: '...' }

const response2 = await chatGptClient.sendMessage('Write a poem about cats.', { conversationId: response.conversationId, parentMessageId: response.messageId });
console.log(response2.response); // Cats are the best pets in the world.

const response3 = await chatGptClient.sendMessage('Now write it in French.', {
    conversationId: response2.conversationId,
    parentMessageId: response2.messageId,
    // If you want streamed responses, you can set the `onProgress` callback to receive the response as it's generated.
    // You will receive one token at a time, so you will need to concatenate them yourself.
    onProgress: (token) => console.log(token),
});
console.log(response3.response); // Les chats sont les meilleurs animaux de compagnie du monde.
