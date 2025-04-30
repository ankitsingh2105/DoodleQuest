const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { User } = require("./database/schema");

const { Server } = require("socket.io");

const server = http.createServer(app);

// origin: "https://doodlequest.vercel.app",
const corsOptions = {
    origin: ["http://localhost:5173", "https://doodlequest.vercel.app", "https://doodlequest.games"],
    credentials: true,
};

app.use(cors(corsOptions));

// origin: "http://localhost:5173",
const io = new Server(server, {
    cors: {
        origin: ["https://doodlequest.vercel.app", "http://localhost:5173", "https://doodlequest.games"],
        credentials: true,
    }
});


// Store room data in a Map
const rooms = new Map();

io.on("connection", (client) => {
    console.log(`New user ::${client.id}`);

    client.on("disconnect", async () => {
        console.log("user disconnected ::", client.id);
    });

    client.on("join-room", async (info) => {
        const { room, name } = info;
        console.log(`User ${client.id} joined room: ${room}`);

        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }
        const newPlayer = { name, socketID: client.id, points: 0 };

        rooms.get(room).add(newPlayer);

        console.log("map is :: ", rooms);

        client.join(room);

        // Emit updated player list to all clients in the room
        io.to(room).emit("updatePlayerList", Array.from(rooms.get(room)));

        console.log("client id for newplayer event :: ", client.id);

        io.to(room).emit("newPlayer", { room, name, playerSocketID: client.id });
    });

    client.on("draw", ({ room, offsetX, offsetY, color }) => {
        io.to(room).emit("draw", { offsetX, offsetY, color, playerID: client.id });
    });

    client.on("stopDrawing", (room) => {
        io.to(room).emit("stopDrawing", { room, playerID: client.id });
    });

    client.on("clear", ({ room, width, height }) => {
        io.to(room).emit("clear", { width, height });
    });


    // todo :: chatting 
    client.on("sendMessage", (info) => {
        const room = info.room;
        io.to(room).emit("receiveMessage", info);
    })

    // todo :: choosing the players
    client.on('myEvent', ({ currentIteration, room }) => {
        console.log(`Received from ${client.id}:`, currentIteration);
        io.to(room).emit('acknowledgement', currentIteration);
    });

    client.on("beginPath", ({ room, offsetX, offsetY }) => {
        console.log("beginnin the fucking path")
        client.to(room).emit("beginPath", { offsetX, offsetY, playerID: client.id });
    });


    // todo :: word to find
    client.on("wordToGuess", ({ word, room }) => {
        console.log("word is :: ", word)
        io.to(room).emit("wordToGuess", word);
    })

    // todo :: updating points
    client.on("updatePlayerPoints", async ({ playerID, name, drawTime, room }) => {
        console.log("in the server side for updating with :: ", name, drawTime, playerID);
        const players = rooms.get(room);

        // todo :: set doesn't detect changes to object properties, so we delete and re-add to reflect updates.
        // todo :: this ensures proper reactivity and accurate broadcasting (like in leaderboards).
        // ! this re rendering thing is mainly for react but still i used

        const playersSet = rooms.get(room);

        if (!playersSet) return;

        for (let player of playersSet) {
            if (player.socketID === playerID) {
                player.points = 10 * drawTime;  // todo :: i can mutate directly here
                break;
            }
        }


        io.to(room).emit("updatePlayerList", Array.from(players));
    })
    // todo :: game over result declare
    client.on("gameOver", ({room})=>{
        console.log("game over");
        io.to(room).emit("gameOver");
    })

    // todo : hide scoreCard
    client.on("hideScoreCard", ({room})=>{
        console.log("hiding the scorecard")
        io.to(room).emit("hideScoreCard");
    })


    // todo :: client reloaded, moved back, closed the page
    client.on("userDisconnected", ({ room, playerID }) => {
        const players = rooms.get(room);
    
        if (!players) return;
    
        // Remove the player from the Set in the room
        let playerFound = false;
        for (const player of players) {
            if (player.socketID === playerID) {
                players.delete(player); 
                console.log("player found and removed");
                playerFound = true;
                break;
            }
        }
    
        if (playerFound) {
            if (players.size === 0) {
                rooms.delete(room);
                console.log(`Room ${room} has no players left. Room removed from Map.`);
            } else {
                io.to(room).emit("updatePlayerList", Array.from(players));
            }
        }
    });
    

});


app.get("/", (req, response) => {
    response.send("Live Now")
})
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log("Server Running on port 8000");
});
