#!/usr/bin/env node
import fastify from 'fastify';
import cors from '@fastify/cors';
import { FastifySSEPlugin } from '@waylaidwanderer/fastify-sse-v2';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { KeyvFile } from 'keyv-file';
import ChatGPTClient from '../src/ChatGPTClient.js';
import ChatGPTBrowserClient from '../src/ChatGPTBrowserClient.js';
import BingAIClient from '../src/BingAIClient.js';

const arg = process.argv.find(_arg => _arg.startsWith('--settings'));
const path = arg?.split('=')[1] ?? './settings.js';

let settings;
if (fs.existsSync(path)) {
    // get the full path
    const fullPath = fs.realpathSync(path);
    settings = (await import(pathToFileURL(fullPath).toString())).default;
} else {
    if (arg) {
        console.error('Error: the file specified by the --settings parameter does not exist.');
    } else {
        console.error('Error: the settings.js file does not exist.');
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
const perMessageClientOptionsWhitelist = settings.apiOptions?.perMessageClientOptionsWhitelist || null;

const server = fastify();

await server.register(FastifySSEPlugin);
await server.register(cors, {
    origin: '*',
});

server.get('/ping', () => Date.now().toString());

server.post('/conversation', async (request, reply) => {
    const body = request.body || {};
    const abortController = new AbortController();

    reply.raw.on('close', () => {
        if (abortController.signal.aborted === false) {
            abortController.abort();
        }
    });

    let onProgress;
    if (body.stream === true) {
        onProgress = (token) => {
            if (settings.apiOptions?.debug) {
                console.debug(token);
            }
            if (token !== '[DONE]') {
                reply.sse({ id: '', data: JSON.stringify(token) });
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

        let clientToUseForMessage = clientToUse;
        const clientOptions = filterClientOptions(body.clientOptions, clientToUseForMessage);
        if (clientOptions && clientOptions.clientToUse) {
            clientToUseForMessage = clientOptions.clientToUse;
            delete clientOptions.clientToUse;
        }

        const messageClient = getClient(clientToUseForMessage);

        result = await messageClient.sendMessage(body.message, {
            jailbreakConversationId: body.jailbreakConversationId,
            conversationId: body.conversationId ? body.conversationId.toString() : undefined,
            parentMessageId: body.parentMessageId ? body.parentMessageId.toString() : undefined,
            conversationSignature: body.conversationSignature,
            clientId: body.clientId,
            invocationId: body.invocationId,
            shouldGenerateTitle: settings.apiOptions?.generateTitles || false, // only used for ChatGPTClient
            toneStyle: body.toneStyle,
            systemMessage: body.systemMessage,
            clientOptions,
            onProgress,
            abortController,
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

    const code = error?.data?.code || (error.name === 'UnauthorizedRequest' ? 401 : 503);
    if (code === 503) {
        console.error(error);
    } else if (settings.apiOptions?.debug) {
        console.debug(error);
    }
    const message = error?.data?.message || error?.message || `There was an error communicating with ${clientToUse === 'bing' ? 'Bing' : 'ChatGPT'}.`;
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
    host: settings.apiOptions?.host || 'localhost',
}, (error) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }
});

function nextTick() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

function getClient(clientToUseForMessage) {
    switch (clientToUseForMessage) {
        case 'bing':
            return new BingAIClient({ ...settings.bingAiClient, cache: settings.cacheOptions });
        case 'chatgpt-browser':
            return new ChatGPTBrowserClient(
                settings.chatGptBrowserClient,
                settings.cacheOptions,
            );
        case 'chatgpt':
            return new ChatGPTClient(
                settings.openaiApiKey || settings.chatGptClient.openaiApiKey,
                settings.chatGptClient,
                settings.cacheOptions,
            );
        default:
            throw new Error(`Invalid clientToUse: ${clientToUseForMessage}`);
    }
}

/**
 * Filter objects to only include whitelisted properties set in
 * `settings.js` > `apiOptions.perMessageClientOptionsWhitelist`.
 * Returns original object if no whitelist is set.
 * @param {*} inputOptions
 * @param clientToUseForMessage
 */
function filterClientOptions(inputOptions, clientToUseForMessage) {
    if (!inputOptions || !perMessageClientOptionsWhitelist) {
        return null;
    }

    // If inputOptions.clientToUse is set and is in the whitelist, use it instead of the default
    if (
        perMessageClientOptionsWhitelist.validClientsToUse
        && inputOptions.clientToUse
        && perMessageClientOptionsWhitelist.validClientsToUse.includes(inputOptions.clientToUse)
    ) {
        clientToUseForMessage = inputOptions.clientToUse;
    } else {
        inputOptions.clientToUse = clientToUseForMessage;
    }

    const whitelist = perMessageClientOptionsWhitelist[clientToUseForMessage];
    if (!whitelist) {
        // No whitelist, return all options
        return inputOptions;
    }

    const outputOptions = {
        clientToUse: clientToUseForMessage,
    };

    for (const property of Object.keys(inputOptions)) {
        const allowed = whitelist.includes(property);

        if (!allowed && typeof inputOptions[property] === 'object') {
            // Check for nested properties
            for (const nestedProp of Object.keys(inputOptions[property])) {
                const nestedAllowed = whitelist.includes(`${property}.${nestedProp}`);
                if (nestedAllowed) {
                    outputOptions[property] = outputOptions[property] || {};
                    outputOptions[property][nestedProp] = inputOptions[property][nestedProp];
                }
            }
            continue;
        }

        // Copy allowed properties to outputOptions
        if (allowed) {
            outputOptions[property] = inputOptions[property];
        }
    }

    return outputOptions;
}
