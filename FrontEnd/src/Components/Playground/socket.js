
import { io } from "socket.io-client";
import backendLink from "../../../backendlink";

export function createSocket(roomID) {
  return io(backendLink, {
    autoConnect: false,
    transports: ["websocket"], 
    query: { roomID }
  });
}
