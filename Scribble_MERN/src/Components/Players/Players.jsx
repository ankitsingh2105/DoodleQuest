import React, { useEffect } from 'react'
import "./Player.css"
export default function Players(props) {
  const { playerList } = props;
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
    <>
      <main className='player_main'>
        <h1>Players</h1>
        <section className="playerSection">
          {
            [...playerList].sort((a, b) => b.points - a.points).map((e, index) => {
              return (
                <>
                  {
                    index % 2 == 0 ?
                      <center style={{ background: "white" }} className='player' > <b>{e.userName}</b> {emojis[index]} <br />{e.points} <br/> #{index+1} </center>
                      :
                      <center style={{ background: "lightgreen" }} className='player' > <b>{e.userName}</b> {emojis[index]} <br />{e.points} <br/> #{index+1} </center>
                  }
                </>
              )
            })
          }
        </section>
      </main>
    </>
  )
}
