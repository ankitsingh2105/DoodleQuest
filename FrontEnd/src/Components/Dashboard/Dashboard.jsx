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
  const [followers, setFollowers] = useState([]);

  const images = [avatar1, avatar2, avatar3];

  useEffect(() => {
    async function checkAuth() {
      try {
        await axios.get(`${backendLink}/users/status`, {
          withCredentials: true,
        });
      } catch (err) {
        navigate("/login");
        setUser(null);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await axios.get(
          `${backendLink}/users/details/${userName}`,
          {
            withCredentials: true,
          }
        );
        setUser(res.data);
        setProfilePhotoUrl(res.data.profile_photo_url || "");
      } catch (err) {
        toast.error("Please log in to access dashboard");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const res = await axios.get(
          `${backendLink}/users/followers/${userName}`,
          { withCredentials: true }
        );
        setFollowers(res.data.followers);
      } catch (err) {
        console.error("Error fetching followers", err);
      }
    };
    fetchFollowers();
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
      } catch (err) {
        console.error("Error fetching games played", err);
      }
    }
    fetchGamesPlayed();
  }, [user]);

  const handleAvatarChange = async (selectedImage) => {
    try {
      await axios.patch(
        `${backendLink}/users/updateAvatar/${userName}`,
        { profile_photo_url: selectedImage },
        { withCredentials: true }
      );
      toast.success("Profile picture updated!", { autoClose: 1000 });
      setProfilePhotoUrl(selectedImage);
      setShowImages(false);
    } catch (err) {
      console.error("Error updating profile picture", err);
      toast.error("Failed to update profile picture");
    }
  };

  if (loading) return <div className="text-center mt-10 text-pink-500 font-extrabold">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <ToastContainer />

      {/* Navigation */}
      <nav className="bg-white bg-opacity-90 sticky top-0 z-5000 p-2 mt-[-40px]">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
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
            <h1
              onClick={() => {
                navigate("/");
              }}
              className="text-2xl sm:text-3xl font-bold text-indigo-600 hover:cursor-pointer"
            >
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
              Game by Ankit Chauhan
            </a>
          </div>
        </div>
      </nav>

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
                    onClick={() => handleAvatarChange(img)}
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

      {/* Follower table */}
      <div className="p-4 border border-pink-500 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-indigo-600 mb-4">
          People following you
        </h3>
        {followers.length === 0 ? (
          <p>No followers yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-pink-400">
                <th className="p-2">Follower</th>
                <th className="p-2">Follower Profile</th>
                <th className="p-2">Followed at</th>
              </tr>
            </thead>
            <tbody>
              {followers.map((follower) => (
                <tr
                  key={follower.follower_userName}
                  className="hover:bg-pink-50"
                >
                  <td className="p-2 border-b border-pink-200">
                    {follower.follower_userName}
                  </td>
                  <td className="p-2 text-pink-500 font-bold border-b border-pink-200">
                    <a
                      href={`https://doodlequest.games/${follower.follower_userName}`}
                    >
                      Link to {`${follower.follower_userName}'s profile`}{" "}
                    </a>
                  </td>
                  <td className="p-2 border-b border-pink-200">
                    {new Date(follower.followed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
                <tr key={game.joined_at} className="hover:bg-pink-50">
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
                <tr key={game.joined_at} className="hover:bg-pink-50">
                  <td className="p-2 border-b border-pink-200">
                    {game.room_id}
                  </td>
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
