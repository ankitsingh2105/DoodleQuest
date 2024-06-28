import { io } from "socket.io-client";

import backendLink from "./backendlink";

const socket = io(`${backendLink}`);

export default socket ;  