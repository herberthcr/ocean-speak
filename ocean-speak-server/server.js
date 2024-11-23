
// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
//const io = require('socket.io')(server);
const io = require("socket.io")(server, {
    cors: {
        origin: '*',
      }
  });

const port = process.env.PORT || 3001;

server.listen(port, () => {
    console.log('Server listening at port %d', port);
  });
  

let players = [];
let currentTurn = 'Teacher';
let gameState = '0';

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // Add player if there's room
    if (players.length < 2) {
        players.push(socket.id);
        console.log('Assigned:', socket.id);

        // Assign player X or O
        const assignedPlayer = players.length === 1 ? 'Teacher' : 'Student';
        socket.emit('player-assign', assignedPlayer);

        // Send the current game state to the newly connected player
        socket.emit('initialize', { gameState, currentTurn, assignedPlayer });
        io.emit('player-update', players.length);

        // Start game if two players are connected
        if (players.length === 2) {
            io.emit('game-start');
        }
    } else {
        socket.emit('game-full');
        socket.disconnect();
    }
})

