import React, { useState, useEffect, useRef } from 'react';
import io from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

import "./Main.css";
import Chat from '../Chat/Chat';
import Players from '../Players/Players';
import InfoBar from '../InfoBar/InfoBar';
import { toast } from 'react-toastify';
import backendLink from '@/backendlink.js';
import websocket from '@/socket.js';

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
    const [playerID, setPlayerID] = useState("");
    const [hasJoined, setHasJoined] = useState(false);

    const playerIDRef = useRef(null); // todo :: to prevent the stale value and prevent wrong updates
    const finalScorecard = useRef(null); // todo : scoreCard hidden;

    const navigate = useNavigate();

    // * learning ::  Most browsers block async operations (like socket calls) inside beforeunload.
    // handle this later
    // const handleOnoad = (event) => {
    //     socket.current.emit("userDisconnected", { name, room });
    //     socket.current.disconnect();
    //     window.location.href = "/"
    // };
    // window.addEventListener("load", handleOnoad);

    useEffect(() => {
        toast.success("This service is running on a free tier, might take some time to load", { autoClose: 1500 });
    }, [])


    useEffect(() => {
        // Only create socket connection once
        if (!socket.current) {
            socket.current = io.connect(`${backendLink}`);
        } 

        // todo :: want to prenet multiple joining of the same using, with different socket ids
        if (!hasJoined) {
            socket.current.emit("join-room", { room, name });
            setHasJoined(true);
        }
    }, [hasJoined, room, name]);

    useEffect(() => {
        if (!socket.current) {
            socket.current = io.connect(`${backendLink}`);
        }

        const handleDraw = ({ offsetX, offsetY, color, socketID }) => {
            if(socketID === playerIDRef.current){
                return;
            }
            const context = contextRef.current;
            context.strokeStyle = color;
            context.lineTo(offsetX, offsetY);
            context.stroke();
        };

        const handleClear = ({ width, height }) => {
            const canvas = canvasRef.current;
            const context = contextRef.current;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.beginPath();
        };

        const handleStopDrawing = () => {
            const context = contextRef.current;
            context.closePath();
        };

        const handleBeginPath = ({ socketID }) => {
            // console.log("playerID : ", playerID);
            // console.log("socketID: ", socketID);
            if (socketID === playerIDRef.current) {
                return;
            }
            const context = contextRef.current;
            // console.log("player id on socket is ", playerID);
            context.beginPath();
        };

        const handleUpdatePlayerList = (updatedPlayers) => {
            setplayers(updatedPlayers);
        };

        const handleNewPlayer = async ({ room, name, playerSocketID }) => {
            if (!playerIDRef.current) {
                setPlayerID(playerSocketID);
            }
        }
        const waitForSomeTimeForScoreBoard = () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    socket.current.emit("hideScoreCard", { room });
                    resolve();
                }, 4000);
            })
        }
        const declareResult = async () => {
            finalScorecard.current.style.display = "block";
            await waitForSomeTimeForScoreBoard();
        }

        const hideScoreCard = () => {
            finalScorecard.current.style.display = "none";
        }

        socket.current.on("newPlayer", handleNewPlayer)
        socket.current.on("hideScoreCard", hideScoreCard)
        socket.current.on("gameOver", declareResult);
        socket.current.on("draw", handleDraw);
        socket.current.on("clear", handleClear);
        socket.current.on("stopDrawing", handleStopDrawing);
        socket.current.on("beginPath", handleBeginPath);
        socket.current.on("updatePlayerList", handleUpdatePlayerList);

        return () => {
            socket.current.off("newPlayer");
            socket.current.off("draw", handleDraw);
            socket.current.off("clear", handleClear);
            socket.current.off("stopDrawing", handleStopDrawing);
            socket.current.off("beginPath", handleBeginPath);
            socket.current.off("updatePlayerList", handleUpdatePlayerList);

        };
    }, [socket]);



    useEffect(() => {
        playerIDRef.current = playerID;
        // console.log("see this one only  :: player id value updated ****** ::: ", playerID);
    }, [playerID]);

    // useEffect for convas 
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.lineWidth = 5;
        contextRef.current = context;
    }, [color]); // only rerun when color changes


    const startDrawing = ({ offsetX, offsetY }) => {
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        socket.current.emit("beginPath", { room, offsetX, offsetY });
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        setIsDrawing(false);
        contextRef.current.closePath();
        socket.current.emit("stopDrawing", { room });
        // contextRef.closePath();
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
    const throttledEmitDraw = throttle(function (offsetX, offsetY, color) {
        socket.current.emit("draw", { room, offsetX, offsetY, color });
    }, 20); // * req after 20ms only


    function throttle(func, limit) {
        let inThrottle = false;
        return function (...args) {
            if (!inThrottle) {
                func(...args);
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

    const colors = [
        '#EF4444',
        '#F97316',
        '#FACC15',
        '#4ADE80',
        '#22D3EE',
        '#3B82F6',
        '#8B5CF6',
        '#EC4899',
        '#6B7280',
        '#000000',
    ];


    return (
        <>
            <main style={{
            }} className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 space-y-6">

                {/* Result */}
                <center>
                    <div ref={finalScorecard} className="hidden fixed top-1/3 left-0 right-0 border-7 border-dashed border-blue-300 rounded-4xl p-6 max-w-lg mx-auto bg-white shadow-lg">
                        <div onClick={()=>{finalScorecard.current.style.display = "none";}} className="hover:cursor-pointer absolute top-2 right-2 text-2xl font-bold">x</div>
                        <h1 className="underline text-2xl font-bold text-blue-500 mb-4">Final Scorecard</h1>
                        <ul className="space-y-2">
                            {[...players]
                                .sort((a, b) => b.points - a.points)
                                .map((e, i) => (
                                    <li
                                        key={i}
                                        className={`${i % 2 === 0 ? 'text-pink-500' : 'text-blue-500'
                                            } font-bold`}
                                    >
                                        {e.name} - {e.points}
                                    </li>
                                ))}

                        </ul>
                    </div>
                </center>


                {/* InfoBar */}
                <section className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-4">
                    <InfoBar playerID={playerID} setplayer={setplayers} player={players} name={name} room={room} socket={socket.current} />
                </section>

                <section className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">


                    {/* Player List */}
                    <section className="flex-1 bg-white rounded-2xl shadow-lg p-4">
                        <Players name={name} room={room} socket={socket} playerList={players} />
                    </section>


                    {/*todo : Drawing Canvas */}
                    <section className="flex-1 flex flex-col items-center bg-white rounded-2xl shadow-lg p-6">
                        <canvas
                            width="600px" 
                            height="450px"
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseUp={finishDrawing}
                            onMouseMove={draw}
                            onMouseLeave={finishDrawing}
                            className="border border-gray-300 bg-white rounded-lg"
                        />
                        <section className="flex">
                            <div className="mt-4 mr-4 flex flex-wrap gap-2">
                                {colors.map((c) => (
                                    <div
                                        key={c}
                                        onClick={() => handleColorChange({ target: { value: c } })}
                                        className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={clearCanvas}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                >
                                    Clear
                                </button>
                            </div>
                        </section>
                    </section>


                    {/* Chat */}
                    <section className="flex-1 bg-white rounded-2xl shadow-lg p-4">
                        <Chat name={name} room={room} socket={socket.current} />
                    </section>

                </section>
            </main>

        </>
    );
};
