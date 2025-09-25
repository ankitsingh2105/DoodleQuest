const express = require("express");
const router = express.Router();
const db = require("../config/mysqlconfig");

router.post("/", async (req, res) => {
    const { userName, email, password } = req.body;
    console.log(req.body);
    const connection = await db();
    try {
        const [existingUser] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',  
            [email]
        );
        if (existingUser.length > 0) {
            await connection.end();
            return res.status(409).json({ message: "Email already in use" });
        }
        const [result] = await connection.execute(
            'INSERT INTO users (userName, email, password) VALUES (?, ?, ?)',
            [userName, email, password]
        );
        await connection.end();
        res.status(201).json({ message: "User registered successfully", userId: result.insertId });
    }
    catch (error) { 
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;    