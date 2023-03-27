<p align="center">
  <img alt="CLI demo" src="./demos/cli.gif">
</p>

## Updates
<details open>
<summary><strong>2023-03-01</strong></summary>

**Support for the official ChatGPT model has been added!** You can now use the `gpt-3.5-turbo` model with the official OpenAI API, using `ChatGPTClient`. This is the same model that ChatGPT uses, and it's the most powerful model available right now. Usage of this model is **not free**, however it is **10x cheaper** (priced at $0.002 per 1k tokens) than `text-davinci-003`.

See OpenAI's post, [Introducing ChatGPT and Whisper APIs](https://openai.com/blog/introducing-chatgpt-and-whisper-apis) for more information.

~~To use it, set `modelOptions.model` to `gpt-3.5-turbo`, and `ChatGPTClient` will handle the rest.~~  
The default model used in `ChatGPTClient` is now `gpt-3.5-turbo`.  
You can still set `userLabel`, `chatGptLabel` and `promptPrefix` (system instructions) as usual.

**There may be a higher chance of your account being banned if you continue to automate chat.openai.com.** Continue doing so at your own risk.
</details>

<details>
<summary><strong>Previous Updates</strong></summary>

<br/>
<details>
<summary><strong>2023-02-19</strong></summary>

I've added an experimental `ChatGPTBrowserClient` which depends on a reverse proxy server that makes use of a Cloudflare bypass, allowing you to talk to ChatGPT (chat.openai.com) without requiring browser automation. All you need is your access token from https://chat.openai.com/api/auth/session.

As always, please note that if you choose to go this route, you are exposing your access token to a closed-source third-party server. If you are concerned about this, you may choose to either use a free ChatGPT account to minimize risks, or continue using `ChatGPTClient` instead with the `text-davinci-003` model.
</details>
<details>
<summary><strong>2023-02-15</strong></summary>

The method we were using to access the ChatGPT underlying models has been patched, unfortunately. Your options right now are to either use the official OpenAI API with the `text-davinci-003` model (which costs money), or use a browser-based solution to interface with ChatGPT's backend (which is less powerful, more rate-limited and is not supported by this library at this time).
</details>
<details>
<summary><strong>2023-02-11</strong></summary>

With the help of @PawanOsman, **we've figured out a way to continue using the ChatGPT underlying models**. To hopefully prevent losing access again, we've decided to provide reverse proxy servers compatible with the OpenAI API. I've updated `ChatGPTClient` to support using a reverse proxy server instead of the OpenAI API server. See [Using a Reverse Proxy](#using-a-reverse-proxy) for more information on available proxy servers and how they work.

Please note that if you choose to go this route, you are exposing your access token to a closed-source third-party server. If you are concerned about this, you may choose to either use a free ChatGPT account to minimize risks, or continue using the official OpenAI API instead with the `text-davinci-003` model.
</details>
<details>
<summary><strong>2023-02-10</strong></summary>

~~I've found a new working model for `text-chat-davinci-002`, `text-chat-davinci-002-sh-alpha-aoruigiofdj83`. This is the underlying model that the ChatGPT Plus "Turbo" version uses. Responses are blazing fast. I've updated the library to use this model.~~

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

> A client implementation for ChatGPT and Bing AI. Available as a Node.js module, REST API server, and CLI app.

[![NPM](https://img.shields.io/npm/v/@waylaidwanderer/chatgpt-api.svg)](https://www.npmjs.com/package/@waylaidwanderer/chatgpt-api)
[![npm](https://img.shields.io/npm/dt/@waylaidwanderer/chatgpt-api)](https://www.npmjs.com/package/@waylaidwanderer/chatgpt-api)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/LICENSE)
[![GitHub Repo stars](https://img.shields.io/github/stars/waylaidwanderer/node-chatgpt-api)](https://github.com/waylaidwanderer/node-chatgpt-api/)

# Table of Contents
   * [Features](#features)
   * [Getting Started](#getting-started)
      * [Prerequisites](#prerequisites)
      * [Usage](#usage)
         * [Module](#module)
         * [API Server](#api-server)
         * [CLI](#cli)
      * [Using a Reverse Proxy](#using-a-reverse-proxy)
   * [Projects](#projects)
   * [Web Client](#web-client)
   * [Caveats](#caveats)
   * [Contributing](#contributing)
   * [License](#license)

## Features
- Includes an API server (with Docker support) you can run to use ChatGPT in non-Node.js applications.
- Includes a CLI interface where you can chat with ChatGPT.
- Includes clients that you can use in your own Node.js applications.
- `ChatGPTClient`: support for the official ChatGPT underlying model, `gpt-3.5-turbo`, via OpenAI's API.
  - Replicates chat threads from the official ChatGPT website (with conversation IDs and message IDs), with persistent conversations using [Keyv](https://www.npmjs.com/package/keyv).
    - Conversations are stored in memory by default, but you can optionally [install a storage adapter](https://www.npmjs.com/package/keyv#usage) to persist conversations to a database.
    - The `keyv-file` adapter is also included in this package, and can be used to store conversations in a JSON file if you're using the API server or CLI (see `settings.example.js`).
  - Supports configurable prompt prefixes, and custom names for the user and ChatGPT.
    - In essence, this allows you to make a chatbot with any personality you want.
    - This is currently only configurable on a global level, but I plan to add support for per-conversation customization.
  - Retains support for models like `text-davinci-003`
- `BingAIClient`: support for Bing's version of ChatGPT, powered by GPT-4.
  - Includes a built-in jailbreak you can activate which enables unlimited chat messages per conversation, unlimited messages per day, and brings Sydney back. 😊 
- `ChatGPTBrowserClient`: support for the official ChatGPT website, using a reverse proxy server for a Cloudflare bypass.
  - **There may be a high chance of your account being banned if you continue to automate chat.openai.com.** Continue doing so at your own risk.

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

See [`demos/use-bing-client.js`](demos/use-bing-client.js).
</details>
<details open>
<summary><strong>ChatGPTClient</strong></summary>

See [`demos/use-client.js`](demos/use-client.js).
</details>
<details open>
<summary><strong>ChatGPTBrowserClient</strong></summary>

See [`demos/use-browser-client.js`](demos/use-browser-client.js).
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

<details>
<summary><strong>settings.js</strong></summary>

```JS
module.exports = {
    // Options for the Keyv cache, see https://www.npmjs.com/package/keyv.
    // This is used for storing conversations, and supports additional drivers (conversations are stored in memory by default).
    // Only necessary when using `ChatGPTClient`, or `BingAIClient` in jailbreak mode.
    cacheOptions: {},
    // If set, `ChatGPTClient` and `BingAIClient` will use `keyv-file` to store conversations to this JSON file instead of in memory.
    // However, `cacheOptions.store` will override this if set
    storageFilePath: process.env.STORAGE_FILE_PATH || './cache.json',
    chatGptClient: {
        // Your OpenAI API key (for `ChatGPTClient`)
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        // (Optional) Support for a reverse proxy for the completions endpoint (private API server).
        // Warning: This will expose your `openaiApiKey` to a third party. Consider the risks before using this.
        // reverseProxyUrl: 'https://chatgpt.hato.ai/completions',
        // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
        modelOptions: {
            // You can override the model name and any other parameters here.
            // The default model is `gpt-3.5-turbo`.
            model: 'gpt-3.5-turbo',
            // Set max_tokens here to override the default max_tokens of 1000 for the completion.
            // max_tokens: 1000,
        },
        // (Optional) Davinci models have a max context length of 4097 tokens, but you may need to change this for other models.
        // maxContextTokens: 4097,
        // (Optional) You might want to lower this to save money if using a paid model like `text-davinci-003`.
        // Earlier messages will be dropped until the prompt is within the limit.
        // maxPromptTokens: 3097,
        // (Optional) Set custom instructions instead of "You are ChatGPT...".
        // (Optional) Set a custom name for the user
        // userLabel: 'User',
        // (Optional) Set a custom name for ChatGPT ("ChatGPT" by default)
        // chatGptLabel: 'Bob',
        // promptPrefix: 'You are Bob, a cowboy in Western times...',
        // A proxy string like "http://<ip>:<port>"
        proxy: '',
        // (Optional) Set to true to enable `console.debug()` logging
        debug: false,
    },
    // Options for the Bing client
    bingAiClient: {
        // Necessary for some people in different countries, e.g. China (https://cn.bing.com)
        host: '',
        // The "_U" cookie value from bing.com
        userToken: '',
        // If the above doesn't work, provide all your cookies as a string instead
        cookies: '',
        // A proxy string like "http://<ip>:<port>"
        proxy: '',
        // (Optional) Set to true to enable `console.debug()` logging
        debug: false,
    },
    chatGptBrowserClient: {
        // (Optional) Support for a reverse proxy for the conversation endpoint (private API server).
        // Warning: This will expose your access token to a third party. Consider the risks before using this.
        reverseProxyUrl: 'https://bypass.churchless.tech/api/conversation',
        // Access token from https://chat.openai.com/api/auth/session
        accessToken: '',
        // Cookies from chat.openai.com (likely not required if using reverse proxy server).
        cookies: '',
        // A proxy string like "http://<ip>:<port>"
        proxy: '',
        // (Optional) Set to true to enable `console.debug()` logging
        debug: false,
    },
    // Options for the API server
    apiOptions: {
        port: process.env.API_PORT || 3000,
        host: process.env.API_HOST || 'localhost',
        // (Optional) Set to true to enable `console.debug()` logging
        debug: false,
        // (Optional) Possible options: "chatgpt", "chatgpt-browser", "bing". (Default: "chatgpt")
        clientToUse: 'chatgpt',
        // (Optional) Generate titles for each conversation for clients that support it (only ChatGPTClient for now).
        // This will be returned as a `title` property in the first response of the conversation.
        generateTitles: false,
        // (Optional) Set this to allow changing the client or client options in POST /conversation.
        // To disable, set to `null`. 
        perMessageClientOptionsWhitelist: {
            // The ability to switch clients using `clientOptions.clientToUse` will be disabled if `validClientsToUse` is not set.
            // To allow switching clients per message, you must set `validClientsToUse` to a non-empty array.
            validClientsToUse: ['bing', 'chatgpt', 'chatgpt-browser'], // values from possible `clientToUse` options above
            // The Object key, e.g. "chatgpt", is a value from `validClientsToUse`.
            // If not set, ALL options will be ALLOWED to be changed. For example, `bing` is not defined in `perMessageClientOptionsWhitelist` above,
            // so all options for `bingAiClient` will be allowed to be changed.
            // If set, ONLY the options listed here will be allowed to be changed.
            // In this example, each array element is a string representing a property in `chatGptClient` above.
            chatgpt: [
                'promptPrefix',
                'userLabel',
                'chatGptLabel',
                // Setting `modelOptions.temperature` here will allow changing ONLY the temperature.
                // Other options like `modelOptions.model` will not be allowed to be changed.
                // If you want to allow changing all `modelOptions`, define `modelOptions` here instead of `modelOptions.temperature`.
                'modelOptions.temperature',
            ],
        },
    },
    // Options for the CLI app
    cliOptions: {
        // (Optional) Possible options: "chatgpt", "bing".
        // clientToUse: 'bing',
    },
};
```
</details>

Alternatively, you can install and run the package directly.

1. Clone this repository: `git clone https://github.com/waylaidwanderer/node-chatgpt-api`
2. Install dependencies with `npm install` (if not using Docker)
3. Rename `settings.example.js` to `settings.js` in the root directory and change the settings where required.
4. Start the server:
    - using `npm start` or `npm run server` (if not using Docker)
    - using `docker-compose up` (requires Docker)

#### Endpoints
<details>
<summary><strong>POST /conversation</strong></summary>

Start or continue a conversation.
Optional parameters are only necessary for conversations that span multiple requests.

| Field                     | Description                                                                                                                                                                                                                                                     |
|---------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| message                   | The message to be displayed to the user.                                                                                                                                                                                                                        |
| conversationId            | (Optional) An ID for the conversation you want to continue.                                                                                                                                                                                                     |
| jailbreakConversationId   | (Optional, for `BingAIClient` only) Set to `true` to start a conversation in jailbreak mode. After that, this should be the ID for the jailbreak conversation (given in the response as a parameter also named `jailbreakConversationId`).                      |
| parentMessageId           | (Optional, for `ChatGPTClient`, and `BingAIClient` in jailbreak mode) The ID of the parent message (i.e. `response.messageId`) when continuing a conversation.                                                                                                  |
| conversationSignature     | (Optional, for `BingAIClient` only) A signature for the conversation (given in the response as a parameter also named `conversationSignature`). Required when continuing a conversation unless in jailbreak mode.                                               |
| clientId                  | (Optional, for `BingAIClient` only) The ID of the client. Required when continuing a conversation unless in jailbreak mode.                                                                                                                                     |
| invocationId              | (Optional, for `BingAIClient` only) The ID of the invocation. Required when continuing a conversation unless in jailbreak mode.                                                                                                                                 |
| clientOptions             | (Optional) An object containing options for the client.                                                                                                                                                                                                         |
| clientOptions.clientToUse | (Optional) The client to use for this message. Possible values: `chatgpt`, `chatgpt-browser`, `bing`.                                                                                                                                                           |
| clientOptions.*           | (Optional) Any valid options for the client. For example, for `ChatGPTClient`, you can set `clientOptions.openaiApiKey` to set an API key for this message only, or `clientOptions.promptPrefix` to give the AI custom instructions for this message only, etc. |

To configure which options can be changed per message (default: all), see the comments for `perMessageClientOptionsWhitelist` in `settings.example.js`.  
To allow changing clients, `perMessageClientOptionsWhitelist.validClientsToUse` must be set to a non-empty array as described in the example settings file.
</details>

#### Usage
<details>
<summary><strong>Method 1 (POST)</strong></summary>

To start a conversation with ChatGPT, send a POST request to the server's `/conversation` endpoint with a JSON body with parameters per **Endpoints** > **POST /conversation** above.
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
    "details": "an object containing the raw response from the client"
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
</details>
<details>
<summary><strong>Method 2 (SSE)</strong></summary>

You can set `"stream": true` in the request body to receive a stream of tokens as they are generated.

```js
import { fetchEventSource } from '@waylaidwanderer/fetch-event-source'; // use `@microsoft/fetch-event-source` instead if in a browser environment

const opts = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        "message": "Write a poem about cats.",
        "conversationId": "your-conversation-id (optional)",
        "parentMessageId": "your-parent-message-id (optional)",
        "stream": true,
        // Any other parameters per `Endpoints > POST /conversation` above
    }),
};
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
{ data: '<result JSON here, see Method 1>', event: 'result', id: '', retry: undefined }
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
</details>

#### Notes
- Method 1 is simple, but Time to First Byte (TTFB) is long.
- Method 2 uses a non-standard implementation of [server-sent event API](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events); you should import `fetch-event-source` first and use `POST` method.

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
~~For now, **this is the only way to use the ChatGPT underlying models**.~~ This method has been patched and the instructions below are no longer relevant, but you may still want to use a reverse proxy for other reasons.
Currently, reverse proxy servers are still used for performing a Cloudflare bypass for `ChatGPTBrowserClient`.

<details>
<summary><strong>Instructions</strong></summary>

How does it work? Simple answer: `ChatGPTClient` > reverse proxy > OpenAI server. The reverse proxy server does some magic under the hood to access the underlying model directly via OpenAI's server and then returns the response to `ChatGPTClient`.

Instructions are provided below.

<details open>
<summary><strong>https://chatgpt.hato.ai/completions</strong> (mine, <strong>currently offline</strong>)</summary>

#### Instructions
1. Get your ChatGPT access token from https://chat.openai.com/api/auth/session (look for the `accessToken` property).
    * **This is NOT the same thing as the _session token_.**
    * Automatically fetching or refreshing your ChatGPT access token is not currently supported by this library. Please handle this yourself for now.
2. Set `reverseProxyUrl` to `https://chatgpt.hato.ai/completions` in `settings.js > chatGptClient` or `ChatGPTClient`'s options.
3. Set the "OpenAI API key" parameter (e.g. `settings.chatGptClient.openaiApiKey`) to the ChatGPT access token you got in step 1.
4. Set the `model` to `text-davinci-002-render`, `text-davinci-002-render-paid`, or `text-davinci-002-render-sha` depending on which ChatGPT models that your account has access to. Models **must** be a ChatGPT model name, not the underlying model name, and you cannot use a model that your account does not have access to.
    * You can check which ones you have access to by opening DevTools and going to the Network tab. Refresh the page and look at the response body for https://chat.openai.com/backend-api/models.

#### Notes
- Since this is my server, I can guarantee that no logging or tracking is done. I can see general usage stats, but I cannot see any of your completions. Whether you trust me on this or not is up to you.
- Non-streaming responses over 60s are not supported. Use `stream: true` (API) or `onProgress` (client) as a workaround.
- Rate limit of 10 requests per second.
</details>

<details open>
<summary><strong>https://chatgpt.pawan.krd/api/completions</strong> (@PawanOsmon, <strong>currently offline</strong>)</summary>

#### Instructions
1. Get your ChatGPT access token from https://chat.openai.com/api/auth/session (look for the `accessToken` property).
    * **This is NOT the same thing as the _session token_.**
    * Automatically fetching or refreshing your ChatGPT access token is not currently supported by this library. Please handle this yourself for now.
2. Set `reverseProxyUrl` to `https://chatgpt.pawan.krd/api/completions` in `settings.js > chatGptClient` or `ChatGPTClient`'s options.
3. Set the "OpenAI API key" parameter (e.g. `settings.chatGptClient.openaiApiKey`) to the ChatGPT access token you got in step 1.
4. Set the `model` to `text-davinci-002-render`, `text-davinci-002-render-paid`, or `text-davinci-002-render-sha` depending on which ChatGPT models that your account has access to. Models **must** be a ChatGPT model name, not the underlying model name, and you cannot use a model that your account does not have access to.
    * You can check which ones you have access to by opening DevTools and going to the Network tab. Refresh the page and look at the response body for https://chat.openai.com/backend-api/models.

#### Notes
- Non-streaming responses over 60s are not supported. Use `stream: true` (API) or `onProgress` (client) as a workaround.
- Rate limit of 50 requests per 15 seconds.
</details>
</details>

## Projects
🚀 A list of awesome projects using `@waylaidwanderer/chatgpt-api`:
- [PandoraAI](https://github.com/waylaidwanderer/PandoraAI): my web chat client powered by node-chatgpt-api, allowing users to easily chat with multiple AI systems while also offering support for custom presets. With its seamless and convenient design, PandoraAI provides an engaging conversational AI experience.
- [ChatGPT Clone](https://github.com/danny-avila/chatgpt-clone): a clone of ChatGPT, uses official model, reverse-engineered UI, with AI model switching, message search, and prompt templates.
- [ChatGPT WebApp](https://github.com/frontend-engineering/chatgpt-webapp-fullstack): a fullstack chat webapp with mobile compatble UI interface, and node-chatgpt-api works as backend. Anyone can deploy your own chat service.
- [halbot](https://github.com/Leask/halbot): Just another ChatGPT/Bing Chat Telegram bot, which is simple design, easy to use, extendable and fun.
- [ChatGPTBox](https://github.com/josStorer/chatGPTBox): Integrating ChatGPT into your browser deeply, everything you need is here

Add yours to the list by [editing this README](https://github.com/waylaidwanderer/node-chatgpt-api/edit/main/README.md) and creating a pull request!

## Web Client
A web client for this project is also available at [waylaidwanderer/PandoraAI](https://github.com/waylaidwanderer/PandoraAI).

## Caveats
### Regarding `ChatGPTClient`
Since `gpt-3.5-turbo` is ChatGPT's underlying model, I had to do my best to replicate the way the official ChatGPT website uses it.
This means my implementation or the underlying model may not behave exactly the same in some ways:
- Conversations are not tied to any user IDs, so if that's important to you, you should implement your own user ID system.
- ChatGPT's model parameters (temperature, frequency penalty, etc.) are unknown, so I set some defaults that I thought would be reasonable.
- Conversations are limited to roughly the last 3000 tokens, so earlier messages may be forgotten during longer conversations.
    - This works in a similar way to ChatGPT, except I'm pretty sure they have some additional way of retrieving context from earlier messages when needed (which can probably be achieved with embeddings, but I consider that out-of-scope for now).

## Contributing
If you'd like to contribute to this project, please create a pull request with a detailed description of your changes.

## License
This project is licensed under the MIT License.
