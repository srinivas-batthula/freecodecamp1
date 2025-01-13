const mongoose = require("mongoose")



const logSchema = new mongoose.Schema({
    description: String,
    duration: Number,
    date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
    username: String,
    count: Number,
    log: [logSchema],
});

const UserModel = mongoose.model('user_1', userSchema)


module.exports = UserModel