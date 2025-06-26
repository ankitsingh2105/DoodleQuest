const Player = require("./Player");

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.playerToRoom = new Map();
        this.io = null;
        this.logger = null;
        this.activeRoomsGauge = null;
    }

    setIO(io) {
        this.io = io;
    }

    setLogger(logger) {
        this.logger = logger;
    }

    setActiveRoomsGauge(activeRoomsGauge) {
        this.activeRoomsGauge = activeRoomsGauge;
    }

    joinRoom(client, { room, name }) {
        this.logger.info(`User ${client.id} joined room: ${room}`);
        this.playerToRoom.set(client.id, room);

        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
            this.activeRoomsGauge.inc();
        }

        const newPlayer = new Player(client.id, name);
        this.rooms.get(room).add(newPlayer);

        client.join(room);
        this.io.to(room).emit("updatePlayerList", Array.from(this.rooms.get(room)).map(p => p.toJSON()));
        this.io.to(room).emit("newPlayer", { room, name, playerSocketID: client.id });
    }

    updatePlayerPoints({ playerID, name, drawTime, room }) {
        this.logger.info("Updating player points");
        const players = this.rooms.get(room);
        if (!players) return;

        for (let player of players) {
            if (player.socketID === playerID) {
                player.updatePoints(drawTime);
                break;
            }
        }

        this.io.to(room).emit("updatePlayerList", Array.from(players).map(p => p.toJSON()));
    }

    removePlayer(clientId) {
        const room = this.playerToRoom.get(clientId);
        if (!room) return;

        const playersInRoom = this.rooms.get(room);
        if (!playersInRoom) return;

        for (let player of playersInRoom) {
            if (player.socketID === clientId) {
                playersInRoom.delete(player);
                break;
            }
        }

        if (playersInRoom.size === 0) {
            this.rooms.delete(room);
            this.activeRoomsGauge.dec();
        } else {
            this.io.to(room).emit("updatePlayerList", Array.from(playersInRoom).map(p => p.toJSON()));
        }

        this.playerToRoom.delete(clientId);
    }
}

module.exports = RoomManager;