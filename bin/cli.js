#!/usr/bin/env node
import fs from 'fs';
import { pathToFileURL } from 'url'
import ChatGPTClient from '../src/ChatGPTClient.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import boxen from 'boxen';
import ora from 'ora';
import terminalKit from 'terminal-kit';
import clipboard from 'clipboardy';

const { terminal } = terminalKit;

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

const chatGptClient = new ChatGPTClient(settings.openaiApiKey, settings.chatGptClient, settings.cacheOptions);

console.log(boxen('ChatGPT CLI', { padding: 0.7, margin: 1, borderStyle: 'double', dimBorder: true }));

await conversation();

async function conversation(conversationId = null, parentMessageId = null) {
    terminal.bold.blue('Write a message:\n');
    const rl = readline.createInterface({ input, output });
    const message = (await rl.question('')).trim();
    rl.close();
    if (message === '!exit') {
        return true;
    }
    const spinner = ora('ChatGPT is typing...');
    spinner.prefixText = '\n';
    spinner.start();
    const response = await chatGptClient.sendMessage(message, { conversationId, parentMessageId });
    spinner.stop();
    conversationId = response.conversationId;
    parentMessageId = response.messageId;
    console.log(boxen(response.response, { title: 'ChatGPT', padding: 0.7, margin: 1, dimBorder: true }));
    await clipboard.write(response.response);
    return conversation(conversationId, parentMessageId);
}
