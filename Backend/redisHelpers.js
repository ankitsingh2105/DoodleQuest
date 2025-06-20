const Redis = require("ioredis");
const redis = new Redis();

// docker run --rm -p 6379:6379 redis redis-server --save "" --appendonly no

function getRoomKey(room) {
    return `group:${room}`;
}

async function addPlayerToRoom(room, player, activeRooms) {
    const key = getRoomKey(room);
    const roomExists = await redis.exists(key);
    const current = await redis.smembers(key);
    console.log("current :: ", current)
    console.log(player);
    for (const member of current) {
        const obj = JSON.parse(member);
        if (obj.socketID === player.socketID) {
            await redis.srem(key, member);
            break;
        }
    }

    if (!roomExists) activeRooms.inc();
    await redis.sadd(key, JSON.stringify(player));
}

async function getPlayersInRoom(room) {
    const key = getRoomKey(room);
    const players = await redis.smembers(key);
    return players.map((p) => JSON.parse(p));
}

async function removePlayerFromRoom(room, socketID) {
    const key = getRoomKey(room);
    const current = await redis.smembers(key);
    console.log("remove :: ", key, current);
    for (const str of current) {
        const obj = JSON.parse(str);
        console.log(obj)
        console.log(obj.socketID, "  === ", socketID);
        if (obj.socketID === socketID) {
            await redis.srem(key, str);
            break;
        }
    }
}

async function clearRoomIfEmpty(room, activeRooms) {
    const key = getRoomKey(room);
    const count = await redis.scard(key);
    if (count === 0) {
        await redis.del(key);
        activeRooms.dec();
    }
}

module.exports = {
    addPlayerToRoom,
    getPlayersInRoom,
    removePlayerFromRoom,
    clearRoomIfEmpty,
};
