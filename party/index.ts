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

// Array of prompts
const prompts = [
  "In the high-octane world of American motorsports, Conor Daly, a fierce and determined racing driver, found an unexpected ally in Polkadot's blockspace ecosystem.",
  "Leveraging this innovative technology, Daly's team revolutionized their race strategies, using decentralized data to optimize performance and enhance communication in real-time.",
  "As engines roared and tires screeched, Daly pushed the boundaries on the track, showcasing the synergy between cutting-edge blockchain solutions and the relentless pursuit of speed, forever changing the landscape of racing.",
  "In the high-octane world of American motorsports, Conor Daly was a driving force, seamlessly blending speed with strategy on the track.",
  "One sunny afternoon, Daly's team introduced an innovative twist to their racing strategy, leveraging the Polkadot blockspace ecosystem to analyze real-time data and optimize performance.",
  "As engines roared and tires screeched around the circuit, Daly's car, now equipped with cutting-edge technology, weaved through competitors with newfound agility. This fusion of racing prowess and boundless innovation propelled Daly to the front of the pack, showcasing a thrilling new era where technology and motorsport collided, redefining the boundaries of speed and precision.",
];

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
    // Select a random prompt
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    // Set the game state prompt to the random prompt
    this.gameState.prompt = randomPrompt;
    this.gameState.phase = "playing";
  }
}

Server satisfies Party.Worker;
