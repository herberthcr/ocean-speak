import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderingSystem } from '../systems/RenderingSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { UnderWaterObjectManager } from '../managers/UnderWaterObjectManager';
import { TurnManager } from '../managers/TurnManager';
import { InputSystem } from '../systems/InputSystem';
import { ECSWorld } from '../ecs/ECSWorld';
import { TextHelper } from '../global/TextHelper'
import { SCREEN, QUESTIONS, BACKGROUNDS, SHADERS, PARALLAX, IMAGES, FONTS, FISH_ANIMATIONS, PLANTS_ANIMATIONS, SOUNDS, DIFFICULTY, ROLES, AQUATIC_CHARACTERS, COLOR_THEMES, PLAYER_COLORS, DEFAULT_DIFFICULTY } from '../global/Constants';
import { useDebugValue } from 'react';

import { TeacherClient } from '../client/TeacherClient'

export class UnderWaterScene extends Scene {
  private world!: ECSWorld;
  private objectManager!: UnderWaterObjectManager;
  private renderingSystem!: RenderingSystem;
  public plantGroup!: Phaser.GameObjects.Group; // Plant group
  public fishGroup!: Phaser.GameObjects.Group; // Plant group
  public fishBankGroups: Phaser.GameObjects.Group[] = []; // Array of fish bank groups
  private playerName: string;
  private teacherName: string;
  private gameMode: string;
  private difficulty: string;
  public gameStateSystem: GameStateSystem;
  private inputSystem: InputSystem
  private emitterParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private turnManager!: TurnManager;
  correctAnswersText: Phaser.GameObjects.BitmapText; // To display correct answers
  correctAnswers: number = 0; // Counter for correct answers
  private currentAnswer!: string;
  private currentSpeech!: string;
  private soundIcon: Phaser.GameObjects.Sprite; // Sprite for the sound icon
  private soundIconONAnimKey: string = 'soundIconAnimON'; // Animation key for sound icon
  private soundIconOFFAnimKey: string = 'soundIconAnimOFF'; // Animation key for sound icon
  private canClick: boolean = true;  // Flag to track if the player can click
  private clickCooldownTime: number = 500;  // 500ms cooldown between clicks
  private achievementOffset: number = 40;  // Vertical offset between achievements
  private achievementY: number = 200;
  private simulation: boolean = false; // Flag for simulation mode
  private waitingMessageText!: Phaser.GameObjects.Text;
  private maxCorrectAnswers: number = 5;  // Win condition: 5 correct answers
  private gameOver: boolean = false;  // Track if the game is over
  private currentQuestionColor: string;
  private backButton!: Phaser.GameObjects.Image;
  private playerType: string;
  private speechRecognitionOn: string = 'off';
  // Text
  private textHelper!: TextHelper;
  private interactionText!: Phaser.GameObjects.Text;
  private speechPointsText!: Phaser.GameObjects.Text;
  private speakText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private teacherClient!: TeacherClient;

  constructor() {
    super('UnderWaterScene');
  }

  init(data: { playerName: string, isTeacher: boolean, mode: string, difficulty: string, teacherName: string, speechRecognitionOn: string }) {
    this.playerName = data.playerName;
    this.playerType = data.isTeacher ? ROLES.TEACHER : ROLES.STUDENT;
    this.gameMode = data.mode;
    this.difficulty = data.difficulty;
    this.teacherName = data.teacherName;
    this.speechRecognitionOn = data.speechRecognitionOn;
  }

  create(): void {
    this.cameras.main.fadeIn(1000, 0, 150, 200);
    this.input.enabled = true; // Re-enable input

    // Initialize the ECS World
    this.world = new ECSWorld();

    this.turnManager = new TurnManager();

    const { maxScore, maxSpeechScore } = this.getMaxScores(this.difficulty);

    // Initialize game state system
    this.gameStateSystem = new GameStateSystem(maxScore, maxSpeechScore);

    // Initialize Text helper
    this.textHelper = new TextHelper(this);

    // Initialize input system
    this.inputSystem = new InputSystem(this, this.world, this.gameStateSystem);

    // Create renderingSystem system for backgrounds, shaders, emitters and layers
    this.renderingSystem = new RenderingSystem(this, this.world);
    // Add parallax background layers
    PARALLAX.TILE_LAYERS.forEach((layer) => {
      this.renderingSystem.addParallaxLayer(layer.imageKey, 0.1, layer.depth, 1); // Slowest layer
    });
    // Add sprite-based parallax layers
    this.renderingSystem.addParallaxSprite(BACKGROUNDS.WATER_EFFECT, 50, { x: 1, y: 0 }); // Horizontal movement
    // Add a bubble emitter with a tween
    this.renderingSystem.addBubbleEmitter();
    // Add shader overlay
    this.renderingSystem.addShader(SHADERS.WATER_SHADER);

    // Register the rendering system
    this.world.addSystem(this.renderingSystem);

    // Create input system and add to the world
    const stateEntity = this.world.createEntity();
    this.world.addComponent(stateEntity, 'state', { phase: 'gameplay' });
    this.world.addSystem(this.inputSystem);

    // Create animation system and add to the world
    this.world.addSystem(new AnimationSystem(this, this.world));

    // Create the plant group and store it in the scene
    this.fishGroup = this.add.group(); // Create fish group
    this.plantGroup = this.add.group(); // Create plant group

    // Create the object underwater manager used to create the game objects, passing the difficulty configuration
    this.objectManager = new UnderWaterObjectManager(this, this.world, DIFFICULTY[this.difficulty.toUpperCase()]);

    // Creat Animations
    this.objectManager.createFishAnimations();
    this.objectManager.createPlantsAnimations();
    // Add random fishes
    this.objectManager.createRandomFishes(this.fishGroup); // Pass fishGroup here
    // Add fish and fish banks
    this.objectManager.createFishBanks(this.fishBankGroups, this.fishGroup);
    // Create plants 
    this.objectManager.createPlants(this.plantGroup);

    this.createInteractiveComponents();

    if (this.gameMode === 'solo') {
      this.startSoloMode();
    }
    else if (this.gameMode === 'simulation') {
      this.teacherTurn();
    }
    else {
      // ONLINE COMING SOON
      this.manageClientServer();
    }
    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number): void {
    this.world.update(delta);
  }


  manageClientServer(): void {
    if (!this.teacherClient) {
      this.teacherClient = new TeacherClient(this);
    }
    try {
      // Attempt to connect to the server
      this.teacherClient.connect((success: boolean) => {
        if (success) {
          // Listen for validated questions from the teacher server
          this.events.on("validatedQuestion", (question) => {
            this.validateAndHandleQuestion(question);
          });

          // Listen for game over events from the server
          this.events.on("gameOver", (message) => {
            this.endGameServer(message);
          });/*  */
        } else {
          console.error("Failed to connect to TeacherClient. Server may be down.");


         const serverNotAvailable = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2, 200, '48px', 
            `Failed to connect to Teacher Server`, 'red');
            serverNotAvailable.setOrigin(0.5, 1).setDepth(100);
          this.textHelper.AddAquaticTextEffect(serverNotAvailable);


          this.tweens.add({
            targets: serverNotAvailable,
            alpha: 0, // Gradually reduce alpha to 0
            duration: 6000, // Fade out duration
            onComplete: () => {
              this.thisIsTheEnd();
            },
          });

        }
      });

      // Request the first question
      this.teacherClient.requestQuestion();
    } catch (error) {
      console.error("Error initializing TeacherClient:", error);
      //this.showServerError(); // Graceful fallback
    }
  }

  validateAndHandleQuestion(question: {
    ID: number;
    QUESTION: string;
    ANSWER: string;
    SPEECH_ANSWER: string;
    COLOR: string;
  }): void {
    console.log("Validating received question:", question);

    // Validate the question against the current state
    if (this.isValidQuestion(question)) {
      this.handleValidatedQuestion(question);
    } else {
      console.warn("Received invalid question. Requesting a new one...");
      this.teacherClient.requestQuestion(); // Request a new question if invalid
    }
  }

  isValidQuestion(question: { QUESTION: string, ANSWER: string }): boolean {


    if (question.QUESTION.toUpperCase().includes("FISH")) {
      return this.objectManager.hasFish(FISH_ANIMATIONS[question.ANSWER]);
    } else if (question.QUESTION.toUpperCase().includes("PLANT")) {
      return this.objectManager.hasPlant(PLANTS_ANIMATIONS[question.ANSWER]);
    }
    return false;
  }

  endGameServer(message: string): void {

    // Notify the server the game has ended
    this.teacherClient.sendGameEnd(message);

    this.thisIsTheEnd();

  }

  handleValidatedQuestion(question: {
    ID: number;
    QUESTION: string;
    ANSWER: string;
    SPEECH_ANSWER: string;
    COLOR: string;
  }): void {
    console.log("Handling validated question:", question);

    if (question.QUESTION.toUpperCase().includes("FISH")) {
      this.currentAnswer = FISH_ANIMATIONS[question.ANSWER];
    } else if (question.QUESTION.toUpperCase().includes("PLANT")) {
      this.currentAnswer = PLANTS_ANIMATIONS[question.ANSWER];
    }
    //this.currentAnswer = question.ANSWER;
    this.currentSpeech = question.SPEECH_ANSWER;

    debugger
    // Update UI
    this.questionText.setText(question.QUESTION);
    this.textHelper.updateTextColor(this.questionText, question.COLOR);

    if (this.speechRecognitionOn === "on") {
      this.speakText.setText(`SPEAK: ${question.SPEECH_ANSWER}`);
      this.textHelper.updateTextColor(this.speakText, question.COLOR);
      this.speakText.setVisible(true);
      this.soundIcon.anims.play(this.soundIconONAnimKey);
      this.inputSystem.handleSpeech(this.currentSpeech);
    }
    // Enable input and handle clicks
    this.enablePlayerInput();
  }

  // Enable player's input and handle clicks
  enablePlayerInput(): void {
    debugger
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.Sprite) => {
      if (!this.canClick) return;
      this.canClick = false;

      const clickedObject =
        this.fishGroup.getChildren().find((obj) =>
          (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)
        ) ||
        this.plantGroup.getChildren().find((obj) =>
          (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)
        );

      if (clickedObject) {
        const isCorrect = this.inputSystem.handleInteraction(clickedObject as Phaser.GameObjects.Sprite, this.currentAnswer);

        if (isCorrect) {
          // Notify server about the updated score
          this.sendGameStateToServer();
          // Request the next question
          this.teacherClient.requestQuestion();
        }
      }

      this.time.delayedCall(this.clickCooldownTime, () => {
        this.canClick = true;
      });
    });
  }

  // Notify server about the game state
  sendGameStateToServer(): void {
    this.teacherClient.sendScoreUpdate({
      playerName: this.playerName,
      interactionScore: this.gameStateSystem.interactionPoints,
      speechScore: this.gameStateSystem.speechPoints,
    });
  }

  getMaxScores(difficulty: string): { maxScore: number; maxSpeechScore: number } {
    const difficultyKey = difficulty.toUpperCase() as keyof typeof DIFFICULTY;
    const selectedDifficulty = DIFFICULTY[difficultyKey];

    if (selectedDifficulty) {
      return {
        maxScore: selectedDifficulty.MAX_SCORE,
        maxSpeechScore: selectedDifficulty.MAX_SPEECH_SCORE,
      };
    }
    else {
      return {
        maxScore: DEFAULT_DIFFICULTY.MAX_SCORE,
        maxSpeechScore: DEFAULT_DIFFICULTY.MAX_SPEECH_SCORE,
      }
    };
  }

  createInteractiveComponents() {

    // Add UI
    this.interactionText = this.textHelper.createStyledText(20, 20, 200, '32px', 'Interaction: 0', TextHelper.TEXT_STYLES.default);
    this.textHelper.AddAquaticTextEffect(this.interactionText);

    this.speechPointsText = this.textHelper.createStyledText(20, 70, 200, '32px', 'Speech: 0', TextHelper.TEXT_STYLES.default);
    this.speechPointsText.setVisible(false);
    this.textHelper.AddAquaticTextEffect(this.speechPointsText)

    this.questionText = this.textHelper.createColoredText(this.cameras.main.centerX, 600, 200, '24px', '', 'pink');
    this.questionText.setName('questionText').setOrigin(0.5);
    this.textHelper.AddAquaticTextEffect(this.questionText);

    this.turnText = this.textHelper.createColoredText(this.cameras.main.centerX, 20, 200, '24px', '', 'yellow');
    this.turnText.setOrigin(0.5).setName('turnText');
    this.textHelper.AddAquaticTextEffect(this.turnText);

    this.waitingMessageText = this.textHelper.createColoredText(this.cameras.main.centerX, 730, 200, '24px', '', 'yellow');
    this.waitingMessageText.setOrigin(0.5);
    this.textHelper.AddAquaticTextEffect(this.waitingMessageText);

    this.countdownText = this.textHelper.createColoredText(this.cameras.main.centerX, this.cameras.main.centerY, 200, '48px', '4', 'pink');
    this.countdownText.setOrigin(0.5).setVisible(false);
    this.textHelper.AddAquaticTextEffect(this.countdownText);

    this.speakText = this.textHelper.createColoredText(790, 90, 200, '18px', 'Speak Placeholder', 'yellow');
    this.speakText.setVisible(false);
    this.textHelper.AddAquaticTextEffect(this.speakText);

    if (this.speechRecognitionOn === 'on') {

      this.speechPointsText.setVisible(true);

      this.soundIcon = this.add.sprite(850, 20, IMAGES.MICS).setOrigin(0).setScale(1.5).setDepth(250);

      // Add sound icon animation (from frame 1 to 3)
      this.anims.create({
        key: this.soundIconONAnimKey,
        frames: this.anims.generateFrameNumbers(IMAGES.MICS, { start: 1, end: 1 }),
        frameRate: 3,
        repeat: -1  // Loop indefinitely
      });

      // Add sound icon animation (from frame 1 to 3)
      this.anims.create({
        key: this.soundIconOFFAnimKey,
        frames: this.anims.generateFrameNumbers(IMAGES.MICS, { start: 3, end: 3 }),
        frameRate: 3,
        repeat: -1  // Loop indefinitely
      });

      this.soundIcon.anims.play(this.soundIconOFFAnimKey);
      this.add.tween({
        targets: this.soundIcon,
        scaleX: 1.6,
        scaleY: 1.6,
        ease: "Bounce", // 'Cubic', 'Elastic', 'Bounce', 'Back'
        duration: 1500,
        repeat: -1, // -1: infinity
        yoyo: false
      });
    }

    this.backButton = this.add.image(SCREEN.WIDTH - 20, SCREEN.HEIGHT - 20, IMAGES.BACK)
      .setOrigin(1)
      .setScale(2)
      .setDepth(100)
      .setInteractive();

    this.add.tween({
      targets: this.backButton,
      scaleX: 2.1,
      scaleY: 2.1,
      ease: "Bounce", // 'Cubic', 'Elastic', 'Bounce', 'Back'
      duration: 1500,
      repeat: -1, // -1: infinity
      yoyo: false
    });

    this.backButton.on(Phaser.Input.Events.POINTER_UP, () => {
      this.thisIsTheEnd();
    })
  }

  thisIsTheEnd() {
    // I have a bug restarting the scene, will change this later
    window.location.reload();
  }

  startSoloMode(): void {
    // In solo mode, skip teacher turn and directly start the student's turn.
    const turnText = `Student: ${this.playerName}`;
    this.updateTurnText(turnText);
    this.updateWaitingMessage('Play Time! Speech Time!');
    this.textHelper.updateTextColor(this.turnText, 'yellow');
    this.showQuestionAndHandleInput();
  }

  showQuestionAndHandleInput(): void {
    if (this.gameOver) return; // Stop if game is over
    // Show a valid question for the student
    const questionData = this.generateValidQuestion();

    this.currentAnswer = questionData.ANSWER;
    this.currentSpeech = questionData.SPEECH_ANSWER;

    this.currentQuestionColor = questionData.COLOR;
    this.questionText.setText(`${questionData.QUESTION}`);
    this.textHelper.updateTextColor(this.questionText, questionData.COLOR);

    if (this.speechRecognitionOn === 'on') {
      this.soundIcon.anims.play(this.soundIconONAnimKey);
      this.speakText.setVisible(true);
      this.speakText.setText(`SPEAK: ${questionData.SPEECH_ANSWER}`);
      this.textHelper.updateTextColor(this.speakText, questionData.COLOR);
      this.inputSystem.handleSpeech(this.currentSpeech);
    }

    this.questionText.setVisible(true);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.Sprite) => {
      if (!this.canClick) return;
      this.canClick = false;

      const clickedObject =
        this.fishGroup.getChildren().find((obj) =>
          (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)
        ) ||
        this.plantGroup.getChildren().find((obj) =>
          (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)
        );

      if (clickedObject) {
        const isCorrect = this.inputSystem.handleInteraction(clickedObject as Phaser.GameObjects.Sprite, this.currentAnswer);

        if (isCorrect) {
          this.showQuestionAndHandleInput();  // Show the next question
        }
      }
      this.time.delayedCall(this.clickCooldownTime, () => {
        this.canClick = true;
      });
    });
  }

  teacherTurn(): void {

    if (this.gameOver) return;  // Stop if game is over
    this.input.enabled = false;  // Disable input during Teacher's Turn

    this.updateTurnText(`Teacher: ${this.teacherName} Turn`);
    this.input.setDefaultCursor('url(assets/cursor_no.png), pointer');

    this.announceTurn(`Teacher ${this.teacherName} Turn `, () => {
      this.time.delayedCall(2000, () => {

        const questionData = this.generateValidQuestion();
        this.currentQuestionColor = questionData.COLOR;
        this.currentAnswer = questionData.ANSWER;
        this.questionText.setText(`${questionData.QUESTION}`);
        this.questionText.setVisible(true);
        this.textHelper.updateTextColor(this.questionText, questionData.COLOR);

        if (this.speechRecognitionOn === 'on') {
          this.speakText.setText(`SPEAK: ${questionData.SPEECH_ANSWER}`);
          this.textHelper.updateTextColor(this.speakText, questionData.COLOR);
          this.speakText.setVisible(true);
        }

        // Switch to Student's Turn
        this.turnManager.switchTurn();
        this.startStudentTurn();
      });
    });
  }

  startStudentTurn(): void {
    if (this.gameOver) return;  // Stop if game is over
    this.startCountdown(() => {
      this.updateTurnText(`Student: ${this.playerName} Turn`);
      this.studentTurn();
    });
  }

  studentTurn(): void {
    const wooshSound = this.sound.add(SOUNDS.WOOSH_SOUND);
    wooshSound.play();

    this.input.enabled = true;
    this.input.setDefaultCursor('url(assets/cursor.png), pointer');

    if (this.simulation) {
      // Simulate the student's answer after 3 seconds
      this.simulateStudentAnswer();
    } else {
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.Sprite) => {
        if (!this.canClick) return;
        this.canClick = false;

        const clickedObject =
          this.fishGroup.getChildren().find((obj) =>
            (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)
          ) ||
          this.plantGroup.getChildren().find((obj) =>
            (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)
          );

        if (clickedObject) {
          const isCorrect = this.inputSystem.handleInteraction(clickedObject as Phaser.GameObjects.Sprite, this.currentAnswer, gameObjects);

          if (isCorrect) {
            this.input.enabled = false;
            this.questionText.setVisible(false);
            this.startCountdownForTeacher(() => {
              this.turnManager.switchTurn();
              this.teacherTurn();
            });
          }
        }

        this.time.delayedCall(this.clickCooldownTime, () => {
          this.canClick = true;
        });
      });
    }
  }

  // Handle countdown for Teacher's Turn
  startCountdownForTeacher(onComplete: () => void): void {
    if (this.gameOver) return;
    let count = 5;
    this.countdownText.setText(String(count)).setVisible(true);
    const tickSound = this.sound.add(SOUNDS.COUNTER_SOUND);
    tickSound.play();

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        if (count > 1) {
          count--;
          this.countdownText.setText(String(count));
          tickSound.play();
        } else {
          this.countdownText.setVisible(false);
          countdownTimer.remove();
          onComplete();
        }
      },
    });
  }

  // Handle countdown for Student's Turn
  startCountdown(onComplete: () => void): void {
    let count = 5;
    this.countdownText.setText(String(count)).setVisible(true);

    const tickSound = this.sound.add(SOUNDS.COUNTER_SOUND);
    tickSound.play();

    this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(String(count));
          tickSound.play();
        } else {
          let message = 'Play Time! Speech Time!';

          this.updateWaitingMessage(message, 'student');
          this.updateDisplayMessages('student', '');
          this.countdownText.setText(`Play Time ${this.playerName}!`);
          this.textHelper.updateTextColor(this.countdownText, 'yellow');
          if (this.speechRecognitionOn === 'on') {
            this.soundIcon.anims.play(this.soundIconONAnimKey);
            this.speakText.setVisible(true);
          }

          this.time.delayedCall(1500, () => {
            this.countdownText.setVisible(false);
            onComplete();
          });
        }
      },
    });
  }

  // Method to announce the turn (teacher/student)
  announceTurn(turn: string, onComplete: () => void): void {

    this.updateWaitingMessage(`Waiting for Teacher ${this.teacherName}...`, 'teacher');
    this.updateDisplayMessages('teacher', turn);

    if (this.speechRecognitionOn === 'on') {
      this.soundIcon.anims.play(this.soundIconOFFAnimKey);
      this.speakText.setVisible(false);
    }

    const wooshSound = this.sound.add(SOUNDS.WOOSH_SOUND);
    wooshSound.play();
    this.tweens.add({
      targets: this.countdownText,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        this.countdownText.setVisible(false).setAlpha(1);
        onComplete();
      },
    });
  }


  // Simulate a student's answer with a 3-second delay and then end their turn
  simulateStudentAnswer(): void {
    this.updateWaitingMessage(`Simulating answer for ${this.getCurrentStudentName()}...`);

    this.time.delayedCall(3000, () => {
      this.input.enabled = false;  // Disable input after simulation
      this.updateWaitingMessage(`${this.getCurrentStudentName()} answered correctly!`, 'other');

      // Check if the student has won
      this.correctAnswers++;
      if (this.correctAnswers >= this.maxCorrectAnswers) {
        this.endGame();
      } else {
        this.startCountdownForTeacher(() => {
          this.turnManager.switchTurn();
          this.teacherTurn();
        });
      }
    });
  }

  // End the game when a student reaches the win condition
  endGame(): void {

    this.gameOver = true;
    this.updateWaitingMessage(`${this.getCurrentStudentName()} wins!`, 'student');
    this.questionText.setText('Game Over!');
    this.turnText.setText('');
    this.countdownText.setVisible(false);
    this.input.enabled = false;  // Disable any further input

    this.time.delayedCall(4000, () => {

      const restartingNotification = this.textHelper.createColoredText(this.cameras.main.centerX, this.achievementY, 200, '48px', 'Restarting Game', 'red');
      restartingNotification.setName('questionText').setOrigin(0.5);
      this.textHelper.AddAquaticTextEffect(restartingNotification);

      this.tweens.add({
        targets: restartingNotification,
        scale: 1.1,
        yoyo: true,
        duration: 1000,
        repeat: -1,
      });

      this.tweens.add({
        targets: restartingNotification,
        alpha: 0, // Gradually reduce alpha to 0
        duration: 4000, // Fade out duration
        onComplete: () => {
          this.restartGame(); restartingNotification.destroy();
        },
      });
    });
  }

  // Restart the game by resetting all game values and textboxes
  restartGame(): void {
    // Reset game state values
    this.gameOver = false;
    this.inputSystem.GameStart();

    this.sendGameStateToServer();
    this.gameStateSystem.resetScores();
    this.correctAnswers = 0;  // Reset correct answers count
    this.questionText.setText('');  // Clear the question text
    this.turnText.setText('');  // Clear the turn text
    this.countdownText.setVisible(false);  // Hide countdown
    this.waitingMessageText.setText('');  // Clear the waiting message
    this.input.enabled = true;  // Enable input again

    this.interactionText.setText('Interaction: 0');
    this.speechPointsText.setText('Speech: 0');


    if (this.gameMode === 'solo') {
      this.startSoloMode();
    } else if ((this.gameMode === 'simulation')) {
      // Reset the turn manager to the initial state (e.g., back to teacher's turn)
      this.turnManager.switchTurn();  // Set the turn to teacher
      // Start the Teacher's Turn again
      this.teacherTurn();
    } else {
      this.endGameServer(`${this.playerName} says: I finally rest and watch the sun rise on a grateful universe.`);
    }
  }

  updateTurnText(turn: string): void {
    this.turnText.setText(turn);
  }

  updateWaitingMessage(message: string, role: 'teacher' | 'student' | 'other' = 'student'): void {
    this.waitingMessageText.setText(message);
    this.waitingMessageText.setVisible(true);
    // Set the tint based on the role
    switch (role) {
      case 'teacher':
        this.textHelper.updateTextColor(this.waitingMessageText, 'pink');
        break;
      case 'student':
        this.textHelper.updateTextColor(this.waitingMessageText, 'yellow');
        break;
      default:
        this.textHelper.updateTextColor(this.waitingMessageText, 'blue');
    }
  }

  updateDisplayMessages(role: 'teacher' | 'student' | 'other' = 'student', turn: string): void {

    // Set the tint based on the role
    switch (role) {
      case 'teacher':
        this.countdownText.setText(turn).setVisible(true);
        this.textHelper.updateTextColor(this.countdownText, 'pink');
        this.textHelper.updateTextColor(this.turnText, 'pink');
        break;
      case 'student':
        this.textHelper.updateTextColor(this.turnText, 'yellow');
        break;
      default:
        this.textHelper.updateTextColor(this.turnText, 'blue');
        break;
    }
  }

  getCurrentStudentName(): string {
    const index = this.turnManager.getCurrentStudent();
    return AQUATIC_CHARACTERS[index] || 'Student';
  }

  // Generate a valid question based on the current state
  generateValidQuestion(): { ID: number; QUESTION: string; ANSWER: string; SPEECH_ANSWER: string; COLOR: string } {

    const validQuestions = QUESTIONS.filter((question) => {
      if (question.ANSWER.includes('Fish')) {
        return this.objectManager.hasFish(question.ANSWER);
      } else if (question.ANSWER.includes('Plant')) {
        return this.objectManager.hasPlant(question.ANSWER);
      }
      return false;
    });

    return Phaser.Math.RND.pick(validQuestions);
  }
}