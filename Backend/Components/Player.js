class Player {
    constructor(socketID, name) {
        this.socketID = socketID;
        this.name = name;
        this.points = 0;
    }

    updatePoints(drawTime) {
        this.points = 10 * drawTime;
    }

    toJSON() {
        return {
            socketID: this.socketID,
            name: this.name,
            points: this.points
        };
    }
}

module.exports = Player;