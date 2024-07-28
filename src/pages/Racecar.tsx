import React, { useState, useRef, useEffect } from "react";
import "./styles.css"; // Ensure this path is correct
import PartySocket from "partysocket";
import { useContext } from "react";
import {
  AccountsContextProvider,
  AccountsContext,
} from "../accounts/AccountsContext";
import { incrementWinnerToken } from "../accounts/AccountsContext";

import { Link } from "react-router-dom"; // Import Link from react-router-dom

interface Player {
  progress: number;
}

interface GameState {
  phase: string;
  prompt: string;
  winner: string;
  players: Record<string, Player>;
}
export const RacecarPage = () => {
  const [progress, setProgress] = useState([0, 0, 0, 0]);
  const [inputText, setInputText] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const { accounts } = useContext(AccountsContext);
  const partySocketRef = useRef<PartySocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [counter, setCounter] = useState(0);
  // useEffect(() => {
  //   const accountsArray = Array.from(accounts.entries());
  //   const firstAccount = accountsArray[0];

  //   if (firstAccount) {
  //     const [id, details] = firstAccount;
  //     setUserId(id);
  //     setUserName(details.name);
  //     console.log(`User ID: ${id}, User Name: ${details.name}`);
  //   }
  // }, [accounts]);

  const readOnlyText = "TEST test TEST";

  // connect to our server
  useEffect(() => {
    const accountsArray = Array.from(accounts.entries());
    const firstAccount = accountsArray[0];
    const [id, details] = firstAccount;
    if (firstAccount) {
      setUserId(id);
      setUserName(details.name);
    }

    partySocketRef.current = new PartySocket({
      host: "localhost:1999", // 10.253.143.53
      room: "my-room",
      id: id,
    });

    partySocketRef.current.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);
      setGameState(data);
      console.log(data);
    });
    JSON.stringify({ playerId: userId, playerName: userName, progress: "" });
    return () => partySocketRef.current?.close();
  }, [counter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    const correctChars = value
      .split("")
      .filter((char, index) => char === readOnlyText[index]).length;

    const progressValue = (correctChars / readOnlyText.length) * 100;
    updateProgress(tabIndex, progressValue); // Update the progress bar for the current tab

    // Send the current progress to the server
    console.log(`Sending progress: ${value}`);
    partySocketRef.current?.send(
      JSON.stringify({
        playerId: userId,
        playerName: userName,
        progress: value,
      })
    );
  };

  const updateProgress = (index: number, value: number) => {
    const newProgress = [...progress];
    newProgress[index] = value;
    setProgress(newProgress);
    localStorage.setItem("progress", JSON.stringify(newProgress));

    if (value >= 100) {
      localStorage.setItem("winner", `Player ${index + 1}`);
      setWinner(`Player ${index + 1}`);
      localStorage.setItem("tabsOpen", "1");
      setTabIndex(0);
      // Reset all progress bars
      const resetProgress = [0, 0, 0, 0];
      setProgress(resetProgress);
      localStorage.setItem("progress", JSON.stringify(resetProgress));
      console.log("Winner", `Player ${index + 1}`);
      incrementWinnerToken(3231, 3277, userId);
    }
  };

  const incrementAsyncWinnerToken = async (owner: string) => {
    incrementWinnerToken(3231, 3277, userId);
  };
  useEffect(() => {
    if (gameState && gameState.winner) {
      alert(`${gameState.winner} has won!`);
      if (gameState.winner === userId) {
        incrementAsyncWinnerToken(userId);
      }
    }
  }, [gameState?.winner, userId, counter]);

  // console.log("Game State", gameState);
  // console.log("Game State", gameState?.players);
  return (
    <div>
      <div className="title-container">
        <img
          src="/polkaTypeRacer.png"
          alt="Racecar"
          className="racecar-image"
          style={{ width: "250px", height: "250px" }}
        />
        <h1>Racecar Game</h1>
      </div>
      {gameState && gameState.winner && (
        <div className="winner-notification">
          {gameState.winner} has won!
          <button
            onClick={() => {
              setCounter(counter + 1);
              setInputText("");
            }}
          >
            Start New Game
          </button>
        </div>
      )}
      <div>Tab Index: {tabIndex + 1}</div>
      {gameState &&
        gameState.players &&
        Object.entries(gameState.players).map(([playerId, player], index) => (
          <div key={playerId} className="progress-container">
            <div className="racer-number">Racer {playerId}</div>
            <div
              id={`progress${index + 1}`}
              className="progress-bar"
              style={{ width: `${player.progress}%` }}
            ></div>
            <img
              src="/car.png"
              alt="Car"
              className="car"
              id={`car${index + 1}`}
              style={{ left: `${player.progress}%` }}
            />
          </div>
        ))}
      {gameState && gameState.players && (
        <div className="textbox-container">
          <input
            type="text"
            value={gameState.prompt}
            readOnly
            className="textbox"
          />
          <input
            type="text"
            placeholder="Enter text here"
            className="textbox"
            value={inputText}
            onChange={handleInputChange}
          />
        </div>
      )}
      <Link to="/">Go back to Accounts</Link> {/* Add the Link component */}
    </div>
  );
};
