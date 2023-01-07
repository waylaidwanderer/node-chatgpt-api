import fastify from 'fastify';
import { ChatGPTAPIBrowser } from 'chatgpt';
import settings from './settings.js';

const accounts = [];

for (let i = 0; i < settings.accounts.length; i++) {
    const account = settings.accounts[i];
    const api = new ChatGPTAPIBrowser({
        email: account.email,
        password: account.password,
        nopechaKey: settings.nopechaKey,
    });

    api.initSession().then(() => {
        console.log(`Session initialized for account ${i}.`);
    });

    accounts.push(api);
}

let currentAccountIndex = 0;

const server = fastify();

server.post('/conversation', async (request, reply) => {
    currentAccountIndex = (currentAccountIndex + 1) % accounts.length;

    let result;
    let error;
    try {
        result = await accounts[currentAccountIndex].sendMessage(request.body.message);
    } catch (e) {
        error = e;
    }

    if (result !== undefined) {
        reply.send(result);
    } else {
        console.error(error);
        reply.code(500).send({ error: 'There was an error communicating with ChatGPT.' });
    }
});

server.listen({ port: settings.port || 3000 }, (error) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }
});
