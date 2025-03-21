const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let document = "";
const names = ["Alice", "Bob", "Charlie", "Daisy", "Eve", "Frank"];
function getRandomName() {
    return names[Math.floor(Math.random() * names.length)];
}

wss.on('connection', (ws) => {
    console.log('New client connected.');
    const userId = uuidv4();
    const userName = getRandomName();

    ws.userId = userId;
    ws.userName = userName;

    ws.send(JSON.stringify({ type: 'init', data: document }));
    ws.send(JSON.stringify({ type: 'userId', userId }));

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            console.log("Received message:", parsedMessage);

            if (parsedMessage.type === 'update') {
                document = parsedMessage.data;

                // broadcast the update to all connected clients
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'update', data: document }));
                    }
                });
            }
            if (parsedMessage.type === 'cursor') {
                
                // broadcast the update to all connected clients
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'cursor',
                            cursor: parsedMessage.cursor,
                            userId: parsedMessage.userId,
                            name: ws.userName,
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}.`);
});
