import {server} from '../bin/server.js'

export default async (req, res) => {
    await server.ready();
    server.server.emit('request', req, res);
};