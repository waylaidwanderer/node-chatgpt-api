import fetch from 'node-fetch';
import crypto from 'crypto';
import Keyv from 'keyv';
import { encode as gptEncode } from 'gpt-3-encoder';

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
            temperature: typeof modelOptions.temperature === 'undefined' ? 0.9 : modelOptions.temperature,
            top_p: typeof modelOptions.top_p === 'undefined' ? 1 : modelOptions.top_p,
            presence_penalty: typeof modelOptions.presence_penalty === 'undefined' ? 0.6 : modelOptions.presence_penalty,
            stop: modelOptions.stop,
        };

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
        }

        cacheOptions.namespace = cacheOptions.namespace || 'chatgpt';
        this.conversationsCache = new Keyv(cacheOptions);
    }

    async getCompletion(prompt) {
        this.modelOptions.prompt = prompt;
        if (this.options.debug) {
            console.debug(this.modelOptions);
        }
        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(this.modelOptions),
        });
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
        const result = await this.getCompletion(prompt);
        if (this.options.debug) {
            console.debug(JSON.stringify(result));
        }

        const reply = result.choices[0].text.trim();

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
        // Iterate through messages, building an array based on the parentMessageId.
        // Each message has an id and a parentMessageId. The parentMessageId is the id of the message that this message is a reply to.
        // The array will contain the messages in the order they should be displayed, starting with the root message.
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

        let promptPrefix;
        if (this.options.promptPrefix) {
            promptPrefix = this.options.promptPrefix;
            // If the prompt prefix doesn't end with the separator token, add it.
            if (!promptPrefix.endsWith(`${this.separatorToken}\n\n`)) {
                promptPrefix = `${promptPrefix.trim()}${this.separatorToken}\n\n`;
            }
        } else {
            const currentDateString = new Date().toLocaleDateString(
                'en-us',
                { year: 'numeric', month: 'long', day: 'numeric' },
            );

            promptPrefix = `You are ChatGPT, a large language model trained by OpenAI.\nCurrent date: ${currentDateString}${this.endToken}\n\n`
        }

        const userLabel = this.options.userLabel || 'User';
        const chatGptLabel = this.options.chatGptLabel || 'ChatGPT';

        const promptSuffix = `${chatGptLabel}:\n`; // Prompt ChatGPT to respond.

        let currentTokenCount = this.getTokenCount(`${promptPrefix}${promptSuffix}`);
        let promptBody = '';
        // I decided to limit conversations to 3097 tokens, leaving 1000 tokens for the response.
        const maxTokenCount = 3097;
        // Iterate backwards through the messages, adding them to the prompt until we reach the max token count.
        while (currentTokenCount < maxTokenCount && orderedMessages.length > 0) {
            const message = orderedMessages.pop();
            const roleLabel = message.role === 'User' ? userLabel : chatGptLabel;
            const messageString = `${roleLabel}:\n${message.message}${this.separatorToken}\n`;
            const newPromptBody = `${messageString}${promptBody}`;

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

        const prompt = `${promptPrefix}${promptBody}${promptSuffix}`;

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
}
