import { LogOut } from "lucide-react";
import axios from "axios";
import {toast, ToastContainer} from "react-toastify";
import backendLink from "../../../backendlink";
import { useEffect } from "react";

export default function Players({ name, room, playerList, socket, playerSocketId }) {
  const emojis = [
  "🤭", "🥴", "😴", "🤩", "🧐", "😅",
  "😂", "🤣", "😊", "😇", "🙂", "🙃",
  "😉", "😌", "😍", "🥰", "😘", "😗",
  "😙", "😚", "😋", "😛", "😝", "😜",
  "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "😏", "😒", "😞", "😔", "😟", "😕",
];


  const role = sessionStorage.getItem("role");
  const kickPlayer = (room, socketID) => {
    socket.emit("kickUser", { room, socketID });
  };

  let myFollowers = [];

  const handleFollowing = async (userName) =>{
    try{
      await axios.post(`${backendLink}/users/follow`, { userName, name }, { withCredentials: true });
      socket.emit("followUser", {"follower" : name, "followee" : userName, room});
      toast.success(`You are now following ${userName}`, {autoClose : 1200});
    }
    catch(error){
      toast.error(`Already following ${userName}`, {autoClose : 1200});
    }
  }

  useEffect(()=>{
    socket.on("someOneFollowed", ({follower, followee})=>{
      if(followee === name && myFollowers.includes(follower) === false){
        toast.success(`${follower} followed you`, {autoClose : 1200});
        myFollowers.push(follower);
      }
    })
    return () =>{
      socket.off("someOneFollowed");
    }
  },[socket])

  return (
    <div className="flex flex-col h-full border-4 rounded-2xl border-dashed border-pink-400  shadow-md bg-white">
      <ToastContainer/>
      {/* Players Header */}
      <div className="bg-indigo-600 text-white px-6 py-4 border-3 rounded-2xl">
        <h1 className="text-xl font-bold text-center ">Players</h1>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {[...playerList]
          .sort((a, b) => b.points - a.points)
          .map((player, index) => (
            <div
              key={index}
              className={`p-4 rounded-md text-center ${
                index % 2 === 0 ? "bg-gray-100" : "bg-green-100"
              }`}
            >
              <div className="text-lg font-semibold">
                {player.name} {emojis[index]}
                <div className="text-sm text-green-500">
                  {player.role === "admin" && <b>{player.role}</b>}
                </div>
              </div>

              <div className="text-sm text-gray-700">
                Points: <b>{player.points}</b>
              </div>

              {player.socketID !== playerSocketId && (
                <b onClick={() => {handleFollowing(player.name)}} className="hover:cursor-pointer text-sm text-pink-700">
                  Follow
                </b>
              )}

              {/* Show ready status if logged-in user is NOT admin */}
              {player.role !== "admin" ? (
                <div className="text-sm">
                  Ready:{" "}
                  <b>
                    {player.ready ? (
                      <b className="text-green-500">Yes</b>
                    ) : (
                      <b className="text-red-500">No</b>
                    )}
                  </b>
                </div>
              ) : (
                <></>
              )}

              <center
                onClick={() => kickPlayer(room, player.socketID)}
                className={`relative text-sm text-gray-700 ${
                  role !== "admin" ? "hidden" : ""
                } hover:cursor-pointer group`}
              >
                {player.role !== "admin" && (
                  <div className="relative flex items-center justify-center">
                    <LogOut color="#FF474D" strokeWidth={3} />
                    <span className="absolute -top-6 scale-0 group-hover:scale-100 transition-transform text-xs bg-gray-800 text-white px-2 py-1 rounded">
                      Kickout user
                    </span>
                  </div>
                )}
              </center>
            </div>
          ))}
      </div>
    </div>
  );
}
