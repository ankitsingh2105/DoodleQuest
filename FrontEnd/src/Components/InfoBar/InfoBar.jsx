import React, { useRef, useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function InfoBar(props) {
  const { playerID, socket, player, name, setplayer, room, setDisableCanvas } = props;
  const [answer, setAnswer] = useState("");
  const [item, setItem] = useState("");
  const [random, setrandom] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [drawTime, setDrawTime] = useState(0);
  const [playerDrawing, setPlayerDrawing] = useState("");
  const [inputDisable, setInputDisable] = useState(false);
  const [disableStart, setStartDisable] = useState(false);
  const [disableReady, setReadyDisable] = useState(false);
  const [customDrawTime, setCustomDrawTime] = useState(25);
  const [difficulty, setDifficulty] = useState('Easy');
  const [isReady, setIsReady] = useState(false);
  const playerIDRef = useRef(playerID);

  useEffect(() => {
    playerIDRef.current = playerID;
  }, [playerID]);


  const questions = useRef(null);
  const whoDrawingNow = useRef(null);
  let correct_answer = new Audio("/correct-answer.mp3");
  let incorrect_answer = new Audio("/incorrect-answer.mp3");

  const wordArray = {
    Easy: [
      { 1: "mango", 2: "banana", 3: "cherry" },
      { 1: "lamp", 2: "elephant", 3: "fox" },
      { 1: "guitar", 2: "harp", 3: "instrument" },
      { 1: "kite", 2: "valley", 3: "lamp" },
      { 1: "tree", 2: "notebook", 3: "ocean" }
    ],
    Medium: [
      { 1: "pineapple", 2: "giraffe", 3: "trumpet" },
      { 1: "compass", 2: "kangaroo", 3: "violin" },
      { 1: "umbrella", 2: "mountain", 3: "piano" },
      { 1: "bicycle", 2: "river", 3: "flute" },
      { 1: "bridge", 2: "laptop", 3: "desert" }
    ],
    Hard: [
      { 1: "rhinoceros", 2: "saxophone", 3: "microscope" },
      { 1: "glacier", 2: "telescope", 3: "helicopter" },
      { 1: "volcano", 2: "submarine", 3: "chandelier" },
      { 1: "waterfall", 2: "skyscraper", 3: "typewriter" },
      { 1: "cathedral", 2: "spaceship", 3: "windmill" }
    ]
  };

  const role = sessionStorage.getItem("role");

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
    return new Promise((resolve) => setTimeout(resolve, customDrawTime * 1000));
  }


  useEffect(() => {
    const handleAcknowledgement = async ({ currentIteration, loopCount, customDrawTime, difficulty }) => {
      setStartDisable(true);
      setReadyDisable(true);
      setCustomDrawTime(customDrawTime);
      setDifficulty(difficulty);
      const currentPlayer = player[currentIteration];
      setrandom(Math.floor(Math.random() * 5));

      if (currentPlayer?.name === name) {
        setCountdown(5);
        setDrawTime(customDrawTime);
        whoDrawingNow.current.style.display = "none";
        questions.current.style.display = "flex";
        setInputDisable(true);
        setDisableCanvas(false);
        await chooseWordWait();
      }
      else {
        setDrawTime(customDrawTime);
        setPlayerDrawing(currentPlayer?.name || '');
        whoDrawingNow.current.style.display = "flex";
        setInputDisable(false);
        setDisableCanvas(true);
      }
    };

    socket.on('acknowledgement', handleAcknowledgement);
    return () => socket.off('acknowledgement', handleAcknowledgement);
  }, [player, name, customDrawTime]);

  const StartGame = async () => {
    let numberOfReady = 0;
    player.forEach(element => {
      if (element.ready == true) numberOfReady++;
    });
    if (numberOfReady + 1 != player.length) {
      toast.error("All players are not ready", { autoClose: 1000 });
      return;
    }
    setInputDisable(false);
    setDisableCanvas(false);
    let loopCount = player.length;
    if (loopCount == 1) {
      toast.error("Waiting for other players!", { autoClose: 1000 });
      return;
    }
    let currentIteration = 0;
    socket.emit('startGame', { currentIteration, room, customDrawTime, difficulty });

    const interval = setInterval(async () => {
      if (currentIteration < loopCount - 1) {
        currentIteration++;
        socket.emit('startGame', { currentIteration, room, customDrawTime, difficulty });
        setInputDisable(false);
        setDisableCanvas(false);
      }
      else {
        setInputDisable(false);
        setDisableCanvas(false);
        clearInterval(interval);
        socket.emit('gameOver', { room });
      }
    }, customDrawTime * 1000);
  };

  const PlayerReady = () => {
    setIsReady(!isReady);
    socket.emit("playerReady", ({ playerID, isReady, room, name }))
  }

  const handleEnter = async (e) => {
    if (e.key === 'Enter') {
      if (item === answer) {
        correct_answer.play();
        socket.emit("updatePlayerPoints", { name, drawTime, room, playerID, isReady });
        setInputDisable(true);
      }
      else {
        incorrect_answer.play();
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

    socket.on("gameOver", () => {
      setStartDisable(false);
      setReadyDisable(false);
      whoDrawingNow.current.style.display = "none";
    })

    socket.on("playerGotRightAnswer", ({ name, playerWithCorrectAnswer, drawTime }) => {
      if (playerIDRef.current === playerWithCorrectAnswer) {
        toast.success(`You got the right answer in ${drawTime}`, { autoClose: 2000 });
        correct_answer.play();
      }
      else {
        toast.success(`${name} got the right answer in ${drawTime}`, { autoClose: 2000 });
        correct_answer.play();
      }
    })

    return () => {
      socket.off('updatePlayerPoints');
      socket.off('gameOver');
      socket.off("playerGotRightAnswer")
    }
  }, [socket]);

  const handleWordSelect = (num) => {
    const selectedWord = wordArray[difficulty][random][num];
    socket.emit("wordToGuess", { word: selectedWord, room });
    setItem(selectedWord);
    questions.current.style.display = "none";
  };

  const handleTimeSubmit = (e) => {
    setCustomDrawTime(parseInt(e.target.value));
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center p-0.5 font-bold">
      <ToastContainer />

      <small ref={whoDrawingNow} className="text-gray-500 mb-2 text-lg hidden">
        {playerDrawing} is drawing...
      </small>

      {/* infobar */}

      <div className="flex flex-col sm:flex-row items-center justify-around gap-5 md:gap-80 p-0.5">
        <section className="flex text-xl font-bold text-indigo-600 items-center">
          <div className='mr-3 text-pink-500'>
            DrawTime
          </div>
          <div>
            {drawTime}
          </div>
        </section>

        <input
          type="text"
          disabled={inputDisable}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Enter your guess and press enter"
          className="font-normal border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 w-70 p-2"
        />

        {
          role == "admin" ?
            <button
              onClick={StartGame}
              className="px-4 py-2 text-white rounded-md font-bold"
              style={{ backgroundColor: 'oklch(65.6% 0.241 354.308)' }}
              disabled={disableStart}
            >
              Start
            </button>
            :
            <button
              onClick={PlayerReady}
              className="px-4 py-2 text-white rounded-md font-bold"
              style={{ backgroundColor: 'oklch(65.6% 0.241 354.308)' }}
              disabled={disableReady}
            >
              Ready
            </button>
        }

      </div>

      {/* Admin controls */}

      <div className={`flex flex-col sm:flex-row items-center justify-around p-4 rounded-2xl mt-3 w-full ${role != "admin" ? "hidden" : "bg-pink-100"} gap-5 md:gap-30`}>
        <section className="text-blue-600">
          Admin Controls
        </section>

        <section className="flex justify-center items-center gap-1">
          <div className='mr-3 text-pink-500 font-bold'>
            Set draw time
          </div>
          <div>
            <input
              type="text"
              placeholder="in seconds"
              onChange={handleTimeSubmit}
              className="w-25 p-2 border rounded-md font-normal bg-white"
            />
          </div>
        </section>

        <section className='flex justify-center items-center gap-1'>
          <div className='text-blue-600'>
            Set Difficulty
          </div>
          <select
            value={difficulty}
            onChange={handleDifficultyChange}
            className="p-2 border rounded-md font-normal bg-white"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </section>
      </div>

      <section
        ref={questions}
        className="fixed hidden top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-0.5"
      >
        <div className="flex flex-col items-center rounded-lg shadow-md p-6 space-y-4 bg-white border border-gray-300">
          <h4 className="text-xl font-semibold text-black">Select the word</h4>

          <div className="flex gap-6 mt-2">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                onClick={() => { handleWordSelect(num) }}
                className="cursor-pointer px-4 py-2 rounded-md text-black font-medium border-2 border-pink-400 border-dashed"
              >
                {wordArray[difficulty][random][num]}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}