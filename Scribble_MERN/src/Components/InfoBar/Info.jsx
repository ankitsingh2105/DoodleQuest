import React, { useRef, useState, useEffect } from 'react';
import './Info.css';
import axios from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Info(props) {
  const { socket, player, name, setplayer } = props;
  const newSocket = useRef(socket.current);

  const [answer, setAnswer] = useState("");
  const [item, setItem] = useState("");
  const [random, setrandom] = useState(0);

  const [countdown, setCountdown] = useState(0);
  const [drawTime, setDrawTime] = useState(0);

  const [players, setPlayers] = useState([]);
  const [playerDrawing, setPlayerDrawing] = useState("");

  const questions = useRef(null);
  const whoDrawingNow = useRef(null);

  const [userWithGuess, setUserWithGuess] = useState("");

  const wordArray = [
    { 1: "mango", 2: "banana", 3: "cherry" },
    { 1: "lamp", 2: "elephant", 3: "fox" },
    { 1: "guitar", 2: "harp", 3: "instrument" },
    { 1: "kite", 2: "valley", 3: "lamp" },
    { 1: "tree", 2: "notebook", 3: "ocean" }
  ];


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let response = await axios.get("http://localhost:8000/userList");
        setPlayers(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUsers();
  }, [player, name]);


  // Timers

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
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 25000);
    });
  }



  useEffect(() => {
    const handleAcknowledgement = async (index) => {
      const currentPlayer = players[index];

      setrandom(Math.floor(Math.random() * 5));

      if (currentPlayer.userName === name) {
        setCountdown(5);
        setDrawTime(25);

        whoDrawingNow.current.style.display = "none";
        questions.current.style.display = "flex";
        await chooseWordWait(); // Wait for 25 seconds
        questions.current.style.display = "none";
      } else {
        setDrawTime(25);
        setPlayerDrawing(currentPlayer.userName);
        questions.current.style.display = "none";
        whoDrawingNow.current.style.display = "flex";
        whoDrawingNow.current.style.justifyContent = "center";
      }
    };

    const dummy = async () => {
      newSocket.current.on('acknowledgement', handleAcknowledgement);
    };
    dummy();

    return () => {
      newSocket.current.off('acknowledgement');
    };
  }, [players, name]);

  const StartGame = async () => {
    let loopCount = players.length;
    let currentIteration = 0;

    await newSocket.current.emit('myEvent', currentIteration);

    const interval = setInterval(async () => {
      if (currentIteration < loopCount - 1) {
        currentIteration++;
        await newSocket.current.emit('myEvent', currentIteration);
      }
      else {
        clearInterval(interval);
      }
    }, 25000);
  };



  const handleEnter = async (e) => {
    setUserWithGuess(name);
    if (e.key === 'Enter') {
      if (item === answer) {
        toast("Right Answer, points updated")
        newSocket.current.emit("updatePlayerPoints", { name, drawTime })
      }
      else {
        toast("Wrong Guess")
      }
    }
  };


  useEffect(() => {
    const handleGuesstingWord = async (info) => {
      setItem(info[0]);
    }
    newSocket.current.on("wordToGuess", handleGuesstingWord);
    return () => {
      newSocket.current.on("wordToGuess", handleGuesstingWord);
    }
  }, [item])


  useEffect(() => {
    const handleNewPlayer = async (player) => {
      let response = await axios.get("http://localhost:8000/userList");
      setplayer(response.data)
    }

    const dummy = async () => {
      newSocket.current.on('updatePlayerPoints', handleNewPlayer);
    };
    dummy();

    return () => {
      newSocket.current.off('updatePlayerPoints', handleNewPlayer);
    };
  }, [userWithGuess, newSocket.current]);


  return (
    <>
      <center className='main_Info' style={{ marginTop: "-13px" }}>

        <ToastContainer />

        <small ref={whoDrawingNow} className='whoDrawing'>{playerDrawing} is drawing...</small>

        <main className='info_Main'>

          <section className="time">
            {drawTime}
          </section>

          <section>

            <input onChange={(e) => setAnswer(e.target.value)} type="text" onKeyDown={handleEnter} placeholder='Enter your answer here' />

          </section>

          <section className='start'><button onClick={StartGame}>Start</button></section>

        </main>

        <section ref={questions} className="askQuestions" style={{ display: 'none' }}>

          <center>

            <h4>Select the word</h4>

            <small className="choosingTime">{countdown}</small>

            <span className="select">

              <div onClick={async () => {
                await newSocket.current.emit("wordToGuess", [wordArray[random]["1"]]);
                setItem(wordArray[random]["1"]);
                questions.current.style.display = "none";
              }}>
                {wordArray[random]["1"]}
              </div>

              <div onClick={async () => {
                await newSocket.current.emit("wordToGuess", [wordArray[random]["2"]]);
                setItem(wordArray[random]["2"]);
                questions.current.style.display = "none";
              }}>
                {wordArray[random]["2"]}
              </div>

              <div onClick={async () => {
                await newSocket.current.emit("wordToGuess", [wordArray[random]["3"]]);
                setItem(wordArray[random]["3"]);
                questions.current.style.display = "none";
              }}>
                {wordArray[random]["3"]}
              </div>


            </span>

          </center>

        </section>

      </center>
    </>
  );
}
