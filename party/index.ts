import type * as Party from "partykit/server";
import { incrementWinnerToken } from "../src/accounts/AccountsContext";

interface GameState {
  phase: "waiting" | "playing" | "over";
  gameStartCountdown: number;
  prompt: string;

  players: {
    [connectionId: string]: {
      progress: number;
      userName: string;
    };
  };
}

export default class Server implements Party.Server {
  private gameState: GameState;
  private gameStartTimeout: NodeJS.Timeout | null = null;

  constructor(readonly room: Party.Room) {
    this.gameState = {
      phase: "waiting",
      gameStartCountdown: 10,
      prompt: "Type this text",
      players: {},
    };
  }
  onAlarm() {
    // clear all storage in this room
    this.gameState.phase = "playing";
    this.room.broadcast(JSON.stringify(this.gameState));
  }
  // when a client sends a message
  onMessage(message: string, sender: Party.Connection) {
    // Parse the message as JSON
    const { playerId, name, progress } = JSON.parse(message);

    // Find the player in the game state
    const player = this.gameState.players[playerId];

    if (player) {
      // Calculate the player's progress as a percentage of the prompt's length
      // Check if the input matches the corresponding part of the prompt
      const correctChars = progress
        .split("")
        .filter((char, index) => char === this.gameState.prompt[index]).length;
      player.userName = name;
      player.progress = (correctChars / this.gameState.prompt.length) * 100;

      // Cap the progress at 100
      if (player.progress > 100) {
        player.progress = 100;
      }

      // If the player's progress has reached 100, the game is over
      if (player.progress === 100) {
        console.log(`Player ${playerId} has won!`);
        // Set the game state to over
        this.gameState.phase = "waiting";
        this.gameState.gameStartCountdown = 30;

        // Broadcast a message indicating the winner
        this.room.broadcast(JSON.stringify({ winner: playerId }));

        // Reset the game
        this.gameState.prompt = "Type this new text";
        // for each gameState.player
        for (let playerId in this.gameState.players) {
          this.gameState.players[playerId].progress = 0;
        }
      } else {
        // Broadcast the updated game state
        this.room.broadcast(JSON.stringify(this.gameState));
      }
    }
  }

  startCountdown() {
    console.log("Starting countdown");
    console.log(
      "Number of players:",
      Object.keys(this.gameState.players).length
    );
    if (Object.keys(this.gameState.players).length > 1) {
      this.gameState.gameStartCountdown = 30; // 30 seconds
      const countdownInterval = setInterval(() => {
        console.log("Countdown:", this.gameState.gameStartCountdown);
        if (this.gameState.gameStartCountdown > 0) {
          console.log(this.gameState.gameStartCountdown);
          this.gameState.gameStartCountdown--;
          this.room.broadcast(JSON.stringify(this.gameState));
        } else {
          clearInterval(countdownInterval);
          this.startGame();
        }
      }, 1000); // 1 second
    }
  }

  clearCountdown() {
    if (this.gameStartTimeout !== null) {
      clearInterval(this.gameStartTimeout);
      this.gameStartTimeout = null;
    }
  }
  broadcastMessage() {
    setInterval(() => {
      this.gameState.gameStartCountdown--;
      if (this.gameState.gameStartCountdown === 0) {
        this.startGame();
      }
      if (this.gameState.gameStartCountdown >= 0) {
        this.room.broadcast(JSON.stringify(this.gameState)); // Broadcast the message to the server
      }
    }, 1000); // 60000 milliseconds = 1 minute
  }
  // when a new client connects
  onConnect(connection: Party.Connection) {
    console.log("New connection");
    this.gameState.players[connection.id] = { userName: "", progress: 0 };
    connection.send(JSON.stringify(this.gameState));
    this.broadcastMessage();
  }

  // when a client disconnects
  onClose(connection: Party.Connection) {
    delete this.gameState.players[connection.id];
  }

  startGame() {
    this.gameState.phase = "playing";
  }
}

Server satisfies Party.Worker;
