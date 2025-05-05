import React, { useRef, useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function InfoBar(props) {
  const { playerID, socket, player, name, setplayer, room } = props;

  const [answer, setAnswer] = useState("");
  const [item, setItem] = useState("");
  const [random, setrandom] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [drawTime, setDrawTime] = useState(0);
  const [playerDrawing, setPlayerDrawing] = useState("");
  const [inputDisable, setInputDisable] = useState(false); // for disabling input when user is drawing or have already answered correctly

  const [disableStart, setStartDisable] = useState(false);

  const questions = useRef(null);
  const whoDrawingNow = useRef(null);

  const wordArray = [
    { 1: "mango", 2: "banana", 3: "cherry" },
    { 1: "lamp", 2: "elephant", 3: "fox" },
    { 1: "guitar", 2: "harp", 3: "instrument" },
    { 1: "kite", 2: "valley", 3: "lamp" },
    { 1: "tree", 2: "notebook", 3: "ocean" }
  ];


  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((time) => time - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    let timer;
    if (drawTime > 0) {
      timer = setTimeout(() => setDrawTime((time) => time - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [drawTime]);

  async function chooseWordWait() {
    return new Promise((resolve) => setTimeout(resolve, 7000));
  }

  useEffect(() => {
    const handleAcknowledgement = async (index) => {
      setStartDisable(true);
      const currentPlayer = player[index];
      setrandom(Math.floor(Math.random() * 5));

      if (currentPlayer?.name === name) {
        setCountdown(5);
        setDrawTime(7);
        whoDrawingNow.current.style.display = "none";
        questions.current.style.display = "flex";
        setInputDisable(true);
        await chooseWordWait();
      }
      else {
        setDrawTime(7);
        setPlayerDrawing(currentPlayer?.name || '');
        whoDrawingNow.current.style.display = "flex";
        setInputDisable(false);
      }
    };

    socket.on('acknowledgement', handleAcknowledgement);
    return () => socket.off('acknowledgement', handleAcknowledgement);
  }, [player, name]);

  useEffect(() => {
    questions.current.style.display = "none";
  }, [])

  const StartGame = async () => {
    setInputDisable(false);
    // questions.current.style.display = "flex";
    let loopCount = player.length;
    if (loopCount == 1) {
      toast.error("Waiting for other players!", { autoClose: 1000 });
      return;
    }
    let currentIteration = 0;
    socket.emit('myEvent', { currentIteration, room });

    const interval = setInterval(async () => {
      if (currentIteration < loopCount - 1) {
        currentIteration++;
        socket.emit('myEvent', { currentIteration, room });
        setInputDisable(false);
      }
      else {
        setInputDisable(false);
        clearInterval(interval);
        socket.emit('gameOver', { room });
      }
    }, 7000);
  };

  const handleEnter = async (e) => {
    if (e.key === 'Enter') {
      if (item === answer) {
        toast.success("Right Answer, points updated", { autoClose: 1000 });
        socket.emit("updatePlayerPoints", { name, drawTime, room, playerID });
        setInputDisable(true)
      } else {
        toast.error(`Wrong Guess`, { autoClose: 1000 });
      }
    }
  };

  const handleGuesstingWord = async (word) => {
    setItem(word);
  }

  useEffect(() => {
    socket.on("wordToGuess", handleGuesstingWord);
    return () => socket.off("wordToGuess", handleGuesstingWord);
  }, [item, socket]);

  useEffect(() => {
    socket.on('updatePlayerPoints', ({ players }) => {
      setplayer(players);
    });
    socket.on("gameOver", ()=>{
      setStartDisable(false);
    })
    return () =>{ 
      socket.off('updatePlayerPoints');
      socket.off('gameOver');
    }

  }, [socket]);

  return (
    <div className="flex flex-col items-center justify-center p-0.5">
      <ToastContainer />

      <small ref={whoDrawingNow} className="text-gray-500 mb-2 text-lg hidden">
        {playerDrawing} is drawing...
      </small>

      {/* Horizontal section */}
      <div className="flex flex-row items-center justify-around gap-90 p-0.5">
        {/* Timer */}
        <section className=" flex text-xl font-bold text-indigo-600 w-12">
          <div className='mr-3 text-pink-500'>
            DrawTime
          </div>
          <div>
            {drawTime}
          </div>

        </section>

        {/* Input */}
        <input
          type="text"
          disabled={inputDisable}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Enter your guess and press enter"
          className="border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 w-70 p-2"
        />

        {/* Start Button */}
        <button
          onClick={StartGame}
          className="px-4 py-2 text-white rounded-md font-bold"
          style={{ backgroundColor: 'oklch(65.6% 0.241 354.308)' }}
          disabled={disableStart}
        >
          Start
        </button>
      </div>

      {/* Word selection popup */}
      <section
        ref={questions}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-0.5"
      >
        <div className="flex flex-col items-center rounded-lg shadow-md p-6 space-y-4 bg-white border border-gray-300">
          <h4 className="text-xl font-semibold text-black">Select the word</h4>

          <div className="flex gap-6 mt-2">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                onClick={async () => {
                  await socket.emit("wordToGuess", { word: wordArray[random][num], room });
                  setItem(wordArray[random][num]);
                  questions.current.style.display = "none";
                }}
                className="cursor-pointer px-4 py-2 rounded-md text-black font-medium border-2 border-pink-400 border-dashed"
              >
                {wordArray[random][num]}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
