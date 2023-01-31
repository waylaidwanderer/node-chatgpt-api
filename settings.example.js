export default {
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
}
