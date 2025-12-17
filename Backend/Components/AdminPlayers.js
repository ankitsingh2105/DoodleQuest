//todo :: start/end the game, view game staastics, kick players

const Player = require("./Player");

class AdminPlayer extends Player {
    constructor(socket, io, socketID, name, room, role) {
        super(socket, io, socketID, name, room, role);
    }

    kickUser(targetSocketID, allRooms, targetRoom) {
        try {
            if (!targetRoom) throw new Error("Target not in any room");

            const players = allRooms.get(targetRoom);
            if (!players) throw new Error("Room not found");

            console.log(players)
            console.log(typeof(players))
            for (let player of players) {
                // player is a instance of the Player (admin / normal) class
                if (player.socketID === targetSocketID) {
                    players.delete(player);
                    break;
                }
            }
            const updatedPlayers = Array.from(players).map(p => p.toJSON());
            console.log(typeof(updatedPlayers))
            console.log(updatedPlayers)
            this.emitUpdate(updatedPlayers);
            this.io.to(targetRoom).emit("kicked", { targetSocketID })
        } catch (error) {
            console.error(`Error in kickUser: ${error.message}`);
        }
    }
    startGame(playerIndex, room, customDrawTime, difficulty) {
        try {
            if (!room) {
                throw new Error("Room ID is required to start the game.");
            }

            this.io.to(room).emit("startGame", {
                playerIndex,
                customDrawTime,
                difficulty
            });
        } 
        catch (error) {
            console.error(`Error in startGame for room ${room}:`, error.message);
        }
    }
}
module.exports = AdminPlayer;