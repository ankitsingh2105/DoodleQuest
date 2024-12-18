import React, { useEffect, useState, useRef } from 'react';
import "./Chat.css";

export default function Chat(props) {
  const { name, room, socket } = props;
  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);

  const sendMessage = async () => {
    console.log("messgae ::: ", message)
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
    const handleMessages = ({ name, message }) => {
      setAllMessages((currentMessages) => [...currentMessages, { name, message }]);
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
        {allMessages.slice().reverse().map((e, index) => {
          return (
            <>
              {
                index % 2 == 0 ?
                  <div className="newMessages" style={{ background: "white" }} key={index}><small><b>{e.name} :: {e.message}</b></small></div>
                  :
                  <div className="newMessages" style={{ background: "lightgreen" }} key={index}><small><b>{e.name} :: {e.message}</b></small></div>
              }
            </>
          )
        })}
      </section>
      <section className="sendChat">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          type="text"
          placeholder='Enter Message'
        />
        <button onClick={sendMessage}>Send</button>
      </section>
    </main>
  );
}
