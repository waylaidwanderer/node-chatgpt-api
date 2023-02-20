#!/usr/bin/env node
import fastify from 'fastify';
import cors from '@fastify/cors';
import { FastifySSEPlugin } from "@waylaidwanderer/fastify-sse-v2";
import fs from 'fs';
import { pathToFileURL } from 'url'
import ChatGPTClient from '../src/ChatGPTClient.js';
import ChatGPTBrowserClient from '../src/ChatGPTBrowserClient.js';
import BingAIClient from '../src/BingAIClient.js';
import { KeyvFile } from 'keyv-file';

const arg = process.argv.find((arg) => arg.startsWith('--settings'));
let path;
if (arg) {
    path = arg.split('=')[1];
} else {
    path = './settings.js';
}

let settings;
if (fs.existsSync(path)) {
    // get the full path
    const fullPath = fs.realpathSync(path);
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
        client = new BingAIClient(settings.bingAiClient);
        break;
    case 'chatgpt-browser':
        client = new ChatGPTBrowserClient(
            settings.chatGptBrowserClient,
            settings.cacheOptions,
        );
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
await server.register(cors, {
    origin: '*',
});

server.post('/conversation', async (request, reply) => {
    const body = request.body || {};

    let onProgress;
    if (body.stream === true) {
        onProgress = (token) => {
            if (settings.apiOptions?.debug) {
                console.debug(token);
            }
            if (token !== '[DONE]') {
                reply.sse({ id: '', data: token });
            }
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
        if (settings.apiOptions?.debug) {
            console.debug(result);
        }
        if (body.stream === true) {
            reply.sse({ event: 'result', id: '', data: JSON.stringify(result) });
            reply.sse({ id: '', data: '[DONE]' });
            await nextTick();
            return reply.raw.end();
        }
        return reply.send(result);
    }

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
        await nextTick();
        return reply.raw.end();
    }
    return reply.code(code).send({ error: message });
});

server.listen({
    port: settings.apiOptions?.port || settings.port || 3000,
    host: settings.apiOptions?.host || 'localhost'
}, (error) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }
});

function nextTick() {
    return new Promise((resolve) => {
        process.nextTick(resolve);
    });
}

