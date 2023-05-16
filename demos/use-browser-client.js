// import { ChatGPTBrowserClient } from '@waylaidwanderer/chatgpt-api';
import { ChatGPTBrowserClient } from '../index.js';

const clientOptions = {
    // (Optional) Support for a reverse proxy for the completions endpoint (private API server).
    // Warning: This will expose your access token to a third party. Consider the risks before using this.
    reverseProxyUrl: 'https://bypass.churchless.tech/api/conversation',
    // Access token from https://chat.openai.com/api/auth/session
    accessToken: '',
    // Cookies from chat.openai.com (likely not required if using reverse proxy server).
    cookies: '',
    // (Optional) Set to true to enable `console.debug()` logging
    // debug: true,
};

const chatGptClient = new ChatGPTBrowserClient(clientOptions);

const response = await chatGptClient.sendMessage('Hello!');
console.log(response); // { response: 'Hi! How can I help you today?', conversationId: '...', messageId: '...' }

const response2 = await chatGptClient.sendMessage('Write a poem about cats.', { conversationId: response.conversationId, parentMessageId: response.messageId });
console.log(response2.response); // Cats are the best pets in the world.

const response3 = await chatGptClient.sendMessage('Now write it in French.', {
    conversationId: response2.conversationId,
    parentMessageId: response2.messageId,
    // If you want streamed responses, you can set the `onProgress` callback to receive the response as it's generated.
    // You will receive one token at a time, so you will need to concatenate them yourself.
    onProgress: token => process.stdout.write(token),
});
console.log();
console.log(response3.response); // Les chats sont les meilleurs animaux de compagnie du monde.

// (Optional) Lets you delete the conversation when you're done with it.
await chatGptClient.deleteConversation(response3.conversationId);
