const Player = require("./Player");
const AdminPlayer = require("./AdminPlayers");

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.playerToRoom = new Map();
        this.io = null;
        this.logger = null;
        this.activeRoomsGauge = null;
    }

    setIO(io) {
        try {
            this.io = io;
        } catch (error) {
            console.error(`Error setting IO: ${error.message}`);
        }
    }

    setLogger(logger) {
        try {
            this.logger = logger;
        } catch (error) {
            console.error(`Error setting logger: ${error.message}`);
        }
    }

    setActiveRoomsGauge(activeRoomsGauge) {
        try {
            this.activeRoomsGauge = activeRoomsGauge;
        } catch (error) {
            console.error(`Error setting activeRoomsGauge: ${error.message}`);
        }
    }

    showRooms() {
        try {
            let allRooms = [];
            for (let [room, roomData] of this.rooms.entries()) {
                allRooms.push(room);
            }
            return allRooms;
        } catch (error) {
            console.error(`Error in showRooms: ${error.message}`);
            return [];
        }
    }

    joinRoom(socket, { room, name, role, ready }) {
        console.log("in join room :: ", role, ready);
        try {
            this.playerToRoom.set(socket.id, room);
            if (!this.rooms.has(room)) {
                this.rooms.set(room, new Set());
                this.activeRoomsGauge?.inc();
            }

            const PlayerClass = role === "admin" ? AdminPlayer : Player;
            const newPlayer = new PlayerClass(socket, this.io, socket.id, name, room, role, ready);
            this.rooms.get(room).add(newPlayer);
            newPlayer.newPlayerJoin(this.rooms);
        } catch (error) {
            console.error(`Error in joinRoom for ${socket?.id}: ${error.message}`);
        }
    }

    updatePlayerPoints({ playerID, name, drawTime, room, isReady }) {
        try {
            if (!playerID || !room || drawTime == null) throw new Error("Missing required parameters");
            const players = this.rooms.get(room);
            if (!players) throw new Error(`Room ${room} not found`);

            for (let player of players) {
                if (player.socketID === playerID) {
                    player.updatePoints(drawTime);
                    break;
                }
            }

            this.io.to(room).emit("updatePlayerList", Array.from(players).map(p => p.toJSON()));
        } catch (error) {
            console.error(`Error in updatePlayerPoints for ${playerID}: ${error.message}`);
        }
    }

    updatePlayerReadyState({ playerID, isReady, room, name }) {
        try {

            const players = this.rooms.get(room);

            if (!players || !playerID) {
                throw new Error(`Invalid room or player ID: room=${room}, playerID=${playerID}`);
            }

            let found = false;

            for (let player of players) {
                if (player.socketID === playerID) {
                    player.updateReadyState(players, isReady);
                    found = true;
                    break;
                }
            }

            if (!found) {
                throw new Error(`Player with socketID ${playerID} not found in room ${room}`);
            }
        }
        catch (error) {
            console.error("Error in updatePlayerReadyState:", error.message);
        }
    }


    removePlayer(clientId) {
        try {
            if (!clientId) throw new Error("Invalid clientId");
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
        } catch (error) {
            console.error(`Error in removePlayer for ${clientId}: ${error.message}`);
        }
    }
}

module.exports = RoomManager;