import type * as Party from "partykit/server";

interface GameState {
  phase: "waiting" | "playing" | "over";
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
      prompt: "Type this text",
      players: {},
    };
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
        // Set the game state to over
        this.gameState.phase = "over";

        // Broadcast a message indicating the winner
        this.room.broadcast(JSON.stringify({ winner: playerId }));

        // Reset the game
        this.gameState.players = {};
        this.gameState.prompt = "Type this new text";
        this.startGame();
      } else {
        // Broadcast the updated game state
        this.room.broadcast(JSON.stringify(this.gameState));
      }
    }
  }

  // when a new client connects
  onConnect(connection: Party.Connection) {
    this.gameState.players[connection.id] = { userName: "", progress: 0 };
    connection.send(JSON.stringify(this.gameState));
    // this.room.broadcast(`Welcome, ${connection.id}`);
    if (
      Object.keys(this.gameState.players).length > 1 &&
      !this.gameStartTimeout
    ) {
      this.gameStartTimeout = setTimeout(() => {
        this.startGame();
        this.gameStartTimeout = null;
      }, 30000); // 30 seconds
    }
  }

  // when a client disconnects
  onClose(connection: Party.Connection) {
    delete this.gameState.players[connection.id];
    // this.room.broadcast(`So sad! ${connection.id} left the party!`);
  }

  startGame() {
    this.gameState.phase = "playing";
    // this.room.broadcast(JSON.stringify(this.gameState));
  }
}

Server satisfies Party.Worker;
