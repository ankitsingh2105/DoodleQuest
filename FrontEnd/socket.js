import { io } from "socket.io-client";

import backendlink from "./src/backendlink";

const socket = io(`${backendlink}`);

export default socket ;  