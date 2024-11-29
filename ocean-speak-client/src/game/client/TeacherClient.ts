import { io, Socket } from "socket.io-client";
import { UnderWaterScene } from "../scenes/UnderWaterScene";

export class TeacherClient {
    private socket: Socket;
    private scene: UnderWaterScene;

    constructor(scene: UnderWaterScene) {
        this.scene = scene;

        // Connect to the server
        this.socket = io("http://localhost:3000");

        

        // Listen for validated questions
        this.socket.on("validatedQuestion", (question) => {
            console.log("Received validated question:", question);
            scene.events.emit("validatedQuestion", question);
        });

        // Listen for game over
        this.socket.on("gameOver", (message) => {
            console.log("Game over message:", message);
            scene.events.emit("gameOver", message);
        });

        // Handle connection errors
        this.socket.on("connect_error", (err) => {
            console.error("Connection error:", err.message);
        });
    }

    requestQuestion(): void {
        console.log("Requesting a new question...");
        this.socket.emit("requestQuestion");
    }

    sendGameEnd(message: string): void {
        console.log("Notifying server of game end...");
        this.socket.emit("gameEnd", { playerName: this.scene.playerName, message: message });
    }

    connect(callback: (success: boolean) => void): void {
      this.socket.on("connect", () => {
          console.log("Connected to the server.");
          callback(true);
      });

      this.socket.on("connect_error", (error) => {
          console.error("Connection error:", error);
          callback(false);
      });
  }

    sendScoreUpdate(scoreData: {
      playerName: string;
      interactionScore: number;
      speechScore: number;
    }): void {
      this.socket.emit("updateScore", scoreData);
    }
}
