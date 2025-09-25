import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Join from './Components/JoinRoom/Join';
import Main from './Components/Playground/Playground';
import Login from './Components/Login/Login';
import Signup from './Components/SignUp/Signup';  
import Dashboard from './Components/Dashboard/Dashboard';

export default function App() {
  return (
    <>
      <main>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Join />}></Route>
            <Route path="/room" element={<Main />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} /> 
            <Route path="/dashboard/:userId" element={<Dashboard />} /> 
          </Routes>
        </BrowserRouter>
      </main>
    </>
  )
}
