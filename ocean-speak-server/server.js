

const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: "*", // Allow all origins for testing
  },
});


const QUESTIONS = [
    { ID: 1, QUESTION: 'Click the red fish', ANSWER: 'SWIM_RED', SPEECH_ANSWER: 'RED FISH', COLOR: 'red' },
    { ID: 2, QUESTION: 'Click the blue fish', ANSWER: 'SWIM_BLUE', SPEECH_ANSWER: 'BLUE FISH', COLOR: 'blue' },
    { ID: 3, QUESTION: 'Click the orange fish', ANSWER: 'SWIM_ORANGE', SPEECH_ANSWER: 'ORANGE FISH', COLOR: 'orange' },
    { ID: 4, QUESTION: 'Click the green fish', ANSWER: 'SWIM_GREEN', SPEECH_ANSWER: 'GREEN FISH', COLOR: 'green' },
    { ID: 5, QUESTION: 'Click the globe fish', ANSWER: 'SWIM_GLOBE', SPEECH_ANSWER: 'GLOBE FISH', COLOR: 'brown' },
    { ID: 6, QUESTION: 'Click the grey fish', ANSWER: 'SWIM_GREY', SPEECH_ANSWER: 'GREY FISH', COLOR: 'grey' },
    { ID: 7, QUESTION: 'Click the purple fish', ANSWER: 'SWIM_PURPLE', SPEECH_ANSWER: 'PURPLE FISH', COLOR: 'purple' },
    { ID: 8, QUESTION: 'Click the purple plant', ANSWER: 'PLANT_PURPLE', SPEECH_ANSWER: 'PURPLE PLANT', COLOR: 'purple' },
    { ID: 9, QUESTION: 'Click the green plant', ANSWER: 'PLANT_GREEN', SPEECH_ANSWER: 'GREEN PLANT', COLOR: 'green' },
    { ID: 10, QUESTION: 'Click the blue plant', ANSWER: 'PLANT_BLUE', SPEECH_ANSWER: 'BLUE PLANT', COLOR: 'blue' },
    { ID: 11, QUESTION: 'Click the orange plant', ANSWER: 'PLANT_ORANGE', SPEECH_ANSWER: 'ORANGE PLANT', COLOR: 'orange' },
];

const games = {}; // Tracks games by socket ID
// Store student game states
const connectedStudents = {};

io.on("connection", (socket) => {
    console.log(`Student connected: ${socket.id}`);
    games[socket.id] = { isGameOver: false };

      // Initialize game state for the connected student
  connectedStudents[socket.id] = {
    playerName: null,
    interactionScore: 0,
    speechScore: 0,
    gameOver: false,
  };

  // Listen for player name and initialize their game
  socket.on("registerPlayer", (playerName) => {
    console.log(`Player registered: ${playerName}`);
    connectedStudents[socket.id].playerName = playerName;
  });

    // Handle question requests
    socket.on("requestQuestion", () => {
        if (games[socket.id].isGameOver) {
            socket.emit("gameOver", "Game has already ended.");
            return;
        }

        // Pick a random question
        const randomQuestion = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        console.log(`Sending question ID: ${randomQuestion.ID}`);
        socket.emit("validatedQuestion", randomQuestion);
    });

    // Handle game end
    socket.on("gameEnd", (data) => {
        const { playerName, message } = data;
        console.log(`Game ended for player: ${playerName || socket.id}`);
        console.log(message);
        if (games[socket.id]) {
            games[socket.id].isGameOver = true;
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`Student disconnected: ${socket.id}`);
        delete games[socket.id];
    });

      // Handle score updates from the client
  socket.on("updateScore", (scoreData) => {
    console.log(`Score update from ${scoreData.playerName || socket.id}:`, scoreData);

    // Update the student's game state
    const student = connectedStudents[socket.id];
    if (student) {
      student.interactionScore = scoreData.interactionScore;
      student.speechScore = scoreData.speechScore;

      // Check for win condition
      if (
        student.interactionScore >= 10 && // Example winning condition
        student.speechScore >= 5 // Example winning condition
      ) {
        student.gameOver = true;
        socket.emit("gameOver", `${student.playerName} wins!`);
      }
    } else {
      console.warn(`Student ${socket.id} not found in connectedStudents.`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Student disconnected: ${socket.id}`);
    delete connectedStudents[socket.id];
  });

});

console.log("Server is running on port 3000");
