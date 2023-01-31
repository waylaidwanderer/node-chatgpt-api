# ChatGPT API Server

[![NPM](https://img.shields.io/npm/v/@waylaidwanderer/chatgpt-api.svg)](https://www.npmjs.com/package/@waylaidwanderer/chatgpt-api)
[![npm](https://img.shields.io/npm/dt/@waylaidwanderer/chatgpt-api)](https://www.npmjs.com/package/@waylaidwanderer/chatgpt-api)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/LICENSE)
[![GitHub Repo stars](https://img.shields.io/github/stars/waylaidwanderer/node-chatgpt-api)](https://github.com/waylaidwanderer/node-chatgpt-api/)

This is an implementation of [ChatGPT](https://chat.openai.com/chat) using the (unofficial) official ChatGPT model, `text-chat-davinci-002-20230126`. This model name was briefly leaked while I was  inspecting the network requests made by the official ChatGPT website, and I discovered that it works with the [OpenAI API](https://beta.openai.com/docs/api-reference/completions). **Usage of this model currently does not cost any credits.**

As far as I'm aware, I was the first one who discovered this, and usage of the model has since been implemented in libraries like [acheong08/ChatGPT](https://github.com/acheong08/ChatGPT).

The previous version of this library that used [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api) is still available on [the `archive/old-version` branch](https://github.com/waylaidwanderer/node-chatgpt-api/tree/archive/old-version).

## Features
- Uses the unofficial official ChatGPT model, `text-chat-davinci-002-20230126`.
- Includes an API server you can run to use ChatGPT in non-Node.js applications.
- Includes a `ChatGPTClient` class that you can use in your own Node.js applications.
- Replicates chat threads from the official ChatGPT website (with conversation IDs and message IDs), with persistent conversations using [Keyv](https://www.npmjs.com/package/keyv).
  - Conversations are stored in memory by default, but you can optionally [install a storage adapter](https://www.npmjs.com/package/keyv#usage) to persist conversations to a database.

## Getting Started

### Prerequisites
- Node.js
- npm
- [OpenAI API key](https://platform.openai.com/account/api-keys)

### Installation
You can install the package using
```
npm i -g @waylaidwanderer/chatgpt-api
```
then run it using
`chatgpt-api`.  
This takes an optional `--settings=<path_to_settings.js>` parameter, or looks for `settings.js` in the current directory if not set, with the following contents:
```JS
module.exports = {
    // Your OpenAI API key
    openaiApiKey: '',
    // Parameters as described in https://platform.openai.com/docs/api-reference/completions
    // The model is set to text-chat-davinci-002-20230126 by default, but you can override
    // it and any other parameters here.
    chatGptClient: {
        // temperature: 0.7,
    },
    // Options for the Keyv cache, see https://www.npmjs.com/package/keyv
    // This is used for storing conversations, and supports additional drivers.
    cacheOptions: {},
    // The port the server will run on (optional, defaults to 3000)
    port: 3000,
};
```

Alternatively, you can install the package locally and run it using `node index.js`:
1. Clone this repository
2. Install dependencies with `npm install`
3. Rename `settings.example.js` to `settings.js` in the root directory and change the settings where required.
4. Start the server using `npm start` or `node src/index.js`

## Usage
To start a conversation with ChatGPT, send a POST request to the server's `/conversation` endpoint with a JSON body in the following format:
```JSON
{
    "message": "Hello, how are you today?",
    "conversationId": "your-conversation-id (optional)",
    "parentMessageId": "your-parent-message-id (optional)"
}
```
The server will return a JSON object containing ChatGPT's response:
```JSON
{
    "response": "I'm doing well, thank you! How are you?",
    "conversationId": "your-conversation-id",
    "messageId": "response-message-id"
}
```

If the request is unsuccessful, the server will return a JSON object with an error message and a status code of 503.

If there was an error sending the message to ChatGPT:
```JSON
{
    "error": "There was an error communicating with ChatGPT."
}
```

## Contributing
If you'd like to contribute to this project, please create a pull request with a detailed description of your changes.

## License
This project is licensed under the MIT License.
