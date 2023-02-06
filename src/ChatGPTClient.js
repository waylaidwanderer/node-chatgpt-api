import fetch from 'node-fetch';
import crypto from 'crypto';
import Keyv from 'keyv';
import { encode as gptEncode } from 'gpt-3-encoder';
import { fetchEventSource } from '@fortaine/fetch-event-source';

const CHATGPT_MODEL = 'text-chat-davinci-002-20221122';

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

        this.userLabel = this.options.userLabel || 'User';
        this.chatGptLabel = this.options.chatGptLabel || 'ChatGPT';

        if (this.modelOptions.model.startsWith('text-chat')) {
            this.endToken = '<|im_end|>';
            this.separatorToken = '<|im_sep|>';
        } else {
            this.endToken = '<|endoftext|>';
            this.separatorToken = this.endToken;
        }

        if (!this.modelOptions.stop) {
            if (this.modelOptions.model.startsWith('text-chat')) {
                this.modelOptions.stop = [this.endToken, this.separatorToken];
            } else {
                this.modelOptions.stop = [this.endToken];
            }
            this.modelOptions.stop.push(`\n${this.userLabel}:`);
            // I chose not to do one for `chatGptLabel` because I've never seen it happen
        }

        cacheOptions.namespace = cacheOptions.namespace || 'chatgpt';
        this.conversationsCache = new Keyv(cacheOptions);
    }

    async getCompletion(prompt, onProgress) {
        const modelOptions = { ...this.modelOptions };
        if (typeof onProgress === 'function') {
            modelOptions.stream = true;
        }
        modelOptions.prompt = prompt;
        const debug = this.options.debug;
        if (debug) {
            console.debug(modelOptions);
        }
        const url = 'https://api.openai.com/v1/completions';
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(modelOptions),
        };
        if (modelOptions.stream) {
            return new Promise((resolve, reject) => {
                const controller = new AbortController();
                fetchEventSource(url, {
                    ...opts,
                    signal: controller.signal,
                    onopen(response) {
                        if (response.status === 200) {
                            return;
                        }
                        if (debug) {
                            console.debug(response);
                        }
                        throw new Error(`Failed to send message. HTTP ${response.status} - ${response.statusText}`);
                    },
                    onclose() {
                        throw new Error(`Failed to send message. Server closed the connection unexpectedly.`);
                    },
                    onerror(err) {
                        if (debug) {
                            console.debug(err);
                        }
                        reject(err);
                    },
                    onmessage(message) {
                        if (debug) {
                            console.debug(message);
                        }
                        if (message.data === '[DONE]') {
                            onProgress('[DONE]');
                            controller.abort();
                            resolve();
                            return;
                        }
                        onProgress(JSON.parse(message.data));
                    },
                });
            });
        }
        const response = await fetch(url, opts);
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

        const prompt = await this.buildPrompt(conversation.messages, userMessage.id);

        let reply = '';
        if (typeof opts.onProgress === 'function') {
            await this.getCompletion(prompt, (message) => {
                if (message === '[DONE]') {
                    return;
                }
                const token = message.choices[0].text;
                if (this.options.debug) {
                    console.debug(token);
                }
                opts.onProgress(token);
                reply += token;
            });
        } else {
            const result = await this.getCompletion(prompt, null);
            if (this.options.debug) {
                console.debug(JSON.stringify(result));
            }
            reply = result.choices[0].text;
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
        };
    }

    async buildPrompt(messages, parentMessageId) {
        const orderedMessages = this.constructor.getMessagesForConversation(messages, parentMessageId);

        let promptPrefix;
        if (this.options.promptPrefix) {
            promptPrefix = this.options.promptPrefix.trim();
            // If the prompt prefix doesn't end with the separator token, add it.
            if (!promptPrefix.endsWith(`${this.separatorToken}\n\n`)) {
                promptPrefix = `${promptPrefix.trim()}${this.separatorToken}\n\n`;
            }
            promptPrefix = `\n${this.separatorToken}Instructions:\n${promptPrefix}`;
        } else {
            const currentDateString = new Date().toLocaleDateString(
                'en-us',
                { year: 'numeric', month: 'long', day: 'numeric' },
            );

            promptPrefix = `\n${this.separatorToken}Instructions:\nYou are ChatGPT, a large language model trained by OpenAI.\nCurrent date: ${currentDateString}${this.separatorToken}\n\n`
        }

        const promptSuffix = `${this.chatGptLabel}:\n`; // Prompt ChatGPT to respond.

        let currentTokenCount = this.getTokenCount(`${promptPrefix}${promptSuffix}`);
        let promptBody = '';
        // I decided to limit conversations to 3097 tokens, leaving 1000 tokens for the response.
        const maxTokenCount = 3097;
        // Iterate backwards through the messages, adding them to the prompt until we reach the max token count.
        while (currentTokenCount < maxTokenCount && orderedMessages.length > 0) {
            const message = orderedMessages.pop();
            const roleLabel = message.role === 'User' ? this.userLabel : this.chatGptLabel;
            const messageString = `${roleLabel}:\n${message.message}${this.separatorToken}\n`;
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
            // Always add the first (technically last) message, even if it puts us over the token limit.
            // TODO: throw an error if the first message is over 3000 tokens
            if (promptBody && newTokenCount > maxTokenCount) {
                // This message would put us over the token limit, so don't add it.
                break;
            }
            promptBody = newPromptBody;
            currentTokenCount = newTokenCount;
        }

        const prompt = `${promptBody}${promptSuffix}`;

        const numTokens = this.getTokenCount(prompt);
        // Use up to 4097 tokens (prompt + response), but try to leave 1000 tokens for the response.
        this.modelOptions.max_tokens = Math.min(4097 - numTokens, 1000);

        return prompt;
    }

    getTokenCount(text) {
        if (this.modelOptions.model === CHATGPT_MODEL) {
            // With this model, "<|im_end|>" and "<|im_sep|>" is 1 token, but tokenizers aren't aware of it yet.
            // Replace it with "<|endoftext|>" (which it does know about) so that the tokenizer can count it as 1 token.
            text = text.replace(/<\|im_end\|>/g, '<|endoftext|>');
            text = text.replace(/<\|im_sep\|>/g, '<|endoftext|>');
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
