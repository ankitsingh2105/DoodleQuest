const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../config/mysqlconfig");

const JWT_SECRET = "doodlequestsecret";
 
router.post("/", async (req, res) => {
    const { userName, password } = req.body;
    const connection = await db();
    console.log("Login attempt for user:", req.body);
    try {
        const [rows] = await connection.execute(
            "SELECT user_id, userName, password FROM users WHERE userName = ?",
            [userName] 
        );
        await connection.end();
        console.log("Database query result:", rows);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = rows[0];
        console.log("User found:", user);
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }  

        // create token
        const payload = { userId: user.user_id, userName: user.userName };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

        res.cookie("doodlequesttoken", token, {
            secure: true,
            sameSite: "none",
            maxAge: 2 * 60 * 60 * 1000
        });  

        res.status(200).json({
            message: "Login successful",
            token,
            user: { userId: user.user_id, userName: user.userName }
        });
    }
    catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
