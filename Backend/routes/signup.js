const express = require("express");
const router = express.Router();
const db = require("../config/mysqlconfig");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "doodlequestsecret";

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
        const [user] = await connection.execute(
            'INSERT INTO users (userName, email, password) VALUES (?, ?, ?)',
            [userName, email, password]
        );
        await connection.end();

        const payload = { userName: userName };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

        res.cookie("doodlequesttoken", token, {
            // httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 2 * 60 * 60 * 1000
        });  

        res.status(200).json({
            message: "Signup successful",
            token,
            user: { userId: user.user_id, userName: user.userName }
        });
    }
    catch (error) {
        console.error("Error during signup:", error.sqlState);
        let message = "Internal server error";
        if (error.sqlState === '23000') {
            message = "Username already taken";
        }
        res.status(500).json({ message });
    }
});

module.exports = router;    