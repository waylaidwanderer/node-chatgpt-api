import './fetch-polyfill.js';
import crypto from 'crypto';
import Keyv from 'keyv';
import { encode as gptEncode } from 'gpt-3-encoder';
import { fetchEventSource } from '@waylaidwanderer/fetch-event-source';
import { Agent } from 'undici';

const CHATGPT_MODEL = 'text-chat-davinci-002-sh-alpha-aoruigiofdj83';

export default class ChatGPTClient {
    constructor(
        apiKey,
        options = {},
        cacheOptions = {},
    ) {
        this.apiKey = apiKey;

        this.options = options;
        const modelOptions = options.modelOptions || {};
        this.modelOptions = {
            ...modelOptions,
            // set some good defaults (check for undefined in some cases because they may be 0)
            model: modelOptions.model || CHATGPT_MODEL,
            temperature: typeof modelOptions.temperature === 'undefined' ? 0.8 : modelOptions.temperature,
            top_p: typeof modelOptions.top_p === 'undefined' ? 1 : modelOptions.top_p,
            presence_penalty: typeof modelOptions.presence_penalty === 'undefined' ? 1 : modelOptions.presence_penalty,
            stop: modelOptions.stop,
        };

        // Davinci models have a max context length of 4097 tokens.
        this.maxContextTokens = this.options.maxContextTokens || 4097;
        // I decided to reserve 1024 tokens for the response.
        // The max prompt tokens is determined by the max context tokens minus the max response tokens.
        // Earlier messages will be dropped until the prompt is within the limit.
        this.maxResponseTokens = this.modelOptions.max_tokens || 1024;
        this.maxPromptTokens = this.options.maxPromptTokens || (this.maxContextTokens - this.maxResponseTokens);

        if (this.maxPromptTokens + this.maxResponseTokens > this.maxContextTokens) {
            throw new Error(`maxPromptTokens + max_tokens (${this.maxPromptTokens} + ${this.maxResponseTokens} = ${this.maxPromptTokens + this.maxResponseTokens}) must be less than or equal to maxContextTokens (${this.maxContextTokens})`);
        }

        this.isChatGptModel = this.modelOptions.model.startsWith('gpt-3.5-turbo');
        const isChatGptModel = this.isChatGptModel;
        this.isUnofficialChatGptModel = this.modelOptions.model.startsWith('text-chat') || this.modelOptions.model.startsWith('text-davinci-002-render');
        const isUnofficialChatGptModel = this.isUnofficialChatGptModel;

        this.userLabel = this.options.userLabel || 'User';
        this.chatGptLabel = this.options.chatGptLabel || 'ChatGPT';

        if (isChatGptModel) {
            if (this.userLabel.toLowerCase() === 'user') {
                this.userLabel = null;
            }
            if (this.chatGptLabel.toLowerCase() === 'assistant') {
                this.chatGptLabel = null;
            }
        }

        // {"role": "user", "content": "Hello"} - with the ChatGPT API this uses 8 tokens
        this.messageTokenOffset = 7;

        if (isChatGptModel) {
            this.startToken = '';
            this.endToken = '';
        } else if (isUnofficialChatGptModel) {
            this.startToken = '<|im_start|>';
            this.endToken = '<|im_end|>';
        } else {
            this.startToken = '<|endoftext|>';
            this.endToken = this.startToken;
        }

        if (!isChatGptModel && !this.modelOptions.stop) {
            if (isUnofficialChatGptModel) {
                this.modelOptions.stop = [this.endToken, this.startToken];
            } else {
                this.modelOptions.stop = [this.endToken];
            }
            this.modelOptions.stop.push(`\n${this.userLabel}:`);
            // I chose not to do one for `chatGptLabel` because I've never seen it happen
        }

        if (this.options.reverseProxyUrl) {
            this.completionsUrl = this.options.reverseProxyUrl;
        } else if (isChatGptModel) {
            this.completionsUrl = 'https://api.openai.com/v1/chat/completions';
        } else {
            this.completionsUrl = 'https://api.openai.com/v1/completions';
        }

        cacheOptions.namespace = cacheOptions.namespace || 'chatgpt';
        this.conversationsCache = new Keyv(cacheOptions);
    }

    async getCompletion(input, onProgress, abortController = null) {
        if (!abortController) {
            abortController = new AbortController();
        }
        const modelOptions = { ...this.modelOptions };
        if (typeof onProgress === 'function') {
            modelOptions.stream = true;
        }
        if (this.isChatGptModel) {
            modelOptions.messages = input;
        } else {
            modelOptions.prompt = input;
        }
        const debug = this.options.debug;
        const url = this.completionsUrl;
        if (debug) {
            console.debug();
            console.debug(url);
            console.debug(modelOptions);
            console.debug();
        }
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(modelOptions),
            dispatcher: new Agent({
                bodyTimeout: 0,
                headersTimeout: 0,
            }),
        };
        if (modelOptions.stream) {
            return new Promise(async (resolve, reject) => {
                try {
                    let done = false;
                    await fetchEventSource(url, {
                        ...opts,
                        signal: abortController.signal,
                        async onopen(response) {
                            if (response.status === 200) {
                                return;
                            }
                            if (debug) {
                                console.debug(response);
                            }
                            let error;
                            try {
                                const body = await response.text();
                                error = new Error(`Failed to send message. HTTP ${response.status} - ${body}`);
                                error.status = response.status;
                                error.json = JSON.parse(body);
                            } catch {
                                error = error || new Error(`Failed to send message. HTTP ${response.status}`);
                            }
                            throw error;
                        },
                        onclose() {
                            if (debug) {
                                console.debug('Server closed the connection unexpectedly, returning...');
                            }
                            // workaround for private API not sending [DONE] event
                            if (!done) {
                                onProgress('[DONE]');
                                abortController.abort();
                                resolve();
                            }
                        },
                        onerror(err) {
                            if (debug) {
                                console.debug(err);
                            }
                            // rethrow to stop the operation
                            throw err;
                        },
                        onmessage(message) {
                            if (debug) {
                                console.debug(message);
                            }
                            if (!message.data || message.event === 'ping') {
                                return;
                            }
                            if (message.data === '[DONE]') {
                                onProgress('[DONE]');
                                abortController.abort();
                                resolve();
                                done = true;
                                return;
                            }
                            onProgress(JSON.parse(message.data));
                        },
                    });
                } catch (err) {
                    reject(err);
                }
            });
        }
        const response = await fetch(
            url,
            {
                ...opts,
                signal: abortController.signal,
            },
        );
        if (response.status !== 200) {
            const body = await response.text();
            const error = new Error(`Failed to send message. HTTP ${response.status} - ${body}`);
            error.status = response.status;
            try {
                error.json = JSON.parse(body);
            } catch {
                error.body = body;
            }
            throw error;
        }
        return response.json();
    }

    async sendMessage(
        message,
        opts = {},
    ) {
        const conversationId = opts.conversationId || crypto.randomUUID();
        const parentMessageId = opts.parentMessageId || crypto.randomUUID();

        let conversation = await this.conversationsCache.get(conversationId);
        if (!conversation) {
            conversation = {
                messages: [],
                createdAt: Date.now(),
            };
        }

        const userMessage = {
            id: crypto.randomUUID(),
            parentMessageId,
            role: 'User',
            message,
        };

        conversation.messages.push(userMessage);

        let payload;
        if (this.isChatGptModel) {
            payload = await this.buildChatPayload(conversation.messages, userMessage.id);
        } else {
            payload = await this.buildPrompt(conversation.messages, userMessage.id);
        }

        let reply = '';
        let result = null;
        if (typeof opts.onProgress === 'function') {
            await this.getCompletion(
                payload,
                (message) => {
                    if (message === '[DONE]') {
                        return;
                    }
                    const token = this.isChatGptModel ? message.choices[0].delta.content : message.choices[0].text;
                    // first event's delta content is always undefined
                    if (!token) {
                        return;
                    }
                    if (this.options.debug) {
                        console.debug(token);
                    }
                    if (token === this.endToken) {
                        return;
                    }
                    opts.onProgress(token);
                    reply += token;
                },
                opts.abortController || new AbortController(),
            );
        } else {
            result = await this.getCompletion(
                payload,
                null,
                opts.abortController || new AbortController(),
            );
            if (this.options.debug) {
                console.debug(JSON.stringify(result));
            }
            if (this.isChatGptModel) {
                reply = result.choices[0].message.content;
            } else {
                reply = result.choices[0].text.replace(this.endToken, '');
            }
        }

        // avoids some rendering issues when using the CLI app
        if (this.options.debug) {
            console.debug();
        }

        reply = reply.trim();

        const replyMessage = {
            id: crypto.randomUUID(),
            parentMessageId: userMessage.id,
            role: 'ChatGPT',
            message: reply,
        };
        conversation.messages.push(replyMessage);

        await this.conversationsCache.set(conversationId, conversation);

        return {
            response: replyMessage.message,
            conversationId,
            messageId: replyMessage.id,
            details: result || {},
        };
    }

    async buildChatPayload(messages, parentMessageId) {
        const orderedMessages = this.constructor.getMessagesForConversation(messages, parentMessageId);

        let systemMessage;
        if (this.options.promptPrefix) {
            systemMessage = this.options.promptPrefix.trim();
        } else {
            const currentDateString = new Date().toLocaleDateString(
                'en-us',
                { year: 'numeric', month: 'long', day: 'numeric' },
            );
            systemMessage = `You are ChatGPT, a large language model trained by OpenAI.\nCurrent date: ${currentDateString}`;
        }

        const payload = [];

        let isFirstMessage = true;
        let currentTokenCount = systemMessage ? (this.getTokenCount(systemMessage) + this.messageTokenOffset) : 0;
        const maxTokenCount = this.maxPromptTokens;
        // Iterate backwards through the messages, adding them to the prompt until we reach the max token count.
        while (currentTokenCount < maxTokenCount && orderedMessages.length > 0) {
            const message = orderedMessages.pop();

            let messageString = message.message;
            if (message.role === 'User') {
                // The "name" property isn't recognized by the AI for some reason, so we manually add it here.
                if (this.userLabel) {
                    messageString = `${this.userLabel}:\n${messageString}`;
                }
                // The "name" property is normally recognized by the AI but the first message is not from the AI,
                // so we manually add it here.
                if (this.chatGptLabel && isFirstMessage) {
                    messageString = `${messageString}\n${this.chatGptLabel}:\n`;
                }
            }

            const newTokenCount = this.getTokenCount(messageString) + currentTokenCount + this.messageTokenOffset;
            if (newTokenCount > maxTokenCount) {
                if (!isFirstMessage) {
                    // This message would put us over the token limit, so don't add it.
                    break;
                }
                // This is the first message, so we can't add it. Just throw an error.
                throw new Error(`Prompt is too long. Max token count is ${maxTokenCount}, but prompt is ${newTokenCount} tokens long.`);
            }

            const messagePayload = {
                role: message.role === 'User' ? 'user' : 'assistant',
                content: messageString,
            };
            // Set name property as the user labels, but make it fit the required format.
            if (message.role === 'User' && this.userLabel) {
                messagePayload.name = this.userLabel.replace(/[^\w-]/gi, '-').substring(0, 64);
            } else if (message.role === 'ChatGPT' && this.chatGptLabel) {
                messagePayload.name = this.chatGptLabel.replace(/[^\w-]/gi, '-').substring(0, 64);
            }

            payload.unshift(messagePayload);
            isFirstMessage = false;
            currentTokenCount = newTokenCount;
        }

        if (systemMessage) {
            // We insert the system message before the last message.
            // This seems to be more effective when it comes to instructing the model.
            payload.splice(payload.length - 1, 0, {
                role: 'user',
                name: 'system_instructions',
                content: systemMessage,
            });
        }

        return payload;
    }

    async buildPrompt(messages, parentMessageId) {
        const orderedMessages = this.constructor.getMessagesForConversation(messages, parentMessageId);

        let promptPrefix;
        if (this.options.promptPrefix) {
            promptPrefix = this.options.promptPrefix.trim();
            // If the prompt prefix doesn't end with the separator token, add it.
            if (!promptPrefix.endsWith(`${this.startToken}\n\n`)) {
                promptPrefix = `${promptPrefix.trim()}${this.startToken}\n\n`;
            }
            promptPrefix = `\n${this.startToken}Instructions:\n${promptPrefix}`;
        } else {
            const currentDateString = new Date().toLocaleDateString(
                'en-us',
                { year: 'numeric', month: 'long', day: 'numeric' },
            );
            promptPrefix = `\n${this.startToken}Instructions:\nYou are ChatGPT, a large language model trained by OpenAI.\nCurrent date: ${currentDateString}${this.startToken}\n\n`
        }

        const promptSuffix = `${this.chatGptLabel}:\n`; // Prompt ChatGPT to respond.

        let currentTokenCount = this.getTokenCount(`${promptPrefix}${promptSuffix}`);
        let promptBody = '';
        const maxTokenCount = this.maxPromptTokens;
        // Iterate backwards through the messages, adding them to the prompt until we reach the max token count.
        while (currentTokenCount < maxTokenCount && orderedMessages.length > 0) {
            const message = orderedMessages.pop();
            const roleLabel = message.role === 'User' ? this.userLabel : this.chatGptLabel;
            const messageString = `${roleLabel}:\n${message.message}${this.endToken}\n`;
            let newPromptBody;
            if (promptBody) {
                newPromptBody = `${messageString}${promptBody}`;
            } else {
                // Always insert prompt prefix before the last user message.
                // This makes the AI obey the prompt instructions better, which is important for custom instructions.
                // After a bunch of testing, it doesn't seem to cause the AI any confusion, even if you ask it things
                // like "what's the last thing I wrote?".
                newPromptBody = `${promptPrefix}${messageString}${promptBody}`;
            }

            // The reason I don't simply get the token count of the messageString and add it to currentTokenCount is because
            // joined words may combine into a single token. Actually, that isn't really applicable here, but I can't
            // resist doing it the "proper" way.
            const newTokenCount = this.getTokenCount(`${promptPrefix}${newPromptBody}${promptSuffix}`);
            if (newTokenCount > maxTokenCount) {
                if (promptBody) {
                    // This message would put us over the token limit, so don't add it.
                    break;
                }
                // This is the first message, so we can't add it. Just throw an error.
                throw new Error(`Prompt is too long. Max token count is ${maxTokenCount}, but prompt is ${newTokenCount} tokens long.`);
            }
            promptBody = newPromptBody;
            currentTokenCount = newTokenCount;
        }

        const prompt = `${promptBody}${promptSuffix}`;

        const numTokens = this.getTokenCount(prompt);
        // Use up to `this.maxContextTokens` tokens (prompt + response), but try to leave `this.maxTokens` tokens for the response.
        this.modelOptions.max_tokens = Math.min(this.maxContextTokens - numTokens, this.maxResponseTokens);

        return prompt;
    }

    getTokenCount(text) {
        if (this.isUnofficialChatGptModel) {
            // With this model, "<|im_end|>" and "<|im_start|>" is 1 token, but tokenizers aren't aware of it yet.
            // Replace it with "<|endoftext|>" (which it does know about) so that the tokenizer can count it as 1 token.
            text = text.replace(/<\|im_end\|>/g, '<|endoftext|>');
            text = text.replace(/<\|im_start\|>/g, '<|endoftext|>');
        }
        return gptEncode(text).length;
    }

    /**
     * Iterate through messages, building an array based on the parentMessageId.
     * Each message has an id and a parentMessageId. The parentMessageId is the id of the message that this message is a reply to.
     * @param messages
     * @param parentMessageId
     * @returns {*[]} An array containing the messages in the order they should be displayed, starting with the root message.
     */
    static getMessagesForConversation(messages, parentMessageId) {
        const orderedMessages = [];
        let currentMessageId = parentMessageId;
        while (currentMessageId) {
            const message = messages.find((m) => m.id === currentMessageId);
            if (!message) {
                break;
            }
            orderedMessages.unshift(message);
            currentMessageId = message.parentMessageId;
        }

        return orderedMessages;
    }
}
