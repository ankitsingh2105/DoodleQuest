import React, { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import backendLink from "../../../backendlink";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

export default function Signup() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSignup = async () => {
    if (!userName || !email || !password || !confirm) {
      toast.error("Please fill all fields", { autoClose: 1200 });
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match", { autoClose: 1200 });
      return;
    }
    try {
      const { data } = await axios.post(`${backendLink}/login`, {
        userName,
        email,
        password,
      });
      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user || { userName, email })
      );
      toast.success("Account created! Redirecting...", { autoClose: 1200 });
      navigate("/");
    } catch (err) {
      toast.error("Signup failed. Please try again.", { autoClose: 1500 });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-6">
      <ToastContainer />
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-indigo-800 mb-4">Sign Up</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Display Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSignup}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
          >
            Sign Up
          </button>
          <div className="mt-4 flex justify-center align:center flex-col items-center">
            <button
              className="text-pink-500 hover:cursor-pointer mb-2 font-bold"
              onClick={() => navigate("/login")}
            >
              Already have an account? <span>Login here</span>
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
    </div>
  );
}
