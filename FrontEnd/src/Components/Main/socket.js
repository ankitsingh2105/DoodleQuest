import { io } from "socket.io-client";

import backendLink from "../../../backendlink";

const socket = io(`${backendLink}`,{
    autoConnect : false
});

export default socket ;  