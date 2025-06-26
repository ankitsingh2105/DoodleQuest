const express = require("express");
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

const roomManager = new RoomManager();
const chatManager = new ChatManager(io, logger);
roomManager.setIO(io);
roomManager.setLogger(logger);
roomManager.setActiveRoomsGauge(activeRooms);

io.on("connection", (client) => {
    logger.info(`New user connected: ${client.id}`);
    activeUsersGauge.inc();

    client.on("join-room", (info) => {
        roomManager.joinRoom(client, info);
    });

    client.on("draw", ({ room, offsetX, offsetY, color, strokeSize }) => {
        logger.info("Draw event: Drawing");
        io.to(room).emit("draw", { offsetX, offsetY, color, socketID: client.id, strokeSize });
    });

    client.on("stopDrawing", (room) => {
        logger.info("Draw event: Stop drawing");
        io.to(room).emit("stopDrawing", { room, playerID: client.id });
    });

    client.on("clear", ({ room, width, height }) => {
        logger.info("Draw event: Clear canvas");
        io.to(room).emit("clear", { width, height });
    });

    client.on("beginPath", ({ room, offsetX, offsetY, strokeSize }) => {
        logger.info("Draw event: Begin path");
        client.to(room).emit("beginPath", { offsetX, offsetY, socketID: client.id, strokeSize });
    });

    client.on("sendMessage", (info) => {
        chatManager.sendMessage(info);
    });

    client.on("myEvent", ({ currentIteration, room, loopCount }) => {
        logger.info(`Received myEvent from ${client.id}: ${currentIteration}`);
        io.to(room).emit("acknowledgement", { currentIteration, loopCount });
    });

    client.on("wordToGuess", ({ word, room }) => {
        logger.info("Guess the word event");
        io.to(room).emit("wordToGuess", word);
    });

    client.on("updatePlayerPoints", (info) => {
        roomManager.updatePlayerPoints(info);
    });

    client.on("gameOver", ({ room }) => {
        logger.info("Game over event");
        io.to(room).emit("gameOver");
    });

    client.on("hideScoreCard", ({ room }) => {
        logger.info("Hide scorecard event");
        io.to(room).emit("hideScoreCard");
    });

    client.on("disconnect", () => {
        logger.info(`User disconnected: ${client.id}`);
        activeUsersGauge.dec();
        roomManager.removePlayer(client.id);
    });
});

app.get("/", (req, response) => {
    response.send("Live Now");
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});