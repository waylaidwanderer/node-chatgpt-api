#!/usr/bin/env node
import fastify from 'fastify';
import cors from '@fastify/cors';
import { FastifySSEPlugin } from "fastify-sse-v2";
import fastifyStatic from '@fastify/static';
import fs from 'fs';
import path from 'path';
import CryptoJS from "crypto-js";
import { pathToFileURL } from 'url'

import ChatGPTClient from '../src/ChatGPTClient.js';
import BingAIClient from '../src/BingAIClient.js';
import { KeyvFile } from 'keyv-file';

const arg = process.argv.find((arg) => arg.startsWith('--settings'));
let settingPath;
if (arg) {
    settingPath = arg.split('=')[1];
} else {
    settingPath = './settings.js';
}

let settings;
if (fs.existsSync(settingPath)) {
    // get the full settingPath
    const fullPath = fs.realpathSync(settingPath);
    settings = (await import(pathToFileURL(fullPath).toString())).default;
} else {
    if (arg) {
        console.error(`Error: the file specified by the --settings parameter does not exist.`);
    } else {
        console.error(`Error: the settings.js file does not exist.`);
    }
    process.exit(1);
}

if (settings.storageFilePath && !settings.cacheOptions.store) {
    // make the directory and file if they don't exist
    const dir = settings.storageFilePath.split('/').slice(0, -1).join('/');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(settings.storageFilePath)) {
        fs.writeFileSync(settings.storageFilePath, '');
    }

    settings.cacheOptions.store = new KeyvFile({ filename: settings.storageFilePath });
}

const clientToUse = settings.apiOptions?.clientToUse || settings.clientToUse || 'chatgpt';

let client;
switch (clientToUse) {
    case 'bing':
        client = new BingAIClient({
            userToken: settings.bingAiClient.userToken,
            debug: settings.bingAiClient.debug,
        });
        break;
    default:
        client = new ChatGPTClient(
            settings.openaiApiKey,
            settings.chatGptClient,
            settings.cacheOptions,
        );
        break;
}

const server = fastify();

await server.register(FastifySSEPlugin);

server.register(fastifyStatic, {
    root: fs.realpathSync('.'),
    prefix: '/'
})
await server.register(cors, {
    origin: '*',
});

server.get('/', async (req, res) => {
    res.code(200);
    res.send('ok')
})
server.get('/MP_verify_ucmvXzViscnLif9o.txt', async (req, reply) => {
    return reply.sendFile("MP_verify_ucmvXzViscnLif9o.txt");
})
  

server.post('/api/chat', async (request, reply) => {
    console.log('api chat message - ', JSON.stringify(request.body));
    try {
        const { hash } = request.body || {}
        if (!hash) {
        throw new Error('Not Authorized')
        }
        console.log('hash and salt: ', hash, process.env.CHAT_SALT);
        const bytes  = CryptoJS.AES.decrypt(hash, process.env.CHAT_SALT);
        console.log('request decrypt: ', bytes);
        const { id, openId, left, date } = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log('request hash data: ', id, openId, left, date);
        if (Math.abs(new Date().valueOf() - Number(date)) > 20000) {
            throw new Error('Verify Failed')
        }
        // Continue biz
        // TODO: Throttle by openId
        // return chatGptHandler(req, res);
    } catch (error) {
        reply.code(400).send(error?.message || 'Auth Failed')
    }
    const body = request.body || {};

    let onProgress;
    if (body.stream === true) {
        onProgress = (token) => {
            if (settings.apiOptions?.debug) {
                console.debug(token);
            }
            reply.sse({ id: '', data: token });
        };
    } else {
        onProgress = null;
    }

    let result;
    let error;
    try {
        if (!body.message) {
            const invalidError = new Error();
            invalidError.data = {
                code: 400,
                message: 'The message parameter is required.',
            };
            // noinspection ExceptionCaughtLocallyJS
            throw invalidError;
        }
        const parentMessageId = body.parentMessageId ? body.parentMessageId.toString() : undefined;
        result = await client.sendMessage(body.message, {
            conversationId: body.conversationId ? body.conversationId.toString() : undefined,
            parentMessageId,
            conversationSignature: body.conversationSignature,
            clientId: body.clientId,
            invocationId: body.invocationId,
            onProgress,
        });
    } catch (e) {
        error = e;
    }

    if (result !== undefined) {
        if (body.stream === true) {
            // reply.sse({ id: '', data: '[DONE]' });
            console.log('stream done result: ', result);
            reply.sse({ id: '', data: '[DONE]' + JSON.stringify({
                messageId: result?.messageId,
                conversationId: result?.conversationId
            }) });
        } else {
            reply.send(result);
        }
        if (settings.apiOptions?.debug) {
            console.debug(result);
        }
    } else {
        const code = error?.data?.code || 503;
        if (code === 503) {
            console.error(error);
        } else if (settings.apiOptions?.debug) {
            console.debug(error);
        }
        const message = error?.data?.message || `There was an error communicating with ${clientToUse === 'bing' ? 'Bing' : 'ChatGPT'}.`;
        if (body.stream === true) {
            reply.sse({
                id: '',
                event: 'error',
                data: JSON.stringify({
                    code,
                    error: message,
                }),
            });
        } else {
            reply.code(code).send({ error: message });
        }
    }
});

const port = settings.apiOptions?.port || settings.port || 3000

server.listen({
    port,
    host: settings.apiOptions?.host || 'localhost'
}, (error) => {
    console.log('server started: ', port)
    if (error) {
        console.error(error);
        process.exit(1);
    }
});
