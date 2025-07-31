const express = require("express");
const dotenv = require('dotenv');
const app = express();
const http = require("http");
const cors = require("cors");
const responseTime = require("response-time");
const client = require("prom-client");
const { Server } = require("socket.io");
const { createLogger, format } = require("winston");
const LokiTransport = require("winston-loki");
const RoomManager = require("./Components/RoomManger");
const ChatManager = require("./Components/ChatManager");

dotenv.config();
const server = http.createServer(app);

const corsOptions = {
  origin: [
    "http://localhost:5173",

    "https://doodlequest.vercel.app",
    "https://www.doodlequest.vercel.app",

    "https://doodlequest.games",
    "https://www.doodlequest.games"
  ],
  credentials: true,
};


app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://doodlequest.vercel.app",
      "https://www.doodlequest.vercel.app",
      "https://doodlequest.games",
      "https://www.doodlequest.games"
    ],
    credentials: true,
  },
});


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

const requestCounter = new client.Counter({
    name: "custom_total_request_counter",
    help: "Total request count",
    labelNames: ["method", "route"],
});

register.registerMetric(activeUsersGauge);
register.registerMetric(activeRooms);
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

app.get("/metrics", async (req, res) => {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
});

process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("🔥 Unhandled Rejection at:", promise, "reason:", reason);
});

const roomManager = new RoomManager();
const chatManager = new ChatManager(io, logger);

app.get("/allRooms", (req, response) => {
    console.log(roomManager.showRooms());
    return response.json({ allRooms: roomManager.showRooms() });
});

roomManager.setIO(io);
roomManager.setLogger(logger);
roomManager.setActiveRoomsGauge(activeRooms);

io.on("connection", (socket) => {
    logger.info(`New user connected: ${socket.id}`);
    activeUsersGauge.inc();

    socket.on("join-room", (info) => {
        try {
            console.log("new user ::", info);
            roomManager.joinRoom(socket, info);
        } catch (error) {
            logger.error(`Error in join-room event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to join room" });
        }
    });

    socket.on("draw", ({ room, offsetX, offsetY, color, strokeSize }) => {
        try {
            logger.info("Draw event: Drawing");
            io.to(room).emit("draw", { offsetX, offsetY, color, socketID: socket.id, strokeSize });
        } catch (error) {
            logger.error(`Error in draw event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to process draw event" });
        }
    });

    socket.on("stopDrawing", (room) => {
        try {
            logger.info("Draw event: Stop drawing");
            io.to(room).emit("stopDrawing", { room, playerID: socket.id });
        } catch (error) {
            logger.error(`Error in stopDrawing event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to process stop drawing event" });
        }
    });

    socket.on("clear", ({ room, width, height }) => {
        try {
            logger.info("Draw event: Clear canvas");
            io.to(room).emit("clear", { width, height });
        } catch (error) {
            logger.error(`Error in clear event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to process clear canvas event" });
        }
    });

    socket.on("beginPath", ({ room, offsetX, offsetY, strokeSize }) => {
        try {
            logger.info("Draw event: Begin path");
            socket.to(room).emit("beginPath", { offsetX, offsetY, socketID: socket.id, strokeSize });
        } catch (error) {
            logger.error(`Error in beginPath event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to process begin path event" });
        }
    });

    socket.on("sendMessage", (info) => {
        try {
            chatManager.sendMessage(info);
        } catch (error) {
            logger.error(`Error in sendMessage event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    socket.on("startGame", ({ currentIteration, room, loopCount, customDrawTime, difficulty }) => {
        try {
            logger.info(`Received startGame from ${socket.id}: ${currentIteration}`);
            const players = roomManager.rooms.get(room);
            if (!players) {
                throw new Error("Room not found");
            }

            const admin = [...players].find(p => p.socketID === socket.id && p.role === "admin");
            if (admin && typeof admin.startGame === "function") {
                admin.startGame(currentIteration, room, loopCount, customDrawTime, difficulty);
            } else {
                throw new Error("Not authorized or startGame function not found");
            }
        } catch (error) {
            logger.error(`Error in startGame event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to start game" });
        }
    });

    socket.on("kickUser", ({ room, socketID: targetSocketID }) => {
        try {
            const players = roomManager.rooms.get(room);
            if (!players) {
                throw new Error("Room not found");
            }

            const admin = [...players].find(p => p.socketID === socket.id && p.role === "admin");
            if (admin && typeof admin.kickUser === "function") {
                admin.kickUser(targetSocketID, roomManager.rooms, room);
            } else {
                throw new Error("Not authorized or kickUser function not found");
            }
        } catch (error) {
            logger.error(`Error in kickUser event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to kick user" });
        }
    });

    socket.on("wordToGuess", ({ word, room }) => {
        try {
            logger.info("Guess the word event");
            io.to(room).emit("wordToGuess", word);
        } catch (error) {
            logger.error(`Error in wordToGuess event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to process word to guess" });
        }
    });

    socket.on("updatePlayerPoints", (info) => {
        try {
            const { name, drawTime, room, playerID, isReady } = info;
            roomManager.updatePlayerPoints(info);
            io.to(room).emit("playerGotRightAnswer", { name, playerWithCorrectAnswer: playerID, drawTime });
        } catch (error) {
            logger.error(`Error in updatePlayerPoints event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to update player points" });
        }
    });

    socket.on("gameOver", ({ room }) => {
        try {
            logger.info("Game over event");
            io.to(room).emit("gameOver");
        } catch (error) {
            logger.error(`Error in gameOver event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to process game over event" });
        }
    });

    socket.on("hideScoreCard", ({ room }) => {
        try {
            logger.info("Hide scorecard event");
            io.to(room).emit("hideScoreCard");
        } catch (error) {
            logger.error(`Error in hideScoreCard event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to hide scorecard" });
        }
    });

    socket.on("playerReady", ({ playerID, isReady, room, name }) => {
        try {
            roomManager.updatePlayerReadyState({ playerID, isReady, room, name });
        } catch (error) {
            logger.error(`Error in playerReady event: ${error.message}`, { stack: error.stack });
            socket.emit("error", { message: "Failed to update player ready state" });
        }
    });

    socket.on("disconnect", () => {
        try {
            logger.info(`User disconnected: ${socket.id}`);
            activeUsersGauge.dec();
            roomManager.removePlayer(socket.id);
        } catch (error) {
            logger.error(`Error in disconnect event: ${error.message}`, { stack: error.stack });
        }
    });
});

app.get("/", (req, response) => {
    response.send("DoodleQuest is now live ⚡⚡");
}); 

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});