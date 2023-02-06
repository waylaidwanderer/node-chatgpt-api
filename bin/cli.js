#!/usr/bin/env node
import fs from 'fs';
import { pathToFileURL } from 'url';
import { KeyvFile } from 'keyv-file';
import ChatGPTClient from '../src/ChatGPTClient.js';
import boxen from 'boxen';
import ora from 'ora';
import clipboard from 'clipboardy';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';

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

let conversationId = null;
let parentMessageId = null;

const availableCommands = [
    {
        name: '!editor - Open the editor (for multi-line messages)',
        value: '!editor',
    },
    {
        name: '!resume - Resume last conversation',
        value: '!resume',
    },
    {
        name: '!new - Start new conversation',
        value: '!new',
    },
    {
        name: '!copy - Copy conversation to clipboard',
        value: '!copy',
    },
    {
        name: '!delete-all - Delete all conversations',
        value: '!delete-all',
    },
    {
        name: '!exit - Exit ChatGPT CLI',
        value: '!exit',
    },
];

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

const chatGptClient = new ChatGPTClient(settings.openaiApiKey, settings.chatGptClient, settings.cacheOptions);

console.log(tryBoxen('ChatGPT CLI', { padding: 0.7, margin: 1, borderStyle: 'double', dimBorder: true }));

await conversation();

async function conversation() {
    console.log('Type "!" to access the command menu.');
    const prompt = inquirer.prompt([
        {
            type: 'autocomplete',
            name: 'message',
            message: 'Write a message:',
            searchText: '​',
            emptyText: '​',
            suggestOnly: true,
            source: () => Promise.resolve([]),
        },
    ]);
    // hiding the ugly autocomplete hint
    prompt.ui.activePrompt.firstRender = false;
    // The below is a hack to allow selecting items from the autocomplete menu while also being able to submit messages.
    // This basically simulates a hybrid between having `suggestOnly: false` and `suggestOnly: true`.
    await new Promise((resolve) => setTimeout(resolve, 0));
    prompt.ui.activePrompt.opt.source = (answers, input) => {
        if (!input) {
            return [];
        }
        prompt.ui.activePrompt.opt.suggestOnly = !input.startsWith('!');
        return availableCommands.filter((command) => command.value.startsWith(input));
    };
    let { message } = await prompt;
    message = message.trim();
    if (!message) {
        return conversation();
    }
    if (message.startsWith('!')) {
        switch (message) {
            case '!editor':
                return useEditor();
            case '!resume':
                return resumeConversation();
            case '!new':
                return newConversation();
            case '!copy':
                return copyConversation();
            case '!delete-all':
                return deleteAllConversations();
            case '!exit':
                return true;
        }
    }
    return onMessage(message);
}

async function onMessage(message) {
    const chatGptLabel = settings.chatGptClient?.chatGptLabel || 'ChatGPT';
    let reply = '';
    const spinnerPrefix = `${chatGptLabel} is typing...`;
    const spinner = ora(spinnerPrefix);
    spinner.prefixText = '\n   ';
    spinner.start();
    try {
        const response = await chatGptClient.sendMessage(message, {
            conversationId,
            parentMessageId,
            onProgress: (token) => {
                reply += token;
                const output = tryBoxen(`${reply}█`, { title: chatGptLabel, padding: 0.7, margin: 1, dimBorder: true });
                spinner.text = `${spinnerPrefix}\n${output}`;
            },
        });
        clipboard.write(response.response).then(() => {}).catch(() => {});
        spinner.stop();
        conversationId = response.conversationId;
        parentMessageId = response.messageId;
        await chatGptClient.conversationsCache.set('lastConversation', {
            conversationId,
            parentMessageId,
        });
        const output = tryBoxen(response.response, { title: chatGptLabel, padding: 0.7, margin: 1, dimBorder: true });
        console.log(output);
    } catch (error) {
        spinner.stop();
        logError(error?.json?.error?.message || error.body || error || 'Unknown error');
    }
    return conversation();
}

async function useEditor() {
    let { message } = await inquirer.prompt([
        {
            type: 'editor',
            name: 'message',
            message: 'Write a message:',
            waitUserInput: false,
        },
    ]);
    message = message.trim();
    if (!message) {
        return conversation();
    }
    console.log(message);
    return onMessage(message);
}

async function resumeConversation() {
    ({ conversationId, parentMessageId } = (await chatGptClient.conversationsCache.get('lastConversation')) || {});
    if (conversationId) {
        logSuccess(`Resumed conversation ${conversationId}.`);
    } else {
        logWarning('No conversation to resume.');
    }
    return conversation();
}

async function newConversation() {
    conversationId = null;
    parentMessageId = null;
    logSuccess('Started new conversation.');
    return conversation();
}

async function deleteAllConversations() {
    await chatGptClient.conversationsCache.clear();
    logSuccess('Deleted all conversations.');
    return conversation();
}

async function copyConversation() {
    if (!conversationId) {
        logWarning('No conversation to copy.');
        return conversation();
    }
    const { messages } = await chatGptClient.conversationsCache.get(conversationId);
    // get the last message ID
    const lastMessageId = messages[messages.length - 1].id;
    const orderedMessages = ChatGPTClient.getMessagesForConversation(messages, lastMessageId);
    const conversationString = orderedMessages.map((message) => `#### ${message.role}:\n${message.message}`).join('\n\n');
    try {
        await clipboard.write(`${conversationString}\n\n----\nMade with ChatGPT CLI: <https://github.com/waylaidwanderer/node-chatgpt-api>`);
        logSuccess('Copied conversation to clipboard.');
    } catch (error) {
        logError(error?.message || error);
    }
    return conversation();
}

function logError(message) {
    console.log(tryBoxen(message, { title: 'Error', padding: 0.7, margin: 1, borderColor: 'red' }));
}

function logSuccess(message) {
    console.log(tryBoxen(message, { title: 'Success', padding: 0.7, margin: 1, borderColor: 'green' }));
}

function logWarning(message) {
    console.log(tryBoxen(message, { title: 'Warning', padding: 0.7, margin: 1, borderColor: 'yellow' }));
}

/**
 * Boxen can throw an error if the input is malformed, so this function wraps it in a try/catch.
 * @param {string} input
 * @param {*} options
 */
function tryBoxen(input, options) {
    try {
        return boxen(input, options);
    } catch {
        return input;
    }
}
