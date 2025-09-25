const jwt = require("jsonwebtoken");
const JWT_SECRET = "doodlequestsecret"; 
const TOKEN_NAME = "doodlequesttoken";

async function auth(req, response, next){
    const token = req.cookies[TOKEN_NAME];
    if(!token){
        return response.status(401).json({message: "No token, authorization denied"});
    }
    console.log("Token found:", token);
    try{ 
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log("Authenticated user:", req.user);
        next(); 
    }
    catch(err){
        console.error("Token verification failed:", err);
        return response.status(401).json({message: "Token is not valid"});
    }
}  

module.exports = auth;