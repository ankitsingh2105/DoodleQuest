import React, { useState, useEffect, useRef } from 'react';
import io from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import "./Main.css";
import Chat from '../Chat/Chat';
import Players from '../Players/Players';
import Info from '../InfoBar/Info';
import axios from 'axios';
import { toast } from 'react-toastify';
import backendLink from '../../../backendlink';
import websocket from '../../../socket';
export default function Main() {
    const [searchParams] = useSearchParams();
    const room = searchParams.get('roomID');
    const name = searchParams.get("name");
    const socket = useRef(websocket);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [players, setplayers] = useState([])

    const [clientId, setClientID] = useState(localStorage.getItem("playerID") ||undefined);


    const handleOnoad = async (event) => {
        await socket.current.emit("disconnectUser", { name, room });
        window.location.href = "/"
    };
    window.addEventListener("load", handleOnoad);


    useEffect(() => {
        if (!socket.current) {
            socket.current = io.connect(`${backendLink}`);
        }

        socket.current.emit("join-room", { room, name });

        socket.current.on("draw", ({ offsetX, offsetY, color, playerID}) => {
            console.log("on the top ::  vaha se -> ", playerID , " and ", clientId)
            if(playerID == clientId) return;
            const context = contextRef.current;
            context.lineTo(offsetX, offsetY);
            context.stroke();
        });


        socket.current.on("clear", ({ width, height }) => {
            const canvas = canvasRef.current;
            const context = contextRef.current;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.beginPath();
        });

        socket.current.on("stopDrawing", () => {
            const context = contextRef.current;
            context.closePath();
        });

        // todo :: Cleanup function: disconnect socket when component unmounts or when room changes
        return () => {
            socket.current.disconnect();
        };
    }, [socket]);


    useEffect(() => {
        const handleNewPlayer = async (playerID) => {
            if(playerID == clientId) return;
            const room = searchParams.get('roomID');
            setClientID(playerID);
            localStorage.setItem("playerID" , playerID);
            let response = await axios.get(`${backendLink}/userList`);
            let playerdata = response.data.filter((e) => {
                return e.room == room
            })
            setplayers(playerdata)
        }
        socket.current.on("newPlayer", handleNewPlayer)
    },[])

    useEffect(()=>{
        console.log("mere naam  :: " , clientId);
    },[clientId])


    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.lineWidth = 5;
        contextRef.current = context;
        return () => {
            if (socket.current) {
                socket.current.disconnect();
                socket.current = null;
            }
        };
    }, [socket]);

    const startDrawing = ({ offsetX, offsetY }) => {
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        socket.current.emit("beginPath", { room, offsetX, offsetY });
        setIsDrawing(true);
    };

    useEffect(() => {
        socket.current.on("beginPath", ({ offsetX, offsetY ,playerID }) => {
            if(playerID == clientId) return;
            const context = contextRef.current;
            context.beginPath();
            context.moveTo(offsetX, offsetY);
        });
    }, []);


    const finishDrawing = () => {
        setIsDrawing(false);
        contextRef.current.closePath();
        socket.current.emit("stopDrawing", { room });
    };

    // todo : for picking color
    const handleColorChange = (event) => {
        setColor(event.target.value);
    };


    // * called on onMouseMove event
    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;

        const { offsetX, offsetY } = nativeEvent;

        const context = contextRef.current;
        context.lineTo(offsetX, offsetY);
        context.stroke();

        throttledEmitDraw(offsetX, offsetY, color);
    };

    //todo :: Each mouse movement sends a request via WebSocket. To limit how often requests are sent, I used the throttle function.

    // used throttling, and closure


    const throttledEmitDraw = throttle(function ([offsetX, offsetY, color]) {
        socket.current.emit("draw", { room, offsetX, offsetY, color });
    }, 20); // * req after 20ms only


    function throttle(func, limit) {
        let inThrottle = false;
        return function (...args) {
            if (!inThrottle) {
                func(args);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                }, limit);
                // todo :: here i am forcing the requests to be sent only every 20 milliseconds, instead of on every single mouse movement event.
            }
        };
    }


    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        socket.current.emit("clear", { room, "width": canvas.width, "height": canvas.height });
    };



    return (
        <>
            <main className="Main_main">

                <section className='info_tab'>
                    <Info setplayer={setplayers} player={players} name={name} room={room} socket={socket.current} />
                </section>

                <section className='align'>
                    <section className="players">
                        <Players name={name} room={room} socket={socket.current} playerList={players} />
                    </section>
                    <section>
                        <br />
                        <center>
                            <canvas width="600px" height="450px"
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseUp={finishDrawing}
                                onMouseMove={draw}
                                onMouseLeave={finishDrawing}
                                style={{ border: "1px solid black", background:"white" }}
                            />
                            {/* <div style={{ marginBottom: '10px' }}>
                                <input
                                    id="colorPicker"
                                    type="color"
                                    value={color}
                                    onChange={handleColorChange}
                                />
                            </div> */}
                            <div style={{ marginTop: '10px' }}>
                                <button onClick={clearCanvas}>Clear</button>
                            </div>
                        </center>
                    </section>
                    <section className='chat'>
                        <Chat name={name} room={room} socket={socket.current} />
                    </section>
                </section>
            </main>
        </>
    );
};
