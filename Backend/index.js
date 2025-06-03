const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");

// for observability
const responseTime = require("response-time");
const client = require("prom-client");

const { Server } = require("socket.io");

const server = http.createServer(app);

const corsOptions = {
    origin: ["http://localhost:5173", "https://doodlequest.vercel.app", "https://doodlequest.games"],
    credentials: true,
};

app.use(cors(corsOptions));

const io = new Server(server, {
    cors: {
        origin: ["https://doodlequest.vercel.app", "http://localhost:5173", "https://doodlequest.games"],
        credentials: true,
    }
});


const { createLogger, format } = require("winston");
const LokiTransport = require("winston-loki");

const logger = createLogger({
  format: format.json(),
  transports: [
    new LokiTransport({
      host: "http://127.0.0.1:3100",
      labels: { job: "express-app" },
      json: true,
      format: format.json(),
      handleExceptions: true,
      replaceTimestamp: true,
    }),
  ],
});

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const activeUsersGauge = new client.Gauge({
  name: "active_users_total",
  help: "Total number of active socket connections",
});

const activeRooms = new client.Gauge({
  name: "active_rooms_total",
  help: "Total number of active rooms",
});
register.registerMetric(activeUsersGauge);


const requestCounter = new client.Counter({
  name: "custom_total_request_counter",
  help: "Total request count",
  labelNames: ["method", "route"],
});

register.registerMetric(activeUsersGauge);

register.registerMetric(activeRooms);

register.registerMetric(requestCounter);

app.use(
  responseTime((req, res, time) => {
    if (req.url === "/metrics") return;

    const route = req.route?.path || req.path;
    requestCounter.labels(req.method, route).inc();

    if (monitoredRoutes.includes(route)) {
      logger.info(`Request to ${route}`, {
        method: req.method,
        status: res.statusCode,
        duration: time.toFixed(2),
      });
    }
  })
);

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
});


// Store room data in a Map
const rooms = new Map();

io.on("connection", (client) => {
    console.log(`New user ::${client.id}`);
    activeUsersGauge.inc();
    client.on("disconnect", async () => {
        console.log("user disconnected ::", client.id);
        activeUsersGauge.dec();
        
    });
    
    client.on("join-room", async (info) => {
        const { room, name } = info;
        console.log(`User ${client.id} joined room: ${room}`);
        
        if (!rooms.has(room)) {
            rooms.set(room, new Set());
            activeRooms.inc();
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

    client.on("draw", ({ room, offsetX, offsetY, color, strokeSize }) => {
        logger.info("Draw event 1");
        console.log("size sss :: " , strokeSize)
        io.to(room).emit("draw", { offsetX, offsetY, color, socketID: client.id, strokeSize });
    });
    
    client.on("stopDrawing", (room) => {
        logger.info("Draw event 2");
        io.to(room).emit("stopDrawing", { room, playerID: client.id });
    });
    
    client.on("clear", ({ room, width, height }) => {
        logger.info("Draw event 3");
        io.to(room).emit("clear", { width, height });
    });
    
    
    client.on("beginPath", ({ room, offsetX, offsetY }) => {
        logger.info("Draw event 4");
        console.log("beginnin the fucking path")
        client.to(room).emit("beginPath", { offsetX, offsetY, socketID: client.id });
    });


    // todo :: chatting 
    client.on("sendMessage", (info) => {
        logger.info("Chat event 1");
        const room = info.room;
        io.to(room).emit("receiveMessage", info);
    })

    // todo :: choosing the players
    client.on('myEvent', ({ currentIteration, room, loopCount }) => {
        console.log(`Received from ${client.id}:`, currentIteration);
        io.to(room).emit('acknowledgement', {currentIteration, loopCount});
    });
    
    
    
    // todo :: word to find
    client.on("wordToGuess", ({ word, room }) => {
        logger.info("Guess the word");
        console.log("word is :: ", word)
        io.to(room).emit("wordToGuess", word);
    })
    
    // todo :: updating points
    client.on("updatePlayerPoints", async ({ playerID, name, drawTime, room }) => {
        logger.info("Updating the points");
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
