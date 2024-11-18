const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8000});
const clients = [];
wss.on('connection', (ws) => {
    console.log("A clint connected!");
    clients.push(ws);

    ws.on('close', () => {
        const index = clients.indexOf(ws);
        if (index > -1) {
            clients.splice(index, 1);
        }
    });
});

const broadcast = (data) => {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

module.exports = { broadcast };