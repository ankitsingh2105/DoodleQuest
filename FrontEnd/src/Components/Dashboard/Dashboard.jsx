// Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import backendLink from "../../../backendlink";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Dashboard() {
  const userId = useParams().userId;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [adminGames, setAdminGames] = useState([]);
  const [gamesPlayed, setGamesPlayed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await axios.get(`${backendLink}/users/details/${userId}`, {
          withCredentials: true,
        });
        console.log("User data:", res.data);
        setUser(res.data);
      } catch (err) {
        console.error("Not authenticated", err);
        toast.error("Please log in to access dashboard");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchAdminGames() {
      try {
        const res = await axios.get(
          `${backendLink}/users/adminGames/${userId}`,
          { withCredentials: true }
        );
        setAdminGames(res.data);
      } catch (err) {
        console.error("Error fetching admin games", err);
      }
    }
    fetchAdminGames();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function fetchGamesPlayed() {
      try {
        const res = await axios.get(
          `${backendLink}/users/gamesPlayed/${userId}`,
          { withCredentials: true }
        );
        setGamesPlayed(res.data);
      } catch (err) {
        console.error("Error fetching games played", err);
      }
    }
    fetchGamesPlayed();
  }, [user]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <ToastContainer />

      {/* User Info */}
      {user && (
        <div className="mb-6 p-4 border border-pink-500 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-indigo-800 mb-4">
            Welcome, {user.userName}!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Bio:</strong> {user.bio || "No bio set"}</p>
            <p><strong>Level:</strong> {user.level}</p>
            <p><strong>Games Played:</strong> {user.games_played}</p>
            <p><strong>Followers:</strong> {user.number_of_followers}</p>
            {user.profile_photo_url && (
              <img
                src={user.profile_photo_url}
                alt="Profile"
                className="w-24 h-24 rounded-full mt-2 col-span-1 md:col-span-2"
              />
            )}
          </div>
        </div>
      )}

      {/* Admin Games Table */}
      <div className="p-4 border border-pink-500 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-indigo-600 mb-4">Your Admin Games</h3>
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
                  <td className="p-2 border-b border-pink-200">{game.room_id || "N/A"}</td>
                  <td className="p-2 border-b border-pink-200">
                    {new Date(game.started_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Games Played Table */}
      <div className="p-4 border border-pink-500 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-indigo-600 mb-4">Games You Played</h3>
        {gamesPlayed.length === 0 ? (
          <p>No games played yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-pink-400">
                <th className="p-2">Room</th>
                <th className="p-2">Role</th>
                <th className="p-2">Score</th>
                <th className="p-2">Joined At</th>
              </tr>
            </thead>
            <tbody>
              {gamesPlayed.map((game) => (
                <tr key={game.game_id} className="hover:bg-pink-50">
                  <td className="p-2 border-b border-pink-200">{game.room_id}</td>
                  <td className="p-2 border-b border-pink-200">{game.role}</td>
                  <td className="p-2 border-b border-pink-200">{game.score}</td>
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
