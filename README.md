# ChatGPT API Server

[![NPM](https://img.shields.io/npm/v/@waylaidwanderer/chatgpt-api.svg)](https://www.npmjs.com/package/@waylaidwanderer/chatgpt-api)
[![npm](https://img.shields.io/npm/dt/@waylaidwanderer/chatgpt-api)](https://www.npmjs.com/package/@waylaidwanderer/chatgpt-api)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/LICENSE)
[![GitHub Repo stars](https://img.shields.io/github/stars/waylaidwanderer/node-chatgpt-api)](https://github.com/waylaidwanderer/node-chatgpt-api/)

This is a simple API server wrapper for [ChatGPT](https://chat.openai.com/chat). It supports multiple OpenAI accounts, setting proxies for each account, and load-balancing requests between accounts.

## Getting Started

### Prerequisites
- Node.js
- npm
- An account with [ChatGPT](https://chat.openai.com/chat)
- A valid [NopeCHA](https://nopecha.com/) API key
- `xvfb` (for headless Chrome)

### Installation
You can install the package using
```
npm i -g @waylaidwanderer/chatgpt-api
```
then run it using
`chatgpt-api` (or `xvfb-run chatgpt-api` for headless servers).  
This takes an optional `--settings=<path_to_settings.js>` parameter, or looks for `settings.js` in the current directory if not set, with the following contents:
```JS
module.exports = {
    accounts: [
        {
            email: 'account1@example.com',
            password: 'password1',
            // Any other options that `ChatGPTAPIBrowser` supports...
        },
        {
            email: 'account2@example.com',
            password: 'password2',
            proxyServer: 'user:pass@ip:port',
        },
        {
            email: 'account3@example.com',
            password: 'password3',
            proxyServer: 'ip:port',
            // Example of overriding the default `nopechaKey` for this account
            nopechaKey: 'accountNopechaKey',
        },
        // Add more accounts as needed...
    ],
    // The port the server will run on (optional, defaults to 3000)
    port: 3000,
    // Your NopeCHA API key.
    // This will be applied to all accounts but can be overridden on a per-account basis.
    nopechaKey: 'nopechaKey',
    // Your 2Captcha API key.
    // This will be applied to all accounts but can be overridden on a per-account basis.
    twoCaptchaKey: '2captchaKey',
};
```

Alternatively, you can install the package locally and run it using `node index.js`:
1. Clone this repository
2. Install dependencies with `npm install`
3. Rename `settings.example.js` to `settings.js` in the root directory and change the settings where required.
4. Start the server using `xvfb-run node index.js` (for headless servers) or `node index.js`

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
    "messageId": "your-message-id"
}
```

If the request is unsuccessful, the server will return a JSON object with an error message and a status code of 503.

If no sessions have finished initializing yet:
```JSON
{
    "error": "No sessions available."
}
```
If there was an error sending the message to ChatGPT:
```JSON
{
    "error": "There was an error communicating with ChatGPT.",
    "code": "message_length_exceeds_limit" // will change depending on the specific error
}
```

## Contributing
If you'd like to contribute to this project, please create a pull request with a detailed description of your changes.

## Acknowledgments
This API server is powered by [@transitive-bullshit's chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api) ([chatgpt on npm](https://www.npmjs.com/package/chatgpt)).

## License
This project is licensed under the MIT License.
