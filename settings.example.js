export default {
    // Your OpenAI API key
    openaiApiKey: '',
    chatGptClient: {
        // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
        modelOptions: {
            // The model is set to text-chat-davinci-002-20230126 by default, but you can override
            // it and any other parameters here
            model: 'text-chat-davinci-002-20230126',
            // The default temperature is 0.7, but you can override it here
            temperature: 0.7,
        },
        // (Optional) Set a custom prompt prefix. As per my testing it should work with two newlines
        promptPrefix: 'You are not ChatGPT...\n\n',
        // (Optional) Set to true to enable `console.debug()` logging
        debug: false,
    },
    // Options for the Keyv cache, see https://www.npmjs.com/package/keyv.
    // This is used for storing conversations, and supports additional drivers
    cacheOptions: {},
    // The port the server will run on (optional, defaults to 3000)
    port: 3000,
}
