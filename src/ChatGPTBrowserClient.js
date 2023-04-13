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
        this.setOptions(options);

        cacheOptions.namespace = cacheOptions.namespace || 'chatgpt-browser';
        this.conversationsCache = new Keyv(cacheOptions);
    }

    setOptions(options) {
        if (this.options && !this.options.replaceOptions) {
            this.options = {
                ...this.options,
                ...options,
            };
        } else {
            this.options = options;
        }
        this.accessToken = this.options.accessToken;
        this.cookies = this.options.cookies;
        this.model = this.options.model || 'text-davinci-002-render-sha';
    }

    async postConversation(conversation, onProgress, abortController, onEventMessage = null) {
        const {
            action = 'next',
            conversationId,
            parentMessageId = crypto.randomUUID(),
            message,
        } = conversation;

        if (!abortController) {
            abortController = new AbortController();
        }

        const { debug } = this.options;
        const url = this.options.reverseProxyUrl || 'https://chat.openai.com/backend-api/conversation';
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                Cookie: this.cookies || undefined,
            },

            body: JSON.stringify({
                conversation_id: conversationId,
                action,
                messages: message ? [
                    {
                        id: message.id,
                        role: 'user',
                        content: {
                            content_type: 'text',
                            parts: [message.message],
                        },
                    },
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
        // eslint-disable-next-line no-async-promise-executor
        const response = await new Promise(async (resolve, reject) => {
            let lastEvent = null;
            try {
                let done = false;
                await fetchEventSource(url, {
                    ...opts,
                    signal: abortController.signal,
                    async onopen(openResponse) {
                        if (openResponse.status === 200) {
                            return;
                        }
                        if (debug) {
                            console.debug(openResponse);
                        }
                        let error;
                        try {
                            const body = await openResponse.text();
                            error = new Error(`Failed to send message. HTTP ${openResponse.status} - ${body}`);
                            error.status = openResponse.status;
                            error.json = JSON.parse(body);
                        } catch {
                            error = error || new Error(`Failed to send message. HTTP ${openResponse.status}`);
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
                    onmessage(eventMessage) {
                        if (debug) {
                            console.debug(eventMessage);
                        }

                        if (onEventMessage) {
                            onEventMessage(eventMessage);
                        }

                        if (!eventMessage.data || eventMessage.event === 'ping') {
                            return;
                        }
                        if (eventMessage.data === '[DONE]') {
                            onProgress('[DONE]');
                            abortController.abort();
                            resolve(lastEvent);
                            done = true;
                            return;
                        }
                        try {
                            const data = JSON.parse(eventMessage.data);
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
                            console.debug(eventMessage.data);
                            console.error(err);
                        }
                    },
                });
            } catch (err) {
                reject(err);
            }
        });

        if (!conversationId) {
            response.title = this.genTitle(response);
        }

        return response;
    }

    async sendMessage(
        message,
        opts = {},
    ) {
        if (opts.clientOptions && typeof opts.clientOptions === 'object') {
            this.setOptions(opts.clientOptions);
        }

        let { conversationId } = opts;
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
                message: userMessage,
            },
            opts.onProgress || (() => {}),
            opts.abortController || new AbortController(),
            opts?.onEventMessage,
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
            parentMessageId: replyMessage.parentMessageId,
            messageId: replyMessage.id,
            details: result,
        };
    }

    async genTitle(event) {
        const { debug } = this.options;
        if (debug) {
            console.log('Generate title: ', event);
        }
        if (!event || !event.conversation_id || !event.message || !event.message.id) {
            return null;
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                Cookie: this.cookies || undefined,
            },
            body: JSON.stringify({
                message_id: messageId,
                model: this.model,
            }),
        };

        if (this.options.proxy) {
            opts.dispatcher = new ProxyAgent(this.options.proxy);
        }

        if (debug) {
            console.debug(url, opts);
        }

        try {
            const ret = await fetch(url, opts);
            const data = await ret.text();
            if (debug) {
                console.log('Gen title response: ', data);
            }
            return JSON.parse(data).title;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}
