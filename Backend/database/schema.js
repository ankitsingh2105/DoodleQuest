const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/Scribbles");


const userSchema = new mongoose.Schema({
    userName: String,
    userId: String,
    points: Number,
    room : String
});


const User = mongoose.model("User", userSchema);

module.exports = { User };