class Player {
    constructor(socket, io, socketID, name, room, role, ready) {
        this.socket = socket;
        this.io = io;
        this.socketID = socketID;
        this.name = name;
        this.room = room;
        this.points = 0;
        this.role = role;
        this.ready = ready;
    }

    newPlayerJoin(allRooms) {
        try {
            // Validate that the room exists in allRooms
            if (!allRooms || !allRooms.get(this.room)) throw new Error("Invalid room or rooms data");
            
            // Initialize array to store players in the room
            let allPlayersInRoom = [];
            
            // Add this player's socket to the room
            this.socket.join(this.room);
            
            // Iterate through all players in the room and extract relevant data
            for (let player of allRooms.get(this.room)) {
                const { socketID, name, room, points, role, ready } = player;
                allPlayersInRoom.push({ socketID, name, room, points, role, ready });
            }
            
            // Emit updated player list to all players in the room
            this.emitUpdate(allPlayersInRoom);
            
            // Notify other players that a new player has joined
            this.io.to(this.room).emit("newPlayer", { room: this.room, name: this.name, playerSocketID: this.socketID, role: this.role });
        }
        catch (error) {
            console.error(`Error in newPlayerJoin for ${this.socketID}: ${error.message}`);
        }
    }

    emitUpdate(players) {
        try {
            if (!players || !Array.isArray(players)) throw new Error("Invalid players data");
            this.io.to(this.room).emit("updatePlayerList", players);
        }
        catch (error) {
            console.error(`Error in emitUpdate for ${this.socketID}: ${error.message}`);
        }
    }

    updatePoints(drawTime) {
        try {
            if (drawTime == null || typeof drawTime !== "number") throw new Error("Invalid drawTime");
            this.points = this.points + 10 * drawTime;
        }
        catch (error) {
            console.error(`Error in updatePoints for ${this.socketID}: ${error.message}`);
        }
    }

    updateReadyState(players) {
        try {
            let allPlayersInRoom = [];

            if (!players) {
                throw new Error(`No players found in room: ${this.room}`);
            }
            this.ready = !this.ready;
            for (let player of players) {
                const { socketID, name, room, points, role, ready } = player;
                allPlayersInRoom.push({ socketID, name, room, points, role, ready });
            }
            this.io.to(this.room).emit("updatePlayerList", Array.from(allPlayersInRoom));
        } 
        catch (error) {
            console.error("Error in updateReadyState:", error.message);
        }
    }


    toJSON() {
        try {
            return {
                socketID: this.socketID,
                name: this.name,
                points: this.points,
                role: this.role,
                ready: this.ready
            };
        }
        catch (error) {
            console.error(`Error in toJSON for ${this.socketID}: ${error.message}`);
            return {};
        }
    }
}

module.exports = Player;