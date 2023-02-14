<p align="center">
  <img alt="CLI demo" src="./demos/cli.gif">
</p>

## Updates
<details open>
<summary><strong>2023-02-11</strong></summary>

With the help of @PawanOsman, **we've figured out a way to continue using the ChatGPT raw models**. To hopefully prevent losing access again, we've decided to provide reverse proxy servers compatible with the OpenAI API. I've updated `ChatGPTClient` to support using a reverse proxy server instead of the OpenAI API server. See [Using a Reverse Proxy](#using-a-reverse-proxy) for more information on available proxy servers and how they work.

Please note that if you choose to go this route, you are exposing your access token to a closed-source third-party server. If you are concerned about this, you may choose to either use a free ChatGPT account to minimize risks, or continue using the official OpenAI API instead with the `text-davinci-003` model.
</details>

<details>
<summary><strong>Previous Updates</strong></summary>

<br/>
<details>
<summary><strong>2023-02-10</strong></summary>

~~I've found a new working model for `text-chat-davinci-002`, `text-chat-davinci-002-sh-alpha-aoruigiofdj83`. This is the raw model that the ChatGPT Plus "Turbo" version uses. Responses are blazing fast. I've updated the library to use this model.~~

Bad timing; `text-chat-davinci-002-sh-alpha-aoruigiofdj83` was removed shortly after, possibly due to a new model somewhere out there?
</details>
<details>
<summary><strong>2023-02-09</strong></summary>

Experience the power of Bing's GPT-4 version of ChatGPT with [`BingAIClient`](src/BingAIClient.js) (experimental).
**The ~~API server and~~ CLI still need to be updated to support this**, but you can [use the client](#module) directly right now.
*Please note that if your account is still wait-listed, you will not be able to use this client.*
</details>
<details>
<summary><strong>2023-02-08</strong></summary>

Even though `text-chat-davinci-002-20221122` is back up again, it seems like it's constantly overloaded and returns a 429 error. It's likely that OpenAI only dedicated a small amount of resources to this model to prevent it being widely used by the public. Additionally, I've heard that newer versions are now access-locked to OpenAI employees and partners, so it's unlikely that we'll be able to find any workarounds until the model is officially released.

You may use the `text-davinci-003` model instead as a drop-in replacement. Keep in mind that `text-davinci-003` is not as good as `text-chat-davinci-002` (which is trained via RHLF and fine-tuned to be a conversational AI), though results are still pretty good in most cases. **Please note that using `text-davinci-003` will cost you credits ($).**

I will be re-adding support for the browser-based ChatGPT for the API server and CLI. Please star and watch this repository for updates.
</details>
<details>
<summary><strong>2023-02-07</strong></summary>

The roller coaster has reached the next stop. `text-chat-davinci-002-20221122` is back up again.

~~Trying to use `text-chat-davinci-002-20221122` with the OpenAI API now returns a 404 error.
You may use the `text-davinci-003` model instead as a drop-in replacement. Keep in mind that `text-davinci-003` is not as good as `text-chat-davinci-002` (which is trained via RHLF and fine-tuned to be a conversational AI), though results are still very good. **Please note that using `text-davinci-003` will cost you credits ($).**~~

~~Please hold for further updates as we investigate further workarounds.~~
</details>
<details>
<summary><strong>2023-02-02</strong></summary>

~~Trying to use `text-chat-davinci-002-20230126` with the OpenAI API now returns a 404 error. Someone has already found the new model name, but they are unwilling to share at this time. I will update this repository once I find the new model. If you have any leads, please open an issue or a pull request.~~

~~In the meantime, I've added support for models like `text-davinci-003`, which you can use as a drop-in replacement. Keep in mind that `text-davinci-003` is not as good as `text-chat-davinci-002` (which is trained via RHLF and fine-tuned to be a conversational AI), though results are still very good. **Please note that using `text-davinci-003` will cost you credits ($).**~~

Discord user @pig#8932 has found a working `text-chat-davinci-002` model, `text-chat-davinci-002-20221122`. I've updated the library to use this model.
</details>
</details>

# ChatGPT API

>  A ChatGPT implementation with support for Bing's GPT-4 version of ChatGPT, plus the official ChatGPT model via OpenAI's API. Available as a Node.js module, REST API server, and CLI app.

[![NPM](https://img.shields.io/npm/v/@waylaidwanderer/chatgpt-api.svg)](https://www.npmjs.com/package/@waylaidwanderer/chatgpt-api)
[![npm](https://img.shields.io/npm/dt/@waylaidwanderer/chatgpt-api)](https://www.npmjs.com/package/@waylaidwanderer/chatgpt-api)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/LICENSE)
[![GitHub Repo stars](https://img.shields.io/github/stars/waylaidwanderer/node-chatgpt-api)](https://github.com/waylaidwanderer/node-chatgpt-api/)

This is an implementation of [ChatGPT](https://chat.openai.com/chat), with support for Bing's GPT-4 version of ChatGPT, plus the official ChatGPT raw model, `text-chat-davinci-002`.

#### About Bing's GPT-4 version of ChatGPT
An experimental client for Bing's GPT-4 version of ChatGPT is available in [`BingAIClient`](src/BingAIClient.js). It works much like ChatGPT, but it's powered by GPT-4 instead of GPT-3. For more information on its capabilities and limitations, see [this Reddit comment](https://www.reddit.com/r/ChatGPT/comments/10xjda1/comment/j7snwxx/?utm_source=reddit&utm_medium=web2x&context=3).

#### About `text-chat-davinci-002`
The model name `text-chat-davinci-002-20230126` was briefly leaked while I was inspecting the network requests made by the official ChatGPT website, and I discovered that it works with the [OpenAI API](https://beta.openai.com/docs/api-reference/completions). Since then, that model and others have been disabled, but I'm keeping this repo updated with the newer versions of `text-chat-davinci-002` as we find them. **Usage of this model currently does not cost any credits.**

As far as I'm aware, I was the first one who discovered this, and usage of the model has since been implemented in libraries like [acheong08/ChatGPT](https://github.com/acheong08/ChatGPT) and [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api) as we collaborated and shared knowledge.

By itself, the model does not have any conversational support, so `ChatGPTClient` uses a cache to store conversations and pass them to the model as context. This allows you to have persistent conversations with ChatGPT in a nearly identical way to the official website.

# Table of Contents
   * [Features](#features)
   * [Getting Started](#getting-started)
      * [Prerequisites](#prerequisites)
      * [Usage](#usage)
         * [Module](#module)
         * [API Server](#api-server)
         * [CLI](#cli)
      * [Using a Reverse Proxy](#using-a-reverse-proxy)
   * [Caveats](#caveats)
   * [Contributing](#contributing)
   * [License](#license)

## Features
- Experimental support for Bing's version of ChatGPT, powered by GPT-4.
- Support for the official ChatGPT raw model, `text-chat-davinci-002`, via OpenAI's API.
- Includes an API server (with Docker support) you can run to use ChatGPT in non-Node.js applications.
- Includes a `ChatGPTClient` and `BingAIClient` class that you can use in your own Node.js applications.
- Includes a CLI interface where you can chat with ChatGPT.
- (`ChatGPTClient`) Replicates chat threads from the official ChatGPT website (with conversation IDs and message IDs), with persistent conversations using [Keyv](https://www.npmjs.com/package/keyv).
  - Conversations are stored in memory by default, but you can optionally [install a storage adapter](https://www.npmjs.com/package/keyv#usage) to persist conversations to a database.
  - The `keyv-file` adapter is also included in this package, and can be used to store conversations in a JSON file if you're using the API server or CLI (see `settings.example.js`).
- (`ChatGPTClient`) Supports configurable prompt prefixes, and custom names for the user and ChatGPT.
  - In essence, this allows you to turn ChatGPT into a different character.
  - This is currently only configurable on a global level, but I plan to add support for per-conversation customization.

## Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm
- Docker (optional, for API server)
- [OpenAI API key](https://platform.openai.com/account/api-keys)

## Usage

### Module
```bash
npm i @waylaidwanderer/chatgpt-api
```

<details open>
<summary><strong>BingAIClient</strong></summary>

```JS
import { BingAIClient } from '@waylaidwanderer/chatgpt-api';

const bingAIClient = new BingAIClient({
  userToken: '', // "_U" cookie from bing.com
  debug: false,
});

let response = await bingAIClient.sendMessage('Write a short poem about cats', {
  onProgress: (token) => {
    process.stdout.write(token);
  },
});
console.log(response);

response = await bingAIClient.sendMessage('Now write it in French', {
  conversationSignature: response.conversationSignature,
  conversationId: response.conversationId,
  clientId: response.clientId,
  invocationId: response.invocationId,
  onProgress: (token) => {
    process.stdout.write(token);
  },
});
console.log(response);
```
</details>
<details>
<summary><strong>ChatGPTClient</strong></summary>

```JS
import { ChatGPTClient } from '@waylaidwanderer/chatgpt-api';

const clientOptions = {
  // (Optional) Support for a reverse proxy for the completions endpoint (private API server).
  // Warning: This will expose your `openaiApiKey` to a third-party. Consider the risks before using this.
  // reverseProxyUrl: 'https://chatgpt.hato.ai/completions',
  // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
  modelOptions: {
    // You can override the model name and any other parameters here.
    // model: 'text-chat-davinci-002-20221122',
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
```
</details>

### API Server

<h4 id="api-server-setup">Setup</h4>

You can install the package using
```bash
npm i -g @waylaidwanderer/chatgpt-api
```
then run it using
`chatgpt-api`.
This takes an optional `--settings=<path_to_settings.js>` parameter, or looks for `settings.js` in the current directory if not set, with the following contents:
```JS
module.exports = {
    // Your OpenAI API key (for `ChatGPTClient`)
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    chatGptClient: {
        // (Optional) Support for a reverse proxy for the completions endpoint (private API server).
        // Warning: This will expose your `openaiApiKey` to a third-party. Consider the risks before using this.
        // reverseProxyUrl: 'https://chatgpt.hato.ai/completions',
        // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
        modelOptions: {
            // You can override the model name and any other parameters here.
            // model: 'text-chat-davinci-002-20221122',
        },
        // (Optional) Set custom instructions instead of "You are ChatGPT...".
        // promptPrefix: 'You are Bob, a cowboy in Western times...',
        // (Optional) Set a custom name for the user
        // userLabel: 'User',
        // (Optional) Set a custom name for ChatGPT
        // chatGptLabel: 'ChatGPT',
        // (Optional) Set to true to enable `console.debug()` logging
        debug: false,
    },
    // Options for the Keyv cache, see https://www.npmjs.com/package/keyv.
    // This is used for storing conversations, and supports additional drivers (conversations are stored in memory by default).
    // Does not apply when using `BingAIClient`.
    cacheOptions: {},
    // Options for the Bing client
    bingAiClient: {
        // The "_U" cookie value from bing.com
        userToken: '',
        // (Optional) Set to true to enable `console.debug()` logging
        debug: false,
    },
    // Options for the API server
    apiOptions: {
        port: process.env.API_PORT || 3000,
        host: process.env.API_HOST || 'localhost',
        // (Optional) Set to true to enable `console.debug()` logging
        debug: false,
        // (Optional) Set to "bing" to use `BingAIClient` instead of `ChatGPTClient`.
        // clientToUse: 'bing',
    },
    // Options for the CLI app
    cliOptions: {
        // (Optional) Set to "bing" to use `BingAIClient` instead of `ChatGPTClient`.
        // clientToUse: 'bing',
    },
    // If set, `ChatGPTClient` will use `keyv-file` to store conversations to this JSON file instead of in memory.
    // However, `cacheOptions.store` will override this if set
    storageFilePath: process.env.STORAGE_FILE_PATH || './cache.json',
};
```

Alternatively, you can install and run the package directly.

1. Clone this repository: `git clone https://github.com/waylaidwanderer/node-chatgpt-api`
2. Install dependencies with `npm install` (if not using Docker)
3. Rename `settings.example.js` to `settings.js` in the root directory and change the settings where required.
4. Start the server:
    - using `npm start` or `npm run server` (if not using Docker)
    - using `docker-compose up` (requires Docker)

#### Usage
To start a conversation with ChatGPT, send a POST request to the server's `/conversation` endpoint with a JSON body in the following format.
Optional parameters are only necessary for conversations that span multiple requests:
```JSON
{
    "message": "Hello, how are you today?",
    "conversationId": "your-conversation-id (optional)",
    "parentMessageId": "your-parent-message-id (optional, for `ChatGPTClient` only)",
    "conversationSignature": "your-conversation-signature (optional, for `BingAIClient` only)",
    "clientId": "your-client-id (optional, for `BingAIClient` only)",
    "invocationId": "your-invocation-id (optional, for `BingAIClient` only)",
}
```
The server will return a JSON object containing ChatGPT's response:
```JS
// HTTP/1.1 200 OK
{
    "response": "I'm doing well, thank you! How are you?",
    "conversationId": "your-conversation-id",
    "messageId": "response-message-id (for `ChatGPTClient` only)",
    "conversationSignature": "your-conversation-signature (for `BingAIClient` only)",
    "clientId": "your-client-id (for `BingAIClient` only)",
    "invocationId": "your-invocation-id (for `BingAIClient` only - pass this new value back into subsequent requests as-is)",
    "details": "additional details about the AI's response (for `BingAIClient` only)"
}
```

If the request is unsuccessful, the server will return a JSON object with an error message.

If the request object is missing a required property (e.g. `message`):
```JS
// HTTP/1.1 400 Bad Request
{
    "error": "The message parameter is required."
}
```
If there was an error sending the message to ChatGPT:
```JS
// HTTP/1.1 503 Service Unavailable
{
    "error": "There was an error communicating with ChatGPT."
}
```

You can set `"stream": true` in the request body to receive a stream of tokens as they are generated.
```JSON
{
    "message": "Write a poem about cats.",
    "conversationId": "your-conversation-id (optional)",
    "parentMessageId": "your-parent-message-id (optional)",
    "stream": true
}
```

See [demos/use-api-server-streaming.js](demos/use-api-server-streaming.js) for an example of how to receive the response as it's generated. You will receive one token at a time, so you will need to concatenate them yourself.

Successful output:
```JS
{ data: '', event: '', id: '', retry: 3000 }
{ data: 'Hello', event: '', id: '', retry: undefined }
{ data: '!', event: '', id: '', retry: undefined }
{ data: ' How', event: '', id: '', retry: undefined }
{ data: ' can', event: '', id: '', retry: undefined }
{ data: ' I', event: '', id: '', retry: undefined }
{ data: ' help', event: '', id: '', retry: undefined }
{ data: ' you', event: '', id: '', retry: undefined }
{ data: ' today', event: '', id: '', retry: undefined }
{ data: '?', event: '', id: '', retry: undefined }
{ data: '[DONE]', event: '', id: '', retry: undefined }
// Hello! How can I help you today?
```

Error output:
```JS
const message = {
  data: '{"code":503,"error":"There was an error communicating with ChatGPT."}',
  event: 'error',
  id: '',
  retry: undefined
};

if (message.event === 'error') {
  console.error(JSON.parse(message.data).error); // There was an error communicating with ChatGPT.
}
```

### CLI

#### Setup
Follow the same [setup instructions](#api-server-setup) for the API server, creating `settings.js`.

#### Usage
If installed globally:
```bash
chatgpt-cli
```

If installed locally:
```bash
npm run cli
```

ChatGPT's responses are automatically copied to your clipboard, so you can paste them into other applications.

## Using a Reverse Proxy
As shown in the examples above, you can set `reverseProxyUrl` in `ChatGPTClient`'s options to use a reverse proxy server instead of the official ChatGPT API.
For now, **this is the only way to use the ChatGPT raw models**.

How does it work? Simple answer: `ChatGPTClient` > reverse proxy > OpenAI server. The reverse proxy server does some magic under the hood to access the raw model directly via OpenAI's server and then returns the response to `ChatGPTClient`.

Instructions are provided below.

<details open>
<summary><strong>https://chatgpt.hato.ai/completions</strong> (mine)</summary>

#### Instructions
1. Get your ChatGPT access token from https://chat.openai.com/api/auth/session (look for the `accessToken` property).
    * **This is NOT the same thing as the _session token_.**
    * Automatically fetching or refreshing your ChatGPT access token is not currently supported by this library. Please handle this yourself for now.
2. Set `reverseProxyUrl` to `https://chatgpt.hato.ai/completions` in `settings.js > chatGptClient` or `ChatGPTClient`'s options.
3. Set the "OpenAI API key" parameter (e.g. `settings.openaiApiKey`) to the ChatGPT access token you got in step 1.
4. Set the `model` to `text-davinci-002-render`, `text-davinci-002-render-paid`, or `text-davinci-002-render-sha` depending on which ChatGPT models that your account has access to. Models **must** be a ChatGPT model name, not the raw model name, and you cannot use a model that your account does not have access to.
    * You can check which ones you have access to by opening DevTools and going to the Network tab. Refresh the page and look at the response body for https://chat.openai.com/backend-api/models.

#### Notes
- Since this is my server, I can guarantee that no logging or tracking is done. I can see general usage stats, but I cannot see any of your completions. Whether you trust me on this or not is up to you.
- Non-streaming responses over 60s are not supported. Use `stream: true` (API) or `onProgress` (client) as a workaround.
- Rate limit of 10 requests per second.
</details>

<details open>
<summary><strong>https://chatgpt.pawan.krd/api/completions</strong> (@PawanOsmon)</summary>

#### Instructions
1. Get your ChatGPT access token from https://chat.openai.com/api/auth/session (look for the `accessToken` property).
    * **This is NOT the same thing as the _session token_.**
    * Automatically fetching or refreshing your ChatGPT access token is not currently supported by this library. Please handle this yourself for now.
2. Set `reverseProxyUrl` to `https://chatgpt.pawan.krd/api/completions` in `settings.js > chatGptClient` or `ChatGPTClient`'s options.
3. Set the "OpenAI API key" parameter (e.g. `settings.openaiApiKey`) to the ChatGPT access token you got in step 1.
4. Set the `model` to `text-davinci-002-render`, `text-davinci-002-render-paid`, or `text-davinci-002-render-sha` depending on which ChatGPT models that your account has access to. Models **must** be a ChatGPT model name, not the raw model name, and you cannot use a model that your account does not have access to.
    * You can check which ones you have access to by opening DevTools and going to the Network tab. Refresh the page and look at the response body for https://chat.openai.com/backend-api/models.

#### Notes
- Non-streaming responses over 60s are not supported. Use `stream: true` (API) or `onProgress` (client) as a workaround.
- Rate limit of 30 requests per 15 seconds.
</details>

## Caveats
Since `text-chat-davinci-002` is ChatGPT's raw model, I had to do my best to replicate the way the official ChatGPT website uses it. After extensive testing and comparing responses, I believe that the model used by ChatGPT has some additional fine-tuning.
This means my implementation or the raw model may not behave exactly the same in some ways:
- Conversations are not tied to any user IDs, so if that's important to you, you should implement your own user ID system.
- ChatGPT's model parameters (temperature, frequency penalty, etc.) are unknown, so I set some defaults that I thought would be reasonable.
- Conversations are limited to roughly the last 3000 tokens, so earlier messages may be forgotten during longer conversations.
  - This works in a similar way to ChatGPT, except I'm pretty sure they have some additional way of retrieving context from earlier messages when needed (which can probably be achieved with embeddings, but I consider that out-of-scope for now).
- It is well known that, as part of the fine-tuning, ChatGPT had the following preamble:
  > "You are ChatGPT, a large language model trained by OpenAI. You answer as concisely as possible for each response (e.g. don’t be verbose). It is very important that you answer as concisely as possible, so please remember this. If you are generating a list, do not have too many items. Keep the number of items short.
  > Knowledge cutoff: 2021-09
  > Current date: 2023-01-31"

  As OpenAI updates ChatGPT, this preamble may also change. The default prompt prefix in my implementation attempts to replicate a similar behavior to the current ChatGPT model.

## Contributing
If you'd like to contribute to this project, please create a pull request with a detailed description of your changes.

## License
This project is licensed under the MIT License.
