//todo :: start/end the game, view game staastics, kick players

const Player = require("./Player");

class AdminPlayer extends Player {
    constructor(socket, io, socketID, name, room, role) {
        super(socket, io, socketID, name, room, role);
    }

    kickUser(targetSocketID, allRooms, targetRoom) {
        try {
            console.log("kicking in backend");
            if (!targetRoom) throw new Error("Target not in any room");

            const players = allRooms.get(targetRoom);
            console.log("all player :: ", players);
            if (!players) throw new Error("Room not found");

            for (let player of players) {
                if (player.socketID === targetSocketID) {
                    players.delete(player);
                    break;
                }
            }
            const updatedPlayers = Array.from(players).map(p => p.toJSON());
            this.emitUpdate(updatedPlayers);
            this.io.to(targetRoom).emit("kicked", { targetSocketID })
        } catch (error) {
            console.error(`Error in kickUser: ${error.message}`);
        }
    }
    startGame(currentIteration, room, loopCount, customDrawTime, difficulty) {
        try {
            console.log(room);
            console.log("in start game admin");
            if (!room) {
                throw new Error("Room ID is required to start the game.");
            }

            this.io.to(room).emit("acknowledgement", {
                currentIteration,
                loopCount,
                customDrawTime,
                difficulty
            });
        } catch (error) {
            console.error(`Error in startGame for room ${room}:`, error.message);
        }
    }

}

module.exports = AdminPlayer;