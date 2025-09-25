const express = require("express");
const router = express.Router();
const db = require("../config/mysqlconfig");
const requireAuth = require('../middleware/authMiddleWare');

router.get("/details/:userId", requireAuth, async (req, response) => {
    const connection = await db();
    const { userId } = req.params;
    try {
        const [rows] = await connection.execute(`
            SELECT userName, email, created_at, games_played, bio, profile_photo_url, level, number_of_followers 
            FROM users 
            where users.user_id = ?`
            , [userId]);
        console.log(rows);

        await connection.end();
        response.status(200).send(rows[0]);

    }  
    catch (error) {
        console.log("Error fetching user details:", error);
        response.status(500).json({ message: "Failed to fetch user details" });
    }
})

router.patch("/updateDetails/:userId", requireAuth, async (req, response) => {
    const { userId } = req.params;
    const { bio, profile_photo_url } = req.body;
    const connection = await db();
    try {
        const [result] = await connection.execute(`
            UPDATE users
            SET bio = ?, profile_photo_url = ?
            WHERE user_id = ?`
            , [bio, profile_photo_url, userId]);
        await connection.end();
        response.status(200).json({ message: "User details updated successfully" });
    }
    catch (error) {
        console.log("Error updating user details:", error);
        response.status(500).json({ message: "Failed to update user details" });
    }
})

router.get("/adminGames/:userId", requireAuth, async (req, response) => {
    const connection = await db();
    const { userId } = req.params;
    try {
        const [rows] = await connection.execute(`
            Select game_id, room_id, started_at
            from games
            where admin_id = ?`
            , [userId]);
        console.log(rows);
        await connection.end();
        return response.status(200).send(rows);
    }
    catch (error) {
        console.log("Error fetching admin games:", error);
        response.status(500).json({ message: "Failed to fetch games where user is admin" });
    }
})

router.get("/gamesPlayed/:userId", requireAuth, async (req, response) => {
    const connection = await db();
    const { userId } = req.params;
    try {
        const [rows] = await connection.execute(`
            Select game_id, room_id, joined_at, role, score
            from user_games
            where user_id = ?`
            , [userId]);
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
    try{
        console.log("Authenticated user:", req.user);
        res.status(200).json({ message: 'User is authenticated', user: req.user });
    }
    catch(err){
        console.error("Error in /status route:", err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router