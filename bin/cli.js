#!/usr/bin/env node
import fs from 'fs';
import { pathToFileURL } from 'url'
import ChatGPTClient from '../src/ChatGPTClient.js';
import boxen from 'boxen';
import ora from 'ora';
import clipboard from 'clipboardy';
import inquirer from 'inquirer';
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
    // TODO: actually do something with this
}

let conversationId = null;
let parentMessageId = null;

const availableCommands = [
    {
        name: 'Exit',
        value: 'exit',
    },
    {
        name: 'View chat commands',
        value: 'commands',
    },
    {
        name: 'Delete conversation',
        value: 'delete',
    },
    {
        name: 'List conversations',
        value: 'list',
    },
    {
        name: 'Resume conversation',
        value: 'resume',
    },
    {
        name: 'Copy conversation to clipboard',
        value: 'copy',
    },
];

let conversationId = null;
let parentMessageId = null;

const availableCommands = [
    {
        name: 'Exit',
        value: 'exit',
    },
    {
        name: 'View chat commands',
        value: 'commands',
    },
    {
        name: 'Delete conversation',
        value: 'delete',
    },
    {
        name: 'List conversations',
        value: 'list',
    },
    {
        name: 'Resume conversation',
        value: 'resume',
    },
    {
        name: 'Copy conversation to clipboard',
        value: 'copy',
    },
];

const chatGptClient = new ChatGPTClient(settings.openaiApiKey, settings.chatGptClient, settings.cacheOptions);

console.log(boxen('ChatGPT CLI', { padding: 0.7, margin: 1, borderStyle: 'double', dimBorder: true }));
console.log('Type "!" to access the command menu.');

await conversation();

async function conversation() {
    let { message } = await inquirer.prompt([
        {
            type: 'input',
            name: 'message',
            message: 'Write a message:',
        },
    ]);
    message = message.trim();
    if (!message) {
        return conversation();
    }
    if (message === '!exit') {
        return true;
    }
    if (message === '!') {
        return commandMenu();
    }
    const chatGptLabel = settings.chatGptClient?.chatGptLabel || 'ChatGPT';
    const spinner = ora(`${chatGptLabel} is typing...`);
    spinner.prefixText = '\n';
    spinner.start();
    try {
        const response = await chatGptClient.sendMessage(message, { conversationId, parentMessageId });
        clipboard.write(response.response).then(() => {}).catch(() => {});
        spinner.stop();
        conversationId = response.conversationId;
        parentMessageId = response.messageId;
        console.log(boxen(response.response, { title: chatGptLabel, padding: 0.7, margin: 1, dimBorder: true }));
    } catch (error) {
        spinner.stop();
        displayError(error?.json?.error?.message || error.body);
    }
    return conversation();
}

async function commandMenu() {
    const { command } = await inquirer.prompt([
        {
            type: 'list',
            name: 'command',
            message: 'Select an option:',
            choices: availableCommands,
        },
    ]);
    switch (command) {
        case 'exit':
            return true;
        default:
            displayError('Not implemented yet.');
            return conversation();
    }
}

function displayError(message) {
    console.log(boxen(message, { title: 'Error', padding: 0.7, margin: 1, borderColor: 'red' }));
}
