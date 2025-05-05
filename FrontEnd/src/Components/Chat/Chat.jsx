import React, { useEffect, useState } from 'react';

export default function Chat({ name, room, socket }) {
  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);

  const sendMessage = async (e) => {
    if (e.key !== "Enter") return;
    if (message.trim() === "") return;

    const messageData = {
      name,
      message,
      room,
      time:
        new Date(Date.now()).getHours() +
        ":" +
        new Date(Date.now()).getMinutes(),
    };

    socket.emit("sendMessage", messageData);
    setMessage("");
  };

  useEffect(() => {
    const handleMessages = ({ name, message, time }) => {
      setAllMessages((currentMessages) => [...currentMessages, { name, message, time }]);
    };

    socket.on("receiveMessage", handleMessages);
    return () => socket.off("receiveMessage", handleMessages);
  }, [socket]);

  return (
    <div className="flex flex-col h-full  border-4 rounded-2xl border-dashed border-pink-400 shadow-md bg-white">

      {/* Chat Header */}
      <div className="bg-indigo-600 text-white px-6 py-4 border-4 rounded-2xl">
        <h1 className="text-xl font-bold">Chats</h1>
        <div className="text-sm opacity-75">Room: {room}</div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse h-96">
        {allMessages.slice().reverse().map((msg, index) => (
          <div
            key={index}
            className={`p-2 mb-1 rounded-md ${
              index % 2 === 0 ? 'bg-gray-100' : 'bg-green-100'
            } flex justify-between items-center`}
          >
            <div className="text-sm">
              <strong>{msg.name}:</strong> {msg.message}
            </div>
            <div className="text-xs text-green-600 font-bold ml-4 whitespace-nowrap">{msg.time}</div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className=" p-4">
        <div className="flex items-center">
          <input
            id="message-input"
            type="text"
            placeholder="Enter Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={sendMessage}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
