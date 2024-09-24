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

        socket.current.on("draw", ({ offsetX, offsetY, color }) => {
            const context = contextRef.current;
            context.strokeStyle = color;
            context.lineTo(offsetX, offsetY);
            context.stroke();
        });

        socket.current.on("clear", ({ width, height }) => {
            const canvas = canvasRef.current;
            const context = contextRef.current;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.clearRect(0, 0, width, height);
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
    }, [room]);


    useEffect(() => {
        const handleNewPlayer = async (player) => {
            let response = await axios.get(`${backendLink}/userList`);
            setplayers(response.data)
        }
        socket.current.on("newPlayer", handleNewPlayer)
    }, [socket.current])


    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.strokeStyle = color;
        context.lineWidth = 5;
        contextRef.current = context;
        return () => {
            if (socket.current) {
                socket.current.disconnect();
                socket.current = null;
            }
        };
    }, [color]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        setIsDrawing(false);
        contextRef.current.closePath();
        socket.current.emit("stopDrawing", { room });
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;

        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();

        throttledEmitDraw(offsetX, offsetY, color);
    };

    const throttledEmitDraw = throttle((offsetX, offsetY, color) => {
        socket.current.emit("draw", { room, offsetX, offsetY, color });
    }, 50);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        socket.current.emit("clear", { room, "width": canvas.width, "height": canvas.height });
    };

    function throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

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
                                style={{ border: "2px solid black" }}
                            />
                            <div style={{ marginTop: '10px' }}>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                                &nbsp;
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
