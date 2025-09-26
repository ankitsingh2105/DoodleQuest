// Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import backendLink from "../../../backendlink";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import avatar1 from "../../../public/avatar1.png";
import avatar2 from "../../../public/avatar2.png";
import avatar3 from "../../../public/avatar3.png";

export default function Dashboard() {
  const userName = useParams().userName;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [adminGames, setAdminGames] = useState([]);
  const [gamesPlayed, setGamesPlayed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhotoUrl] = useState("");
  const [showImages, setShowImages] = useState(false);

  const images = [avatar1, avatar2, avatar3];

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await axios.get(
          `${backendLink}/users/details/${userName}`,
          {
            withCredentials: true,
          }
        );
        console.log("User data:", res.data);
        setUser(res.data);
        setProfilePhotoUrl(res.data.profile_photo_url || "");
      } 
      catch (err) {
        console.error("Not authenticated", err);
        toast.error("Please log in to access dashboard");
        navigate("/login");
      } 
      finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchGamesPlayed() {
      try {
        const res = await axios.get(
          `${backendLink}/users/gamesPlayed/${userName}`,
          { withCredentials: true }
        );
        setGamesPlayed(res.data);
        setAdminGames(res.data.filter((games) => games.role === "admin"));
      } 
      catch (err) {
        console.error("Error fetching games played", err);
      }
    }
    fetchGamesPlayed();
  }, [user]);

  const handleAvatarChange = async (selectedImage) => {
    try {
      await axios.put(
        `${backendLink}/users/updateAvatar/${userName}`,
        { profile_photo_url: selectedImage },
        { withCredentials: true }
      );
      toast.success("Profile picture updated!", { autoClose: 1000 });
      setProfilePhotoUrl(selectedImage);
      setShowImages(false);
    } 
    catch (err) {
      console.error("Error updating profile picture", err);
      toast.error("Failed to update profile picture");
    }
  }

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <ToastContainer />

      {/* User Info */}
      {user && (
        <div className="mb-6 p-4 border border-pink-500 rounded-lg shadow-md">
          <div className="flex flex-column items-center space-x-6 mb-4">
            <section>
              <div>
                {profilePhoto && (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-24 h-24 rounded-full mt-2 col-span-1 md:col-span-2 border-amber-400"
                  />
                )}
              </div>
              <button
                className="text-pink-500 font-bold hover:cursor-pointer"
                onClick={() => {
                  setShowImages(!showImages);
                }}
              >
                Change Image
              </button>
              <div></div>
            </section>
            <h2 className="text-3xl font-bold text-indigo-800 mb-4">
              Welcome, {user.userName}!
            </h2>
          </div>
          {showImages && (
            <section className="border-2 border-pink-300 rounded-xl p-2 mb-4 overflow-x-auto">
              <section className="font-bold">Select Avatar</section>
              <section className="flex flex-row">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Avatar ${index + 1}`}
                    className="w-12 h-12 rounded-full m-2 border-2 border-transparent hover:border-pink-500 cursor-pointer"
                    onClick={()=>handleAvatarChange(img)}
                  />
                ))}
              </section>
            </section>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Level:</strong> {user.level}
            </p>
            <p>
              <strong>Games Played:</strong> {user.games_played}
            </p>
            <p>
              <strong>Followers:</strong> {user.number_of_followers}
            </p>
          </div>
        </div>
      )}

      {/* Admin Games Table */}
      <div className="p-4 border border-pink-500 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-indigo-600 mb-4">
          Games You Created
        </h3>
        {adminGames.length === 0 ? (
          <p>No games created yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-pink-400">
                <th className="p-2">Room</th>
                <th className="p-2">Started At</th>
              </tr>
            </thead>
            <tbody>
              {adminGames.map((game) => (
                <tr key={game.game_id} className="hover:bg-pink-50">
                  <td className="p-2 border-b border-pink-200">
                    {game.room_id || "N/A"}
                  </td>
                  <td className="p-2 border-b border-pink-200">
                    {new Date(game.joined_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Games Played Table */}
      <div className="p-4 border border-pink-500 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-indigo-600 mb-4">
          Games You Played
        </h3>
        {gamesPlayed.length === 0 ? (
          <p>No games played yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-pink-400">
                <th className="p-2">Room</th>
                <th className="p-2">Role</th>
                <th className="p-2">Game Time</th>
              </tr>
            </thead>
            <tbody>
              {gamesPlayed.map((game) => (
                <tr key={game.game_id} className="hover:bg-pink-50">
                  <td className="p-2 border-b border-pink-200">{game.room_id}</td>
                  <td className="p-2 border-b border-pink-200">{game.role}</td>
                  <td className="p-2 border-b border-pink-200">
                    {new Date(game.joined_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
