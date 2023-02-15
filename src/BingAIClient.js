import './fetch-polyfill.js';
import crypto from 'crypto';
import WebSocket from 'ws';

export default class BingAIClient {
    constructor(opts) {
        this.userToken = opts.userToken;
        this.debug = opts.debug;
   }

    async createNewConversation() {
        const response = await fetch("https://www.bing.com/turing/conversation/create", {
            headers: {
                "accept": "application/json",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json",
                "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Microsoft Edge\";v=\"109\", \"Chromium\";v=\"109\"",
                "sec-ch-ua-arch": "\"x86\"",
                "sec-ch-ua-bitness": "\"64\"",
                "sec-ch-ua-full-version": "\"109.0.1518.78\"",
                "sec-ch-ua-full-version-list": "\"Not_A Brand\";v=\"99.0.0.0\", \"Microsoft Edge\";v=\"109.0.1518.78\", \"Chromium\";v=\"109.0.5414.120\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-model": "",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-ch-ua-platform-version": "\"15.0.0\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-ms-client-request-id": crypto.randomUUID(),
                "x-ms-useragent": "azsdk-js-api-client-factory/1.0.0-beta.1 core-rest-pipeline/1.10.0 OS/Win32",
                "cookie": `_U=${this.userToken}`,
                "Referer": "https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx",
                "Referrer-Policy": "origin-when-cross-origin"
            },
        });

        return response.json();
    }

    async createWebSocketConnection() {
        return new Promise((resolve) => {
            const ws = new WebSocket('wss://sydney.bing.com/sydney/ChatHub');

            ws.on('error', console.error);

            ws.on('open', () => {
                if (this.debug) {
                    console.debug('performing handshake');
                }
                ws.send(`{"protocol":"json","version":1}`);
            });

            ws.on('close', () => {
                if (this.debug) {
                    console.debug('disconnected');
                }
            });

            ws.on('message', (data) => {
                const objects = data.toString().split('');
                const messages = objects.map((object) => {
                    try {
                        return JSON.parse(object);
                    } catch (error) {
                        return object;
                    }
                }).filter(message => message);
                if (messages.length === 0) {
                    return;
                }
                if (typeof messages[0] === 'object' && Object.keys(messages[0]).length === 0) {
                    if (this.debug) {
                        console.debug('handshake established');
                    }
                    // ping
                    ws.bingPingInterval = setInterval(() => {
                        ws.send('{"type":6}');
                        // same message is sent back on/after 2nd time as a pong
                    }, 15 * 1000);
                    resolve(ws);
                    return;
                }
                if (this.debug) {
                    console.debug(JSON.stringify(messages));
                }
            });
        });
    }

    async cleanupWebSocketConnection(ws) {
        clearInterval(ws.bingPingInterval);
        ws.close();
        ws.removeAllListeners();
    }

    async sendMessage(
        message,
        opts = {},
    ) {
        let {
            conversationSignature,
            conversationId,
            clientId,
            invocationId = 0,
            onProgress,
        } = opts;

        if (typeof onProgress !== 'function') {
            onProgress = () => {};
        }

        if (!conversationSignature || !conversationId || !clientId) {
            const createNewConversationResponse = await this.createNewConversation();
            if (this.debug) {
                console.debug(createNewConversationResponse);
            }
            if (createNewConversationResponse.result?.value === 'UnauthorizedRequest') {
                throw new Error(`UnauthorizedRequest: ${createNewConversationResponse.result.message}`);
            }
            ({
                conversationSignature,
                conversationId,
                clientId,
            } = createNewConversationResponse);
        }

        const ws = await this.createWebSocketConnection();
        const obj = {
            arguments: [
                {
                    source: 'cib',
                    optionsSets: [
                        'nlu_direct_response_filter',
                        'deepleo',
                        'enable_debug_commands',
                        'disable_emoji_spoken_text',
                        'responsible_ai_policy_235',
                        'enablemm',
                    ],
                    isStartOfSession: invocationId === 0,
                    message: {
                        author: 'user',
                        inputMethod: 'Keyboard',
                        text: message,
                        messageType: 'Chat',
                    },
                    conversationSignature: conversationSignature,
                    participant: {
                        id: clientId,
                    },
                    conversationId,
                }
            ],
            invocationId: invocationId.toString(),
            target: 'chat',
            type: 4,
        };

        const messagePromise = new Promise((resolve, reject) => {
            let replySoFar = '';
            const messageTimeout = setTimeout(
                () => reject(new Error('Timed out waiting for response. Try enabling debug mode to see more information.')),
                120 * 1000,
            );
            ws.on('message', (data) => {
                const objects = data.toString().split('');
                const events = objects.map((object) => {
                    try {
                        return JSON.parse(object);
                    } catch (error) {
                        return object;
                    }
                }).filter(message => message);
                if (events.length === 0) {
                    return;
                }
                const event = events[0];
                switch (event.type) {
                    case 1:
                        const messages = event?.arguments?.[0]?.messages;
                        if (messages[0]?.author !== 'bot') {
                            return;
                        }
                        const updatedText = messages[0]?.text;
                        if (!updatedText || updatedText === replySoFar) {
                            return;
                        }
                        // get the difference between the current text and the previous text
                        const difference = updatedText.substring(replySoFar.length);
                        onProgress(difference);
                        replySoFar = updatedText;
                        return;
                    case 2:
                        if (event.item?.result?.value?.includes('Error')) {
                            this.cleanupWebSocketConnection(ws);
                            if (this.debug) {
                                console.debug(event.item.result.value, event.item.result.message);
                                console.debug(event.item.result.exception);
                            }
                            reject(`${event.item.result.value}: ${event.item.result.message}`);
                            return;
                        }
                        const message = event.item?.messages?.[1];
                        if (message?.author !== 'bot') {
                            return;
                        }
                        this.cleanupWebSocketConnection(ws);
                        clearTimeout(messageTimeout);
                        resolve({
                            message,
                            conversationExpiryTime: event?.item?.conversationExpiryTime,
                        });
                        return;
                    default:
                        return;
                }
            });
        });

        const messageJson = JSON.stringify(obj);
        if (this.debug) {
            console.debug(messageJson);
        }
        ws.send(`${messageJson}`);

        const {
            message: reply,
            conversationExpiryTime,
        } = await messagePromise;
        return {
            conversationSignature,
            conversationId,
            clientId,
            invocationId: invocationId + 1,
            conversationExpiryTime,
            response: reply.text,
            details: reply,
        };
    }
}
