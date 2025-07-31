import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "./Join.css"
import axios from "axios";
import { ToastContainer, toast } from "react-toastify"
import backendLink from '../../../backendlink';

const Home = () => {
    const navigate = useNavigate();
    const [navLink, setNavLink] = useState("/");
    const actions = [
        "Incoming HTTP request detected",
        "Service waking up",
        "Allocating compute resources",
        "Preparing instance for initialization",
        "Starting the instance",
        "Environment variables injected",
        "Finalizing startup",
        "Optimizing deployment",
        "App is live"
    ];

    const showMessages = async (message) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                toast.info(message, { position: "top-center", autoClose: 2500, color: "green" });
                resolve();
            }, 2500);
        })
    }
    const showStatus = async () => {
        if (sessionStorage.getItem("loading") == "true") return;
        toast.info(actions[0], { position: "top-center", autoClose: 2500 });
        toast.info("Please wait for some time before joining or creating", { position: "top-right", autoClose: 20000 });
        for (let i = 1; i < 9; i++) {
            await showMessages(actions[i]);
            sessionStorage.setItem("loading", true);
        }
    }
    // useEffect(() => {
    //     axios.get(`${backendLink}`).catch(() => {});
    //     showStatus();
    // }, [])


    const handleJoinRoom = async () => {
        const playerName = document.getElementById('playerName').value;
        const roomId = document.getElementById('roomId').value;

        if (!playerName) {
            toast.error('Please enter your name to join a room!', { autoClose: 1000 });
            return;
        }

        if (!roomId) {
            toast.error('Please enter a room ID to join!', { autoClose: 1000 });
            return;
        }

        let rooms = await axios.get(`${backendLink}/allRooms`);

        let allRoomData = rooms.data.allRooms;

        if (!allRoomData.includes(room)) {
            toast.error("No such rooms exist, plase create one", { autoClose: 1500 });
            return;
        }
        sessionStorage.setItem("role", "regular");
        navigate(`/room?roomID=${room}&name=${userName}`)
    };
    const handleCreateRoom = async () => {
        const roomId = document.getElementById('roomId').value;

        if (!playerName) {
            toast.error('Please enter your name to join a room!', { autoClose: 1000 });
            return;
        }

        if (!roomId) {
            toast.error('Please enter a room ID to join!', { autoClose: 1000 });
            return;
        }

        let rooms = await axios.get(`${backendLink}/allRooms`);

        let allRoomData = rooms.data.allRooms;

        if (allRoomData.includes(room)) {
            toast.error("Room already exists", { autoClose: 1500 });
            return;
        }
        sessionStorage.setItem("role", "admin");
        navigate(`/room?roomID=${room}&name=${userName}`)
    };

    const [userName, setuserName] = useState("")
    const [room, setroom] = useState("");

    const scrollToJoin = () => {
        const joinSection = document.getElementById('playerName');
        joinSection.scrollIntoView({ behavior: 'smooth' });
        joinSection.focus();
    };

    return (
        <div style={{
            transform: "scale(0.9)",
            transformOrigin: "top left",
            width: "111.11%",
        }} className="bg-blue-50">


            <ToastContainer />


            {/* Navigation */}
            <nav className="bg-white bg-opacity-90 backdrop-blur-sm shadow-md py-4 px-6 sticky top-0 z-50">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    {/* Left: Logo + Title */}
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-8 sm:w-10 h-8 sm:h-10 text-indigo-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            role="img"
                            aria-label="DoodleQuest logo"
                        >
                            <path d="M8.5,3A5.5,5.5 0 0,1 14,8.5C14,9.83 13.53,11.05 12.74,12H21V21H12V12.74C11.05,13.53 9.83,14 8.5,14A5.5,5.5 0 0,1 3,8.5A5.5,5.5 0 0,1 8.5,3M8.5,5A3.5,3.5 0 0,0 5,8.5A3.5,3.5 0 0,0 8.5,12A3.5,3.5 0 0,0 12,8.5A3.5,3.5 0 0,0 8.5,5Z" />
                        </svg>
                        <h1 className="text-3xl sm:text-5xl font-bold text-indigo-600">DoodleQuest</h1>
                    </div>

                    {/* Right: Link */}
                    <div className="text-center sm:text-right">
                        <a
                            className="text-lg sm:text-2xl font-bold text-pink-500"
                            href="http://ankitsinghchauhan.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Visit Ankit Chauhan's website"
                        >
                            Game by Ankit Chauhan
                        </a>
                    </div>
                </div>
            </nav>


            {/* Hero Section */}
            <section className="py-16 px-6">
                <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
                    {/* Left side */}
                    <div className="md:w-1/2">
                        <h1 className="text-4xl md:text-6xl font-bold text-indigo-800 mb-6">
                            Draw, Guess, <span className="text-pink-500 animate-wiggle2">Win!</span>
                        </h1>
                        <p className="text-xl text-gray-700 mb-8">
                            Join the ultimate multiplayer drawing and guessing game. Challenge your friends, show off your artistic skills, and have a blast!
                        </p>

                        {/* Join Form */}
                        <div className="bg-white p-6 rounded-xl shadow-md border-4 border-dashed border-indigo-500">
                            <h3 className="text-xl font-bold text-indigo-800 mb-4">Join a Game</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 mb-2" htmlFor="playerName">Your Name</label>
                                    <input onChange={(event) => setuserName(event.target.value)} type="text" id="playerName" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter your name" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2" htmlFor="roomId">Room ID</label>
                                    <input onChange={(event) => setroom(event.target.value)} type="text" id="roomId" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter room ID" />
                                </div>
                                <div className="flex gap-4">
                                    <button onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            navigate(navLink)
                                        }
                                    }}
                                        onClick={handleJoinRoom} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md">
                                        <Link style={{
                                            textDecoration: "none",
                                            color: "white",
                                            fontFamily: "Courier New', Courier, monospace"
                                        }} to={navLink} >Join Room</Link>
                                    </button>
                                    <button onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            navigate(navLink)
                                        }
                                    }}
                                        onClick={handleCreateRoom} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md">
                                        <Link style={{
                                            textDecoration: "none",
                                            color: "white",
                                            fontFamily: "Courier New', Courier, monospace"
                                        }} to={navLink} >Create Room</Link>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="md:w-1/2 relative">
                        <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-dashed border-indigo-500">
                            <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center mb-4">
                                <svg className="w-20 h-20 text-pink-500 animate-wiggle" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                </svg>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">A</div>
                                    <span className="font-medium">Ankit is drawing...</span>
                                </div>
                                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">00:45</div>
                            </div>
                            <div className="mt-4 flex gap-2 flex-wrap">
                                <div className="bg-gray-100 px-3 py-1 rounded-full">_ _ _ _ _</div>
                                <div className="bg-green-100 px-3 py-1 rounded-full text-green-800">House?</div>
                                <div className="bg-red-100 px-3 py-1 rounded-full text-red-800">Tree?</div>
                                <div className="bg-gray-100 px-3 py-1 rounded-full">Mountain?</div>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 bg-yellow-400 w-20 h-20 rounded-full flex items-center justify-center text-4xl rotate-12 shadow-lg">🎨</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-6 bg-white bg-opacity-80">
                <div className="container mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-indigo-800">How DoodleQuest Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: '✏️', title: 'Draw', desc: 'Get a word and draw it! Use your creativity to help others guess correctly.' },
                            { icon: '🔍', title: 'Guess', desc: 'Watch others draw and type your guesses quickly to earn points!' },
                            { icon: '🏆', title: 'Win', desc: 'Earn points for correct guesses and great drawings. Climb the leaderboard!' },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-md text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <span className="text-3xl">{item.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-indigo-800 mb-2">{item.title}</h3>
                                <p className="text-gray-700">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call To Action */}
            <section className=" py-16 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Show Off Your Drawing Skills?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto">Join thousands of players already enjoying DoodleQuest. Enter your name, create a room, and start playing now!</p>
                    <div className="flex justify-center">
                        <button onClick={scrollToJoin} className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-full text-lg hover:bg-gray-100 transition shadow-lg">
                            JOIN NOW!
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
