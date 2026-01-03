import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Join.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import backendLink from "../../../backendlink";
import uniqid from "uniqid";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setuserName] = useState();
  const [room, setroom] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get(`${backendLink}/users/status`, {
          withCredentials: true,
        });

        setUser(res.data.userName);
        setuserName(res.data.userName);
      } catch (err) {
        setUser(null);
      }
    }

    checkAuth();
  }, []);

  const handleJoinRoom = async () => {
    if (!userName) {
      toast.info("Please login first", {
        autoClose: 1000,
      });
      return;
    }

    if (!room) {
      toast.error("Please enter a room ID to join!", { autoClose: 1000 });
      return;
    }
    try {
      const response = await axios.get(
        `${backendLink}/allRooms?roomID=${room}`
      );
      const existingRooms = response.data.rooms;
      if (!existingRooms.includes(room)) {
        toast.error("Room ID does not exist! Please check and try again.", {
          autoClose: 1500,
        });
        return;
      }
      try {
        await axios.post(
          `${backendLink}/users/addGame`,
          {
            userName,
            role: "normal player",
            room_id: room,
          },
          {
            withCredentials: true,
          }
        );
      } catch (error) {
        // console.log(error);
      }
      navigate(`/room?roomID=${room}&name=${userName}`);
      sessionStorage.setItem("role", "player");
    } catch (err) {
      toast.error("Error checking room existence. Please try again.", {
        autoClose: 1500,
      });
      return;
    }
  };

  const handleCreateRoom = async () => {
    if (!userName) {
      toast.info("Please login first", {
        autoClose: 1000,
      });
      return;
    }
    const roomID = uniqid();
    try {
      const response = await axios.get(
        `${backendLink}/allRooms?roomID=${roomID}`
      );
      const existingRooms = response.data.rooms;
      if (existingRooms.includes(roomID)) {
        toast.error("Room ID already taken! Please choose a different one.", {
          autoClose: 1500,
        });
        return;
      }
      try {
        await axios.post(
          `${backendLink}/users/addGame`,
          {
            userName,
            role: "admin",
            room_id: roomID,
          },
          {
            withCredentials: true,
          }
        );
      } 
      catch (error) {
        return;
      }
      navigate(`/room?roomID=${room}&name=${userName}`);
      sessionStorage.setItem("role", "admin");
    } catch (err) {
      toast.error("Error checking room existence. Please try again.", {
        autoClose: 1500,
      });
      return;
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${backendLink}/users/logout`,
        {},
        { withCredentials: true }
      );
      window.location.reload();
    } catch (err) {
      toast.error("Logout failed. Please try again.", { autoClose: 1000 });
    }
  };

  return (
    <div className="bg-blue-50">
      <ToastContainer />

      {/* Navigation */}
      <nav className="bg-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-2">
            <svg
              className="w-8 sm:w-10 h-8 sm:h-10 text-indigo-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8.5,3A5.5,5.5 0 0,1 14,8.5C14,9.83 13.53,11.05 12.74,12H21V21H12V12.74C11.05,13.53 9.83,14 8.5,14A5.5,5.5 0 0,1 3,8.5A5.5,5.5 0 0,1 8.5,3M8.5,5A3.5,3.5 0 0,0 5,8.5A3.5,3.5 0 0,0 8.5,12A3.5,3.5 0 0,0 12,8.5A3.5,3.5 0 0,0 8.5,5Z" />
            </svg>
            <h1 className="text-3xl sm:text-5xl font-bold text-indigo-600">
              DoodleQuest
            </h1>
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
              Game by Ankit
            </a>
            {user ? (
              <>
                <button
                  onClick={() => navigate(`/dashboard/${user}`)}
                  className="ml-4 text-indigo-600 font-bold p-1 pl-2 pr-2 rounded-2xl hover:cursor-pointer"
                >
                  Welcome {user}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-indigo-600 font-bold p-1 pl-2 pr-2 rounded-2xl hover:cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="ml-4 text-indigo-600 font-bold p-1 pl-2 pr-2 rounded-2xl hover:cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="ml-4 text-indigo-600 font-bold p-1 pl-2 pr-2 rounded-2xl hover:cursor-pointer"
                >
                  Signup
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Left side */}
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-6xl font-bold text-indigo-600 mb-6">
              Draw, Guess,{" "}
              <span className="text-pink-500 animate-wiggle2">Win!</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Join the ultimate multiplayer drawing and guessing game. Challenge
              your friends, show off your artistic skills, and have a blast!
            </p>

            {/* Join / create Form */}
            <div className="bg-white p-6 rounded-xl shadow-md border-4 border-dashed border-indigo-500">
              <h3 className="text-xl font-bold text-indigo-800 mb-4">
                Join a Game
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="roomId">
                    Room ID
                  </label>
                  <input
                    onChange={(event) => setroom(event.target.value)}
                    type="text"
                    id="roomId"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter room ID"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleJoinRoom}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md"
                  >
                    <div
                      style={{
                        textDecoration: "none",
                        color: "white",
                        fontFamily: "Courier New', Courier, monospace",
                      }}
                    >
                      Join Room
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <br />
            <div className="bg-white p-6 rounded-xl shadow-md border-4 border-dashed border-indigo-500">
              <h3 className="text-xl font-bold text-indigo-800 mb-4">
                Create a room
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={handleCreateRoom}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md"
                  >
                    <div
                      style={{
                        textDecoration: "none",
                        color: "white",
                        fontFamily: "Courier New', Courier, monospace",
                      }}
                    >
                      Create Room
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="md:w-1/2 relative">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-dashed border-indigo-500">
              <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center mb-4">
                <svg
                  className="w-20 h-20 text-pink-500 animate-wiggle"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                </svg>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <span className="font-medium">Ankit is drawing...</span>
                </div>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                  00:45
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  _ _ _ _ _
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-full text-green-800">
                  House?
                </div>
                <div className="bg-red-100 px-3 py-1 rounded-full text-red-800">
                  Tree?
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  Mountain?
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-2 bg-yellow-400 w-20 h-20 rounded-full flex items-center justify-center text-4xl rotate-12 shadow-lg">
              🎨
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white bg-opacity-80">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-indigo-800">
            How DoodleQuest Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "✏️",
                title: "Draw",
                desc: "Get a word and draw it! Use your creativity to help others guess correctly.",
              },
              {
                icon: "🔍",
                title: "Guess",
                desc: "Watch others draw and type your guesses quickly to earn points!",
              },
              {
                icon: "🏆",
                title: "Win",
                desc: "Earn points for correct guesses and great drawings. Climb the leaderboard!",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-md text-center"
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-indigo-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className=" py-16 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Show Off Your Drawing Skills?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of players already enjoying DoodleQuest. Enter your
            name, create a room, and start playing now!
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => {
                navigate("/login");
              }}
              className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-full text-lg hover:bg-gray-100 transition shadow-lg hover:cursor-pointer"
            >
              JOIN NOW!
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
