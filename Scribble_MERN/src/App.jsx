import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Join from './Components/JoinRoom/Join';
import Main from './Components/Main/Main';
export default function App() {
  return (
    <>
      <main style={{transform: "scale(0.9)",
    transformOrigin: "top left",
    width: "111.11%",}}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Join />}></Route>
            <Route path="/room" element={<Main />} />
          </Routes>
        </BrowserRouter>
      </main>
    </>
  )
}
