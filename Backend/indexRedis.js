const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");

const Redis = require("ioredis");
const redis = new Redis();

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
register.registerMetric(activeRooms);

const requestCounter = new client.Counter({
    name: "custom_total_request_counter",
    help: "Total request count",
    labelNames: ["method", "route"],
});
register.registerMetric(requestCounter);

const monitoredRoutes = ["/", "/metrics"];

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

// redis.flushall(); 

app.get("/metrics", async (req, res) => {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
}); 

const {
    addPlayerToRoom,
    getPlayersInRoom,
    removePlayerFromRoom,
    clearRoomIfEmpty
} = require("./redisHelpers");

const playerToRoom = new Map();


io.on("connection", (client) => {
    console.log(`New user ::${client.id}`);
    activeUsersGauge.inc();

    client.on("join-room", async (info) => {
        try {
            const { room, name } = info;
            const player = { name, socketID: client.id, points: 0 };

            playerToRoom.set(client.id, room);
            const key = `group:${room}`;
            const roomExists = await redis.exists(key);
            if (!roomExists) activeRooms.inc();

            await addPlayerToRoom(room, player, activeRooms);
            const players = await getPlayersInRoom(room);
            client.join(room);

            io.to(room).emit("updatePlayerList", players);
            io.to(room).emit("newPlayer", { room, name, playerSocketID: client.id });
        } catch (err) {
            console.error("❌ Error in join-room:", err);
        }
    });

    client.on("draw", (data) => {
        try {
            logger.info("Draw event 1");
            const { room, offsetX, offsetY, color, strokeSize } = data;
            io.to(room).emit("draw", { offsetX, offsetY, color, socketID: client.id, strokeSize });
        } catch (err) {
            console.error("❌ Error in draw:", err);
        }
    });

    client.on("stopDrawing", (room) => {
        try {
            logger.info("Draw event 2");
            io.to(room).emit("stopDrawing", { room, playerID: client.id });
        } catch (err) {
            console.error("❌ Error in stopDrawing:", err);
        }
    });

    client.on("clear", ({ room, width, height }) => {
        try {
            logger.info("Draw event 3");
            io.to(room).emit("clear", { width, height });
        } catch (err) {
            console.error("❌ Error in clear:", err);
        }
    });

    client.on("beginPath", ({ room, offsetX, offsetY, strokeSize }) => {
        try {
            logger.info("Draw event 4");
            client.to(room).emit("beginPath", { offsetX, offsetY, socketID: client.id, strokeSize });
        } catch (err) {
            console.error("❌ Error in beginPath:", err);
        }
    });

    client.on("sendMessage", (info) => {
        try {
            logger.info("Chat event 1");
            const room = info.room;
            io.to(room).emit("receiveMessage", info);
        } catch (err) {
            console.error("❌ Error in sendMessage:", err);
        }
    });

    client.on("myEvent", ({ currentIteration, room, loopCount }) => {
        try {
            io.to(room).emit("acknowledgement", { currentIteration, loopCount });
        } catch (err) {
            console.error("❌ Error in myEvent:", err);
        }
    });

    client.on("wordToGuess", ({ word, room }) => {
        try {
            io.to(room).emit("wordToGuess", word);
        } catch (err) {
            console.error("❌ Error in wordToGuess:", err);
        }
    });

    client.on("updatePlayerPoints", async ({ playerID, name, drawTime, room }) => {
        try {
            const players = await getPlayersInRoom(room);
            for (let player of players) {
                if (player.socketID === playerID) {
                    player.points = 10 * drawTime;
                    await addPlayerToRoom(room, player, activeRooms);
                    break;
                }
            }
            const updatedPlayers = await getPlayersInRoom(room);
            io.to(room).emit("updatePlayerList", updatedPlayers);
        } catch (err) {
            console.error("❌ Error in updatePlayerPoints:", err);
        }
    });

    client.on("gameOver", ({ room }) => {
        try {
            io.to(room).emit("gameOver");
        } catch (err) {
            console.error("❌ Error in gameOver:", err);
        }
    });

    client.on("hideScoreCard", ({ room }) => {
        try {
            io.to(room).emit("hideScoreCard");
        } catch (err) {
            console.error("❌ Error in hideScoreCard:", err);
        }
    });

    client.on("disconnect", async () => {
        try {
            console.log("user disconnected ::", client.id);
            activeUsersGauge.dec();

            const room = playerToRoom.get(client.id);
            if (!room) return;

            await removePlayerFromRoom(room, client.id);
            await clearRoomIfEmpty(room, activeRooms);

            const players = await getPlayersInRoom(room);
            io.to(room).emit("updatePlayerList", players);

            playerToRoom.delete(client.id);
        } catch (err) {
            console.error("❌ Error in disconnect:", err);
        }
    });
});

app.get("/", (req, res) => {
    res.send("Live Now");
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log("✅ Server Running on port", PORT);
});

