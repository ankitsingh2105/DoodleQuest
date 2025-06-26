class ChatManager {
    constructor(io, logger) {
        this.io = io;
        this.logger = logger;
    }

    sendMessage(info) {
        this.logger.info("Chat event: Message sent");
        const { room } = info;
        this.io.to(room).emit("receiveMessage", info);
    }
}

module.exports = ChatManager;