const express = require("express");
const router = express.Router();
const db = require("../config/mysqlconfig");
const requireAuth = require('../middleware/authMiddleWare');

router.get("/details/:userName", requireAuth, async (req, response) => {
    const connection = await db();
    const { userName } = req.params;
    console.log("Fetching details for user:", userName);
    try {
        const [rows] = await connection.execute(`
            SELECT userName, email, created_at, games_played, bio, profile_photo_url, level, number_of_followers 
            FROM users 
            where users.userName = ?`
            , [userName]);
        console.log(rows);

        await connection.end();
        response.status(200).send(rows[0]);
    }
    catch (error) {
        console.log("Error fetching user details:", error);
        response.status(500).json({ message: "Failed to fetch user details" });
    }
})

router.get("/gamesPlayed/:userName", requireAuth, async (req, response) => {
    const connection = await db();
    const { userName } = req.params;
    try {
        const [rows] = await connection.execute(`
            Select room_id, joined_at, role
            from user_games
            where userName = ?`
            , [userName]);
        console.log(rows);
        await connection.end();
        return response.status(200).send(rows);
    }
    catch (error) {
        console.log("Error fetching games played:", error);
        response.status(500).json({ message: "Failed to fetch games played by user" });
    }
}); 

router.post("/addGame", requireAuth, async (req, response) => {
    const connection = await db();
    const { userName, room_id, role } = req.body;
    console.log(userName, room_id, role);
    try {
        const [rows] = await connection.execute(`
            Insert into user_games(userName, room_id, role)
            value(?, ?, ?)
            `
            , [userName, room_id, role]);
        console.log(rows);
        await connection.end();
        return response.status(200).send(rows);
    }
    catch (error) {
        console.log("Error fetching games played:", error);
        response.status(500).json({ message: "Failed to fetch games played by user" });
    }
}); 

router.get("/status", requireAuth, (req, res) => {
    try {
        console.log("Authenticated user:", req.user);
        res.status(200).json({ message: 'User is authenticated', userName: req.user.userName });
    }
    catch (err) {
        console.error("Error in /status route:", err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
 
router.put("/updateAvatar/:userName", requireAuth, async (req, response) => {
    const connection = await db();
    const { userName } = req.params;
    const { profile_photo_url } = req.body;
    console.log(" :: ",  userName, profile_photo_url);
    try {
        await connection.execute(`
            Update users
            set profile_photo_url = ?
            where userName = ?  
        `, [profile_photo_url, userName]);
        await connection.end();
        return response.status(200).send({
            messgae: "Photo updated successfully"
        });
    }
    catch (error) {
        console.log("Error updating profile photo:", error);
        response.status(404).send({
            message: "Something went wrong"
        })
    }
});

router.post("/follow", async (req, response)=>{
    const connection = await db();
    const { userName, name } = req.body;
    console.log(" :: ",  userName, name);
    try {
        await connection.execute(`
            insert into 
            followers (followee_userName, follower_userName)
            values (?, ?)  
        `, [userName, name]);
        await connection.end();
        return response.status(200).send({
            messgae: "Following successful"
        });
    }
    catch (error) {
        console.log("Error Following:", error);
        response.status(404).send({
            message: "Already Following"
        })
    }
})

module.exports = router