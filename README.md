# ChatGPT API Server

## Getting Started

### Prerequisites
- Node.js
- npm
- An account with [ChatGPT](https://chat.openai.com/chat)
- A valid [NopeCHA](https://nopecha.com/) API key

### Installation
1. Clone this repository
2. Install dependencies with `npm install`
3. Create a file `settings.js` in the root directory with the following contents:
```JS
export default {
    accounts: [
        {
            email: 'account1@example.com',
            password: 'password1',
        },
        {
            email: 'account2@example.com',
            password: 'password2',
            proxy: 'user:pass@ip:port',
        },
        {
            email: 'account3@example.com',
            password: 'password3',
            proxy: 'ip:port',
        },
        // add more accounts as needed...
    ],
    port: 3000, // the port the server will run on (optional, defaults to 3000)
    nopechaKey: 'nopechaKey', // your NopeCHA API key
};
```
4. Start the server with `node index.js`

## Usage
To start a conversation with ChatGPT, send a POST request to the server's `/conversation` endpoint with a JSON body in the following format:
```
{
    "message": "Hello, how are you today?",
    "conversationId": "your-conversation-id (optional)",
    "parentMessageId": "your-parent-message-id (optional)"
}
```
The server will return a JSON object containing ChatGPT's response:
```
{
    "response": "I'm doing well, thank you! How are you?",
    "conversationId": "your-conversation-id",
    "messageId": "your-message-id"
}
```

If the request is unsuccessful, the server will return a JSON object with an error message and a status code of 503:
```
{
    "error": "No sessions available."
}
```
```
{
    "error": "There was an error communicating with ChatGPT."
}
```

## Contributing
If you'd like to contribute to this project, please create a pull request with a detailed description of your changes.

## Acknowledgments
This API server is powered by [@transitive-bullshit's chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api) ([chatgpt on npm](https://www.npmjs.com/package/chatgpt)).

## License
This project is licensed under the MIT License.
