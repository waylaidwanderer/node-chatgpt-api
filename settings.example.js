export default {
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
        // If www.bing.com is reverse proxy, you can customize the configuration host 
        host: '',
        // The "_U" cookie value from bing.com
        userToken: '',
        // If the above doesn't work, provide all your cookies as a string instead
        cookies: '',
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
}
