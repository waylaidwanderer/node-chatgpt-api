export default {
    // Your OpenAI API key
    openaiApiKey: '',
    chatGptClient: {
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
    },
    // Options for the Keyv cache, see https://www.npmjs.com/package/keyv.
    // This is used for storing conversations, and supports additional drivers (conversations are stored in memory by default)
    cacheOptions: {},
    // The port the server will run on (optional, defaults to 3000)
    port: 3000,
    // If set, ChatGPTClient will use `keyv-file` to store conversations to this JSON file instead of in memory.
    // `cacheOptions.store` will override this if set
    storageFilePath: './cache.json',
}
