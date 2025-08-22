
import { io } from "socket.io-client";
import backendLink from "./backendlink.js";
console.log(backendLink);

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;

const playerType = ["admin", "regular", "admin", "regular", "admin", "regular", "admin", "regular", "admin", "regular"];

const TOTAL_BOTS = 300;

function startBot(i) {
  const socket = io(backendLink, {
    transports: ["websocket"], 
    reconnection: true,
  });

  socket.on("connect", () => {
    const room = `Room${Math.floor(Math.random() * 10)}`;
    const name = `Player${i}`;
    const role = playerType[Math.floor(Math.random() * playerType.length)];
    const ready = true;

    socket.emit("join-room", { room, name, role, ready });
    console.log(`[Bot ${i}] Joined ${room} as ${role}`);

    // Simulate drawing every 500-1000ms
    setInterval(() => {
      const offsetX = Math.random() * CANVAS_WIDTH;
      const offsetY = Math.random() * CANVAS_HEIGHT;
      const color = "#" + Math.floor(Math.random() * 16777215).toString(16);
      const strokeSize = Math.floor(Math.random() * 10) + 1;
      console.log(`[Bot ${i}] is drawing in ${room} as ${role}`);
      socket.emit("draw", { room, offsetX, offsetY, color, strokeSize });
    }, Math.random() * 500 + 500);

    setInterval(() => {
      socket.emit("stopDrawing", room);
    }, Math.random() * 3000 + 2000);

    setInterval(() => {
      const messages = ["Hello!", "Nice draw!", "Guessing...", "😂", "Wow!"];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      socket.emit("sendMessage", { room, name, message: msg });
    }, Math.random() * 4000 + 2000);
  });

  socket.on("disconnect", () => {
    console.log(`[Bot ${i}] Disconnected`);
  });

  socket.on("connect_error", (err) => {
    console.log(`[Bot ${i}] Connection error: ${err.message}`);
  });
}

for (let i = 0; i < TOTAL_BOTS; i++) {
  setTimeout(() => startBot(i), i * 20); // start each bot 20ms apart
}
