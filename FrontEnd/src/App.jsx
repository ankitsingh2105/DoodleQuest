import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Join from './Components/JoinRoom/Join';
import Main from './Components/Playground/Playground';
export default function App() {
  return (
    <>
      <main>
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
