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
  gameStartCountdown: number;
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

  const readOnlyText = gameState?.prompt || "Type this text to win!";
  // connect to our server
  useEffect(() => {
    const accountsArray = Array.from(accounts.entries());
    const firstAccount = accountsArray[0];
    const [id, details] = firstAccount;
    if (firstAccount) {
      setUserId(id);
      console.log("User ID", userId);
      console.log("Just ID", id);
      setUserName(details.name);
    }

    partySocketRef.current = new PartySocket({
      host: "localhost:1999", // 10.253.143.53
      room: "my-room",
      id: id,
    });

    partySocketRef.current.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);
      if (data.winner) {
        console.log("Winner", data.winner);
        console.log("User ID", userId);
        console.log(id === data.winner);
        if (data.winner === id) {
          // alert(
          //   `You have won, we are minting an NFT acheivement for you now at your wallet ${data.winner}!`
          // );
          incrementAsyncWinnerToken(id);
        }
        partySocketRef.current?.close();
        setInputText("");
      }
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
    console.log("Incrementing winner token for owner:", owner);
    incrementWinnerToken(3231, 3277, owner);
  };

  const getStyledText = () => {
    return readOnlyText.split("").map((char, index) => {
      const isCorrect = inputText[index] === char;
      return (
        <span
          key={index}
          className={isCorrect ? "correct-char" : "incorrect-char"}
        >
          {char}
        </span>
      );
    });
  };

  useEffect(() => {
    if (gameState && gameState.winner) {
    }
  }, [counter]);

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
          {gameState.winner === userId && (
            <div>We are minting your NFT, wait one moment!</div>
          )}
          )
          <button
            onClick={() => {
              setCounter(counter + 1);
            }}
          >
            Start New Game
          </button>
        </div>
      )}
      {gameState && gameState.phase === "waiting" && (
        <div className="waiting-notification">
          <h2>
            Waiting for players to join... Game will start in{" "}
            {gameState.gameStartCountdown} seconds
          </h2>
        </div>
      )}
      {gameState && gameState.phase === "playing" && (
        <div className="waiting-notification">
          <h2>Type the prompt!</h2>
        </div>
      )}
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
          <textarea
            value={
              gameState.phase === "waiting"
                ? "Game is starting soon, be ready!"
                : gameState.prompt
            }
            readOnly
            className="textbox"
            style={{ whiteSpace: "pre-wrap" }}
          />
          <div className="textbox">{getStyledText()}</div>
          <input
            type="text"
            placeholder="Enter text here"
            className="textbox"
            value={inputText}
            disabled={gameState.phase !== "playing"}
            onChange={handleInputChange}
          />
        </div>
      )}
      <Link to="/">Go back to Accounts</Link> {/* Add the Link component */}
    </div>
  );
};
