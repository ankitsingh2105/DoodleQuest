import React, { useEffect } from 'react'
import "./Join.css"
import { useState } from 'react';
import { Link } from "react-router-dom";
export default function Join() {
    const [userName, setuserName] = useState("")
    const [room, setroom] = useState("");
    const handleJoinRoom = () => {
        if (userName === "" || room === " ") {
            window.alert("Please fill all fields");
            return;
        }
    }
    useEffect(() => {
        localStorage.removeItem("userPresent");
    }, [])
    return (
        <>
            <center className='join_main' >
                <h1 style={{ fontSize: "70px" }}>DoodleQuest</h1>
                <h2 style={{ marginTop: "-60px" }} >"🤭", "🥴", "🥴", "🤩"</h2>
                <br />
                <h1 style={{ fontSize: "40px" }}>Join chat</h1>
                <input onChange={(event) => setuserName(event.target.value)} placeholder='Enter Name' type="text" />
                <br />
                <br />
                <input onChange={(event) => setroom(event.target.value)} type="text" placeholder='Join a room' />
                <br />
                <br />
                <button onClick={handleJoinRoom} >
                    <Link style={{
                        color: "black",
                        fontStyle: "none",
                    }} to={`/room?roomID=${room}&name=${userName}`} >Join Room</Link>
                </button>
            </center>
            <br />
        </>
    )
}
