import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Eraser } from "lucide-react";
import "./Playground.css";

import "./Playground.css";
import Chat from "../Chat/Chat.jsx";
import Players from "../Players/Players.jsx";
import InfoBar from "../InfoBar/InfoBar.jsx";
import { toast } from "react-toastify";
import { createSocket } from "./socket";
import { VolumeX, Volume2 } from "lucide-react";

export default function Playground() {
  const [searchParams] = useSearchParams();
  const room = searchParams.get("roomID");
  const name = searchParams.get("name");
  const socket = useRef(createSocket(room));
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const strokeSizeRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [players, setplayers] = useState([]);
  const [playerID, setPlayerID] = useState("");
  const [strokeSize, setStrokeSize] = useState(5);
  const [disableCanvas, setDisableCanvas] = useState(false);
  const [volumeToggle, setVolumeToggle] = useState(false);

  const playerIDRef = useRef(null);
  const finalScorecard = useRef(null);
  const navigate = useNavigate();
  const backgroundMusic = useRef(null);

  useEffect(() => {
    console.log(
      "%c⚡WELCOME⚡",
      "font-size: 32px; color: LIGHTGREEN; font-weight: bold;"
    );
    backgroundMusic.current = new Audio("/backgroundMusic.mp3");
    backgroundMusic.current.loop = true;
    backgroundMusic.current.volume = 0.5;
  }, []);

  let role = sessionStorage.getItem("role");
  useEffect(() => {
    if (!socket.current.connected) {
      socket.current.connect();
    }
    socket.current.emit("join-room", { room, name, role, ready: false });
  }, [room, socket]);

  useEffect(() => {
    // todo : this runs exactly once when the component unmounts like navigating away or hitting the back button
    return () => {
      if (socket.current && socket.current.connected) {
        socket.current.disconnect();
      }
    };
  }, []);

  const kickUserInFiveSeconds = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  };

  const handleKickedUser = async ({ targetSocketID }) => {
    if (targetSocketID !== playerIDRef.current) {
      return;
    }
    toast.info("You will be removed by the admin in 5 second", {
      autoClose: 5000,
    });
    await kickUserInFiveSeconds();
    navigate("/");
  };

  useEffect(() => {
    const handleDraw = ({ offsetX, offsetY, color, socketID, strokeSize }) => {
      if (socketID === playerIDRef.current) {
        return;
      }
      const context = contextRef.current;
      context.strokeStyle = color;
      context.lineWidth = strokeSize;
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

    const handleBeginPath = ({ socketID, strokeSize }) => {
      if (socketID === playerIDRef.current) {
        return;
      }
      const context = contextRef.current;
      context.beginPath();
      context.lineWidth = strokeSize;
    };

    const handleUpdatePlayerList = (updatedPlayers) => {
      setplayers(updatedPlayers);
    };

    const handleNewPlayer = async ({ room, name, playerSocketID }) => {
      if (!playerIDRef.current) {
        setPlayerID(playerSocketID);
        playerIDRef.current = playerSocketID;
      }
    };
    const waitForSomeTimeForScoreBoard = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          socket.current.emit("hideScoreCard", { room });
          resolve();
        }, 4000);
      });
    };
    const declareResult = async () => {
      finalScorecard.current.style.display = "block";
      await waitForSomeTimeForScoreBoard();
    };

    const hideScoreCard = () => {
      finalScorecard.current.style.display = "none";
    };

    socket.current.on("newPlayer", handleNewPlayer);
    socket.current.on("hideScoreCard", hideScoreCard);
    socket.current.on("gameOver", declareResult);
    socket.current.on("draw", handleDraw);
    socket.current.on("clear", handleClear);
    socket.current.on("stopDrawing", handleStopDrawing);
    socket.current.on("beginPath", handleBeginPath);
    socket.current.on("updatePlayerList", handleUpdatePlayerList);
    socket.current.on("kicked", handleKickedUser);

    return () => {
      socket.current.off("newPlayer");
      socket.current.off("draw", handleDraw);
      socket.current.off("clear", handleClear);
      socket.current.off("stopDrawing", handleStopDrawing);
      socket.current.off("beginPath", handleBeginPath);
      socket.current.off("updatePlayerList", handleUpdatePlayerList);
      socket.current.off("kicked", handleKickedUser);
    };
  }, [socket]);

  useEffect(() => {
    playerIDRef.current = playerID;
  }, [playerID]);

  useEffect(() => {
    strokeSizeRef.current = strokeSize;
  }, [strokeSize]);

  // useEffect for convas
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = color;
    context.lineWidth = 5;
    contextRef.current = context;
  }, [color]); // only return when color changes

  const startDrawing = ({ offsetX, offsetY }) => {
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    contextRef.current.lineWidth = strokeSize;
    contextRef.current.strokeStyle = color;
    socket.current.emit("beginPath", { room, strokeSize });
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
    // e is synthetic event, nativeEvent is the real event
    // nativeEvent is the real event, it has offsetX and offsetY properties
    const { offsetX, offsetY } = nativeEvent;

    const context = contextRef.current;
    context.lineTo(offsetX, offsetY);
    context.stroke();

    throttledEmitDraw(offsetX, offsetY, color, strokeSize);
  };

  //todo :: Each mouse movement sends a request via WebSocket. too limit how often requests are sent, I used the throttle function.

  // used throttling, and closure
  const throttledEmitDraw = throttle(function (
    offsetX,
    offsetY,
    color,
    strokeSize
  ) {
    socket.current.emit("draw", { room, offsetX, offsetY, color, strokeSize });
  },
  20); // * req after 20ms only

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
    socket.current.emit("clear", {
      room,
      width: canvas.width,
      height: canvas.height,
    });
  };

  const colors = [
    "#EF4444",
    "#F97316",
    "#FACC15",
    "#22D3EE",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#6B7280",
    "#000000",
  ];
  const handleToggle = () => {
    if (volumeToggle) {
      backgroundMusic.current.pause();
    } else {
      backgroundMusic.current.play();
    }
    setVolumeToggle(!volumeToggle);
  };

  return (
    <>
      <main
        className="flex flex-col items-center justify-center bg-gray-100 space-y-6 min-h-0"
        style={{
          transform: "scale(0.9)",
          transformOrigin: "top left",
          width: "111.11%",
        }}
      >
        {/* background music  */}
        <section className="fixed bottom-20 right-20 z-50 rounded-4xl bg-green-500 p-2 hover:cursor-pointer">
          {volumeToggle ? (
            <Volume2 color="white" onClick={handleToggle} size={45} />
          ) : (
            <VolumeX color="white" onClick={handleToggle} size={45} />
          )}
        </section>

        {/* Result */}
        <center>
          <div
            ref={finalScorecard}
            className="hidden fixed top-1/3 left-0 right-0 border-7 border-dashed border-blue-300 rounded-4xl p-6 max-w-lg mx-auto bg-white shadow-lg"
          >
            <div
              onClick={() => {
                finalScorecard.current.style.display = "none";
              }}
              className="hover:cursor-pointer absolute top-2 right-2 text-2xl font-bold"
            >
              x
            </div>
            <h1 className="underline text-2xl font-bold text-blue-500 mb-4">
              Final Scorecard
            </h1>
            <ul className="space-y-2">
              {[...players]
                .sort((a, b) => b.points - a.points)
                .map((e, i) => (
                  <li
                    key={i}
                    className={`${
                      i % 2 === 0 ? "text-pink-500" : "text-blue-500"
                    } font-bold`}
                  >
                    {e.name} - {e.points}
                  </li>
                ))}
            </ul>
          </div>
        </center>

        {/* InfoBar */}
        <section
          className={`w-full max-w-6xl bg-white rounded-2xl shadow-lg p-4`}
        >
          <InfoBar
            setDisableCanvas={setDisableCanvas}
            playerID={playerID}
            setplayer={setplayers}
            player={players}
            name={name}
            room={room}
            socket={socket.current}
          />
        </section>

        <section className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">
          {/* Player List */}
          <section className="flex-1 bg-white rounded-2xl shadow-lg p-4">
            <Players
              name={name}
              room={room}
              socket={socket.current}
              playerList={players}
              playerSocketId={playerIDRef.current}
            />
          </section>

          {/*todo : Drawing Canvas */}
          <section className="flex-1 flex flex-col items-center bg-white rounded-2xl shadow-lg p-6">
            <canvas
              ref={canvasRef}
              width={window.innerWidth <= 400 ? 400 : 600}
              height={450}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={finishDrawing}
              onPointerLeave={finishDrawing}
              onPointerCancel={finishDrawing}
              className={`border border-gray-300 bg-white rounded-lg ${
                disableCanvas ? "pointer-events-none" : "pointer-events-auto"
              }`}
              style={{ touchAction: "none" }}
            />

            <section className="flex-row align-center justify-center">
              <section className="flex">
                <div className="mt-4 mr-4 flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <div
                      key={c}
                      onClick={() =>
                        handleColorChange({ target: { value: c } })
                      }
                      className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div
                  onClick={() => {
                    toast.info("Eraser selected", { autoClose: 300 });
                    setColor("white");
                  }}
                  className="m-4 ml-0 hover:cursor-pointer"
                >
                  <Eraser size={38} className="text-gray-600" />
                </div>

                <div className="mt-4">
                  <button
                    onClick={clearCanvas}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg hover:cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </section>
              <section className="flex align-center justify-center">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={strokeSize}
                  onChange={(e) => setStrokeSize(e.target.value)}
                  className="slider w-64 h-10 accent-blue-600"
                />
              </section>
            </section>
          </section>

          {/* Chat */}
          <section className="flex-1 bg-white rounded-2xl shadow-lg p-4">
            <Chat name={name} room={room} socket={socket.current} />
          </section>
        </section>

        {/* admin privlages list */}
        <section className="pb-3">
          {role == "admin" ? (
            <>
              <b className="flex justify-center text-3xl">Admin Privlages</b>
              <ul>
                <li className="p-2">
                  1. Admin can kick the player using the button below the
                  player's name
                </li>
                <li className="p-2">4. Admin can start the game</li>
                <li className="p-2">2. Admin can set the draw duration</li>
                <li className="p-2">3. Admin can set the difficulty</li>
              </ul>
            </>
          ) : (
            <></>
          )}
        </section>
      </main>
    </>
  );
}
