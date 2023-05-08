// eslint-disable-next-line no-unused-vars
import { KeyvFile } from 'keyv-file';
// import { ChatGPTClient } from '@waylaidwanderer/chatgpt-api';
import { ChatGPTClient } from '../index.js';

const clientOptions = {
    // (Optional) Support for a reverse proxy for the completions endpoint (private API server).
    // Warning: This will expose your `openaiApiKey` to a third party. Consider the risks before using this.
    // reverseProxyUrl: 'https://chatgpt.hato.ai/completions',
    // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
    // (Optional) to use Azure OpenAI API, set `azure` to true and `reverseProxyUrl` to your completion endpoint:
    // azure: true,
    // reverseProxyUrl: 'https://{your-resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version={api-version}',
    modelOptions: {
        // You can override the model name and any other parameters here, like so:
        model: 'gpt-3.5-turbo',
        // I'm overriding the temperature to 0 here for demonstration purposes, but you shouldn't need to override this
        // for normal usage.
        temperature: 0,
        // Set max_tokens here to override the default max_tokens of 1000 for the completion.
        // max_tokens: 1000,
    },
    // (Optional) Davinci models have a max context length of 4097 tokens, but you may need to change this for other models.
    // maxContextTokens: 4097,
    // (Optional) You might want to lower this to save money if using a paid model like `text-davinci-003`.
    // Earlier messages will be dropped until the prompt is within the limit.
    // maxPromptTokens: 3097,
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

let response;
response = await chatGptClient.sendMessage('Hello!');
console.log(response); // { response: 'Hello! How can I assist you today?', conversationId: '...', messageId: '...' }

response = await chatGptClient.sendMessage('Write a short poem about cats.', { conversationId: response.conversationId, parentMessageId: response.messageId });
console.log(response.response); // Soft and sleek, with eyes that gleam,\nCats are creatures of grace supreme.\n...
console.log();

response = await chatGptClient.sendMessage('Now write it in French.', {
    conversationId: response.conversationId,
    parentMessageId: response.messageId,
    // If you want streamed responses, you can set the `onProgress` callback to receive the response as it's generated.
    // You will receive one token at a time, so you will need to concatenate them yourself.
    onProgress: token => process.stdout.write(token),
});
console.log();
console.log(response.response); // Doux et élégant, avec des yeux qui brillent,\nLes chats sont des créatures de grâce suprême.\n...

response = await chatGptClient.sendMessage('Repeat my 2nd message verbatim.', {
    conversationId: response.conversationId,
    parentMessageId: response.messageId,
    // If you want streamed responses, you can set the `onProgress` callback to receive the response as it's generated.
    // You will receive one token at a time, so you will need to concatenate them yourself.
    onProgress: token => process.stdout.write(token),
});
console.log();
console.log(response.response); // "Write a short poem about cats."
