// Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import backendLink from "../../../backendlink";

export default function Login() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!userName || !password) {
      toast.error("Please fill in all fields", { autoClose: 1200 });
      return;
    }
    try {
      const { data } = await axios.post(
        `${backendLink}/login`,
        {
          userName,
          password,
        },
        {
          withCredentials: true,
        }
      );
      sessionStorage.setItem("user", JSON.stringify(data.user || { userName }));
      toast.success(`Welcome back, ${userName}!`, { autoClose: 1000 });
      navigate("/");
    } 
    catch (err) {
      toast.error("Login failed. Please try again.", { autoClose: 1500 });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-6">
      <ToastContainer />
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-indigo-800 mb-4">Login</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 hover:cursor-pointer"
          >
            Log In
          </button>
        </div>
        <div className="mt-4 flex justify-center align:center flex-col items-center">
          <button
            className="text-pink-500 hover:cursor-pointer mb-2 font-bold"
            onClick={() => navigate("/signup")}
          >
            Don't have an account? <span>SignUp here</span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-indigo-600 hover:cursor-pointer mb-2 font-bold"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
