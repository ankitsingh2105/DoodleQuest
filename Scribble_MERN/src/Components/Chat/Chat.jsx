import React, { useEffect, useState, useRef } from 'react';
import "./Chat.css";

export default function Chat(props) {
  const { name, room, socket } = props;
  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);



  const sendMessage = async (e) => {
    if(e.key !== "Enter") return;
    console.log("messgae ::: ", message)
    setMessage("");
    if (message === "") return;
    const messageData = {
      name,
      message,
      room,
      time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
    };

    socket.emit("sendMessage", messageData);
  };

  useEffect(() => {
    const handleMessages = ({ name, message, time }) => {
      setAllMessages((currentMessages) => [...currentMessages, { name, message, time }]);
    };

    socket.on("receiveMessage", handleMessages);

    return () => {
      socket.off("receiveMessage", handleMessages);
    };
  }, [socket]);

  return (
    <main className='chat_main'>
      <h1>Chats</h1>
      <section className="messages">
        {allMessages.slice().reverse().map((e, index) => (
          <div
            className="newMessages"
            style={{
              background: index % 2 === 0 ? "white" : "lightgreen",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "5px",
              margin:"1px"
            }}
            key={index}
          >
            <small>
              <b>{e.name} :: {e.message}</b>
            </small>
            <small style={{ fontSize:"8px", color: "green", fontWeight:"bolder", marginLeft: "auto" }}>{e.time}</small>
          </div>
        ))}
      </section>

      <section className="sendChat">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          type="text"
          placeholder='Enter Message'
          onKeyDown={sendMessage}
        />
      </section>
    </main>
  );
}
