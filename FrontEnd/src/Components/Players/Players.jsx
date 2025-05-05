import React, { useEffect } from 'react';

export default function Players({ playerList }) {
  const emojis = [
    "🤭", "🥴", "🥴", "🤩", "🧐", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
    "😫", "😩", "😤", "😠", "😡", "😶‍🌫️", "😐", "😑", "😯", "😦",
    "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴",
    "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿",
    "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖",
    "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"
  ];

  return (
    <div className="flex flex-col h-full border-4 rounded-2xl border-dashed border-pink-400  shadow-md bg-white">

      {/* Players Header */}
      <div className="bg-indigo-600 text-white px-6 py-4 border-3 rounded-2xl">
        <h1 className="text-xl font-bold text-center ">Players</h1>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {[...playerList].sort((a, b) => b.points - a.points).map((player, index) => (
          <div
            key={index}
            className={`p-4 rounded-md text-center ${
              index % 2 === 0 ? 'bg-gray-100' : 'bg-green-100'
            }`}
          >
            <div className="text-lg font-semibold">
              {player.name} {emojis[index]}
            </div>
            <div className="text-sm text-gray-700">
              Points: <b>{player.points}</b>
            </div>
            <div className="text-xs text-gray-500">
              Position: {index + 1}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
