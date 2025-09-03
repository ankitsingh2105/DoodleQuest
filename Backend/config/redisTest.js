const client = require("./redisClient");

async function init() {
    const info = {
        name: "ankit",
        room: 23
    }
    const info1 = {
        name: "manish",
        room: 24
    }
    await client.sadd("singh", JSON.stringify(info1));
    await client.sadd("singh", JSON.stringify(info));
    await client.sadd("doodle:allRooms", "room1");
    await client.sadd("doodle:allRooms", "room2");
    await client.sadd("doodle:allRooms", "room3");
    await client.sadd("doodle", "room");
    await client.sadd("doodl", "room");
    let opp = await client.smembers("doodl");
    opp = opp[0];
    console.log(" op :: " , opp);
    let allRooms = await client.smembers("doodle:allRooms");
    allRooms.forEach((e, i)=>{
        console.log(i, " : " , e);
    })
    console.log(allRooms);
    // await client.sadd("singh", "manish");
    // await client.srem("singh" ,   JSON.stringify(info));
    const allItems = await client.smembers("singh");
    const op = await client.lpush("room", "op");
    console.log(op);
    allItems.forEach(element => {
        let op;
        try { 
            op = JSON.parse(element);
        }
        catch (error) {
            op = element; 
        }
        console.log(op);
    });
} 

init();
  