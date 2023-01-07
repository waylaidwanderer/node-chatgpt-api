import * as dotenv from 'dotenv';
import fastify from 'fastify';
import { ChatGPTAPIBrowser } from 'chatgpt';

dotenv.config();

const api = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD,
});

let initSessionComplete = false;

api.initSession().then(() => {
    initSessionComplete = true;
    console.log('Session initialized.');
});

const server = fastify();

server.post('/conversation', async (request, reply) => {
    if (!initSessionComplete) {
        reply.code(503).send({ error: 'Session not initialized.' });
        return;
    }

    try {
        const result = await api.sendMessage(request.body.message);
        reply.send(result);
    } catch (error) {
        console.error(error);
        reply.code(500).send({ error: 'There was an error communicating with ChatGPT.' });
    }
});

server.listen({ port: process.env.PORT || 3000 }, (error) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }
});
