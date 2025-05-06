import { io } from "socket.io-client";

import backendLink from "./src/backendlink";

const socket = io(`${backendLink}`);

export default socket ;  