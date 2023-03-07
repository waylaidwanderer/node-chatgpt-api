import './fetch-polyfill.js';
import crypto from 'crypto';
import Keyv from 'keyv';
import { fetchEventSource } from '@waylaidwanderer/fetch-event-source';
import { ProxyAgent } from 'undici';

export default class ChatGPTBrowserClient {
    constructor(
        options = {},
        cacheOptions = {},
    ) {
        this.options = options;
        this.accessToken = options.accessToken;
        this.cookies = options.cookies;
        this.model = options.model || 'text-davinci-002-render-sha';

        cacheOptions.namespace = cacheOptions.namespace || 'chatgpt-browser';
        this.conversationsCache = new Keyv(cacheOptions);
    }

    async postConversation(conversation, onProgress, abortController = null) {
        const {
            action = 'next',
            conversationId,
            parentMessageId = crypto.randomUUID(),
            message,
        } = conversation;

        if (!abortController) {
            abortController = new AbortController();
        }

        const debug = this.options.debug;
        const url = this.options.reverseProxyUrl || 'https://chat.openai.com/backend-api/conversation';
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
                Cookie: this.cookies || undefined,
            },

            body: JSON.stringify({
                conversation_id: conversationId,
                action,
                messages: message ? [
                    {
                        id: crypto.randomUUID(),
                        role: 'user',
                        content: {
                            content_type: 'text',
                            parts: [message],
                        },
                    }
                ] : undefined,
                parent_message_id: parentMessageId,
                model: this.model,
            }),
        };

        if (this.options.proxy) {
            opts.dispatcher = new ProxyAgent(this.options.proxy);
        }

        if (debug) {
            console.debug();
            console.debug(url);
            console.debug(opts);
            console.debug();
        }

        // data: {"message": {"id": "UUID", "role": "assistant", "user": null, "create_time": null, "update_time": null, "content": {"content_type": "text", "parts": ["That's alright! If you don't have a specific question or topic in mind, I can suggest some general conversation starters or topics to explore. \n\nFor example, we could talk about your interests, hobbies, or goals. Alternatively, we could discuss current events, pop culture, or science and technology. Is there anything in particular that you're curious about or would like to learn more about?"]}, "end_turn": true, "weight": 1.0, "metadata": {"message_type": "next", "model_slug": "text-davinci-002-render-sha", "finish_details": {"type": "stop", "stop": "<|im_end|>"}}, "recipient": "all"}, "conversation_id": "UUID", "error": null}
        const response = await new Promise(async (resolve, reject) => {
            let lastEvent = null;
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
                        if (!done) {
                            if (!lastEvent) {
                                reject(new Error('Server closed the connection unexpectedly. Please make sure you are using a valid access token.'));
                                return;
                            }
                            onProgress('[DONE]');
                            abortController.abort();
                            resolve(lastEvent);
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
                            resolve(lastEvent);
                            done = true;
                            return;
                        }
                        try {
                            const data = JSON.parse(message.data);
                            // ignore any messages that are not from the assistant
                            if (data.message?.author?.role !== 'assistant') {
                                return;
                            }
                            const lastMessage = lastEvent ? lastEvent.message.content.parts[0] : '';
                            const newMessage = data.message.content.parts[0];
                            // get the difference between the current text and the previous text
                            const difference = newMessage.substring(lastMessage.length);
                            lastEvent = data;
                            onProgress(difference);
                        } catch (err) {
                            console.debug(message.data);
                            console.error(err);
                        }
                    },
                });
            } catch (err) {
                reject(err);
            }
        });

        if (!conversationId) {
            this.genTitle(response);
        }

        return response;
    }

    async sendMessage(
        message,
        opts = {},
    ) {
        let conversationId = opts.conversationId;
        const parentMessageId = opts.parentMessageId || crypto.randomUUID();

        let conversation;
        if (conversationId) {
            conversation = await this.conversationsCache.get(conversationId);
        }
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

        const result = await this.postConversation(
            {
                conversationId,
                parentMessageId,
                message,
            },
            opts.onProgress || (() => {}),
            opts.abortController || new AbortController(),
        );

        if (this.options.debug) {
            console.debug(JSON.stringify(result));
            console.debug();
        }

        conversationId = result.conversation_id;
        const reply = result.message.content.parts[0].trim();

        const replyMessage = {
            id: result.message.id,
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
            details: result,
        };
    }

    genTitle(event) {
        const debug = this.options.debug;
        if (debug) {
            console.log('Generate title: ', event);
        }
        if (!event || !event.conversation_id || !event.message || !event.message.id) {
            return;
        }

        const conversationId = event.conversation_id;
        const messageId = event.message.id;

        const baseUrl = this.options.reverseProxyUrl || 'https://chat.openai.com/backend-api/conversation';
        const url = `${baseUrl}/gen_title/${conversationId}`;
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
                Cookie: this.cookies || undefined,
            },
            body: JSON.stringify({
                message_id: messageId,
                model: this.model,
            }),
        };

        if (debug) {
            console.log('gen title fetch opts: ', opts);
        }

        if (this.options.proxy) {
            opts.dispatcher = new ProxyAgent(this.options.proxy);
        }

        fetch(url, opts).then((ret) => {
            if (debug) {
                ret.json().then((data) => {
                    console.log('Gen title response: ', data);
                }).catch(console.error);
            }
        }).catch(console.error);
    }
}
