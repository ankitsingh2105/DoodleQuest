const mongoose = require("mongoose");

require('dotenv').config()
mongoose.connect("mongodb://127.0.0.1:27017/Scribbles");
// mongoose.connect("mongodb+srv://ankitchauhan21:thechauhan1@doodle.ys5gt9k.mongodb.net/?retryWrites=true&w=majority&appName=doodle");


const userSchema = new mongoose.Schema({
    userName: String,
    webSocketID: String,
    points: Number,
    room : String 
}); 


const User = mongoose.model("User", userSchema);

module.exports = { User };   