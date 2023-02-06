#!/usr/bin/env node
import fastify from 'fastify';
import { FastifySSEPlugin } from "fastify-sse-v2";
import fs from 'fs';
import { pathToFileURL } from 'url'
import ChatGPTClient from '../src/ChatGPTClient.js';
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

const chatGptClient = new ChatGPTClient(settings.openaiApiKey, settings.chatGptClient, settings.cacheOptions);

const server = fastify();

server.register(FastifySSEPlugin);

server.post('/conversation', async (request, reply) => {
    const body = request.body || {};

    const conversationId = body.conversationId ? body.conversationId.toString() : undefined;

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
        const parentMessageId = body.parentMessageId ? body.parentMessageId.toString() : undefined;
        result = await chatGptClient.sendMessage(body.message, {
            conversationId,
            parentMessageId,
            onProgress,
        });
    } catch (e) {
        error = e;
    }

    if (result !== undefined) {
        if (body.stream === true) {
            reply.sse({ id: '', data: '[DONE]' });
        } else {
            reply.send(result);
        }
        if (settings.apiOptions?.debug) {
            console.debug(result);
        }
    } else {
        console.error(error);
        if (body.stream === true) {
            reply.sse({
                id: '',
                event: 'error',
                data: JSON.stringify({
                    code: 503,
                    error: 'There was an error communicating with ChatGPT.',
                }),
            });
        } else {
            reply.code(503).send({ error: 'There was an error communicating with ChatGPT.' });
        }
    }
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
