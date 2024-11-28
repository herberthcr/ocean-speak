import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderingSystem } from '../systems/RenderingSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { UnderWaterObjectManager } from '../managers/UnderWaterObjectManager';
import { TurnManager } from '../managers/TurnManager';
import { InputSystem } from '../systems/InputSystem';
import { ECSWorld } from '../ecs/ECSWorld';
import { DEFAULT_DIFFICULTY, QUESTIONS, BACKGROUNDS, SHADERS, PARALLAX, IMAGES, FONTS, SOUNDS, SCREEN, ROLES, AQUATIC_CHARACTERS, PLAYER_COLORS } from '../global/Constants';
import { useDebugValue } from 'react';

export class UnderWaterScene extends Scene {
  private world!: ECSWorld;
  private objectManager!: UnderWaterObjectManager;
  private renderingSystem!: RenderingSystem;
  public plantGroup!: Phaser.GameObjects.Group; // Plant group
  public fishGroup!: Phaser.GameObjects.Group; // Plant group
  public fishBankGroups: Phaser.GameObjects.Group[] = []; // Array of fish bank groups
  private selectedDifficulty = DEFAULT_DIFFICULTY; // Default difficulty
  private nameTextObject: Phaser.GameObjects.BitmapText;
  private playerName: string;
  private teacherName: string;
  private playerType: string;
  private gameMode: string;
  private difficulty: string;
  public gameStateSystem: GameStateSystem;
  private inputSystem: InputSystem
  private emitterParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private turnManager!: TurnManager;
  correctAnswersText: Phaser.GameObjects.BitmapText; // To display correct answers
  correctAnswers: number = 0; // Counter for correct answers
  private currentAnswer!: string;
  private turnText!: Phaser.GameObjects.BitmapText;
  private countdownText!: Phaser.GameObjects.BitmapText;
  //private micOpenText!: Phaser.GameObjects.BitmapText;
  private questionText!: Phaser.GameObjects.BitmapText;
  private soundIcon: Phaser.GameObjects.Sprite; // Sprite for the sound icon
  private soundIconONAnimKey: string = 'soundIconAnimON'; // Animation key for sound icon
  private soundIconOFFAnimKey: string = 'soundIconAnimOFF'; // Animation key for sound icon
  private canClick: boolean = true;  // Flag to track if the player can click
  private clickCooldownTime: number = 500;  // 500ms cooldown between clicks
  private achievementOffset: number = 40;  // Vertical offset between achievements
  private achievementY: number = 200;
  private simulation: boolean = false; // Flag for simulation mode
  private waitingMessageText!: Phaser.GameObjects.BitmapText;
  private maxCorrectAnswers: number = 5;  // Win condition: 5 correct answers
  private gameOver: boolean = false;  // Track if the game is over
  private interactionText!: Phaser.GameObjects.BitmapText;
  private speechPointsText!: Phaser.GameObjects.BitmapText;
  //private light : Phaser.GameObjects.Light;
  private spotlight: Phaser.GameObjects.Light;

  constructor() {
    super('UnderWaterScene');
  }


  init(data: { playerName: string, isTeacher: boolean, mode: string, difficulty: string, teacherName: string, }) {

    this.playerName = data.playerName; // Receive player name from the previous scene
    this.playerType = data.isTeacher ? ROLES.TEACHER : ROLES.STUDENT;
    this.gameMode = data.mode;
    this.difficulty = data.difficulty;
    this.teacherName = data.teacherName;
  }

  create(): void {
    this.cameras.main.fadeIn(1000, 0, 150, 200);

    // Add UI
    this.interactionText = this.add.bitmapText(20, 20, FONTS.FONTS_KEYS.PIXEL_FONT, 'Interaction: 0', 24).setName('interactionScore').setDepth(300).setTint(0xFFFF00);
    this.speechPointsText = this.add.bitmapText(20, 50, FONTS.FONTS_KEYS.PIXEL_FONT, 'Speech: 0', 24).setName('speechScore').setDepth(300).setTint(0xFFFF00);
    this.questionText = this.add
      .bitmapText(this.cameras.main.centerX, 700, FONTS.FONTS_KEYS.PIXEL_FONT, '', 24)
      .setOrigin(0.5)
      .setName('questionText').setDepth(150)
      .setTint(PLAYER_COLORS.TEACHER);  // Set initial color to red for Teacher's turn

    this.turnText = this.add
      .bitmapText(this.cameras.main.centerX, 750, FONTS.FONTS_KEYS.PIXEL_FONT, '', 24)
      .setOrigin(0.5)
      .setName('turnText').setDepth(150).setTint(PLAYER_COLORS.TEACHER);  // Set initial color to red for Teacher's turn;

    this.waitingMessageText = this.add
      .bitmapText(this.cameras.main.centerX, 20, FONTS.FONTS_KEYS.PIXEL_FONT, '', 18)
      .setOrigin(0.5)
      .setDepth(150)
      .setTint(PLAYER_COLORS.TEACHER);

    this.countdownText = this.add
      .bitmapText(this.cameras.main.centerX, this.cameras.main.centerY, FONTS.FONTS_KEYS.PIXEL_FONT, '', 48)
      .setOrigin(0.5)
      .setDepth(300)
      .setVisible(false).setTint(PLAYER_COLORS.TEACHER); // Hidden initially

    // Preload the sprite sheet for the sound icon (assume it has frames 1 to 3)
    this.soundIcon = this.add.sprite(955, 20, IMAGES.MICS).setOrigin(0).setScale(1.5).setDepth(250);

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

    this.input.enabled = true; // Re-enable input
    // Initialize the ECS World
    this.world = new ECSWorld();

    this.turnManager = new TurnManager();

    // Initialize game state system
    this.gameStateSystem = new GameStateSystem();

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
    //this.plantGroup = this.add.group();
    this.fishGroup = this.add.group(); // Create fish group
    this.plantGroup = this.add.group(); // Create plant group

    // Create the object underwater manager used to create the game objects
    this.objectManager = new UnderWaterObjectManager(this, this.world, this.selectedDifficulty);

    // Initialize the Object Manager
    //this.objectManager = new UnderWaterObjectManager(this, this.world, DIFFICULTY.EASY);

    // Creat Animations
    this.objectManager.createFishAnimations();
    this.objectManager.createPlantsAnimations();
    // Add random fishes
    this.objectManager.createRandomFishes(this.fishGroup); // Pass fishGroup here
    // Add fish and fish banks
    this.objectManager.createFishBanks(this.fishBankGroups, this.fishGroup);
    // Create plants 
    this.objectManager.createPlants(this.plantGroup);


       this.startSoloMode();  // Skip teacher's turn and start solo mode
    /*

    if (this.gameMode === 'solo') {
      this.startSoloMode();  // Skip teacher's turn and start solo mode
    } else {
      this.teacherTurn(); // Regular flow
    }*/

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number): void {
    this.world.update(delta);
    //const deltaInSeconds = delta / 1000;
  }

  startSoloMode(): void {
    // In solo mode, skip teacher turn and directly start the student's turn.
    this.updateTurnText(`Student: ${this.playerName} Turn`);
    this.updateWaitingMessage(`Waiting for ${this.playerName} to answer...`, 'student');
    this.showQuestionAndHandleInput();
  }

  showQuestionAndHandleInput(): void {
    if (this.gameOver) return; // Stop if game is over
    // Show a valid question for the student
    const questionData = this.generateValidQuestion();
    this.currentAnswer = questionData.ANSWER;
    this.questionText.setText(`${questionData.QUESTION} - SPEAK: ${questionData.SPEECH_ANSWER}`);
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
        const isCorrect = this.inputSystem.handleInteraction(clickedObject as Phaser.GameObjects.Sprite, this.currentAnswer, gameObjects);
        if (isCorrect) {
         /* this.correctAnswers++;
          if (this.correctAnswers >= this.maxCorrectAnswers) {
            this.endGame();  // End game after reaching max correct answers
          } else {
            this.showQuestionAndHandleInput();  // Show the next question
          }*/
            this.showQuestionAndHandleInput();  // Show the next question
        }
      }

      this.time.delayedCall(this.clickCooldownTime, () => {
        this.canClick = true;
      });
    });
  }

  teacherTurn(): void {
    debugger
    if (this.gameOver) return;  // Stop if game is over
    this.input.enabled = false;  // Disable input during Teacher's Turn

    this.updateTurnText(`Teacher: ${this.teacherName} Turn`);
    this.input.setDefaultCursor('url(assets/cursor_no.png), pointer');

    this.announceTurn(`Teacher ${this.teacherName} Turn `, () => {
      this.time.delayedCall(2000, () => {
        const questionData = this.generateValidQuestion();

        this.currentAnswer = questionData.ANSWER;
        this.questionText.setText(`${questionData.QUESTION} - SPEAK: ${questionData.SPEECH_ANSWER}`);
        this.questionText.setVisible(true);

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
          debugger
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

    const questionNotification = this.add.bitmapText(this.cameras.main.centerX, this.achievementY, FONTS.FONTS_KEYS.PIXEL_FONT, this.questionText.text, FONTS.FONT_SIZE_SMALL)
      .setOrigin(0.5)
      .setTint(PLAYER_COLORS.TEACHER)
      .setDepth(150);
    this.tweens.add({
      targets: questionNotification,
      scale: 1.1,
      yoyo: true,
      duration: 1000,
      repeat: -1,
    });

    this.time.delayedCall(5000, () => questionNotification.destroy());

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
          // `Play Time! ${this.getCurrentStudentName()}!.`
          this.updateWaitingMessage(message, 'student');
          this.updateDisplayMessages('student', '');
          this.countdownText.setText(`Play Time ${this.playerName}!`).setTint(PLAYER_COLORS.STUDENT);
          this.soundIcon.anims.play(this.soundIconONAnimKey);
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
    this.soundIcon.anims.play(this.soundIconOFFAnimKey);
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

      const restartingNotification = this.add.bitmapText(this.cameras.main.centerX, this.achievementY, FONTS.FONTS_KEYS.PIXEL_FONT, 'Restarting Game', FONTS.FONT_SIZE_BIG)
        .setOrigin(0.5)
        .setTint(PLAYER_COLORS.TEACHER)
        .setDepth(150);
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
    this.gameStateSystem.resetScores();
    this.correctAnswers = 0;  // Reset correct answers count
    this.questionText.setText('');  // Clear the question text
    this.turnText.setText('');  // Clear the turn text
    this.countdownText.setVisible(false);  // Hide countdown
    this.waitingMessageText.setText('');  // Clear the waiting message
    this.input.enabled = true;  // Enable input again

    this.interactionText.setText('Interaction: 0');
    this.speechPointsText.setText('Speech: 0');

/*
    if (this.gameMode === 'solo') {
      this.startSoloMode();  
    } else {
          // Reset the turn manager to the initial state (e.g., back to teacher's turn)
    this.turnManager.switchTurn();  // Set the turn to teacher

    // Start the Teacher's Turn again
    this.teacherTurn();
    }   */
    this.startSoloMode();  

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
        this.waitingMessageText.setTint(PLAYER_COLORS.TEACHER); // Red for Teacher
        break;
      case 'student':
        this.waitingMessageText.setTint(PLAYER_COLORS.STUDENT); // Yellow for Student
        break;
      default:
        this.waitingMessageText.setTint(PLAYER_COLORS.OTHER_PLAYER); // Blue for Other Players
    }
  }

  updateDisplayMessages(role: 'teacher' | 'student' | 'other' = 'student', turn: string): void {

    // Set the tint based on the role
    switch (role) {
      case 'teacher':
        this.countdownText.setText(turn).setVisible(true);
        this.countdownText.setTint(PLAYER_COLORS.TEACHER);
        this.turnText.setTint(PLAYER_COLORS.TEACHER);
        this.questionText.setTint(PLAYER_COLORS.TEACHER);
        break;
      case 'student':
        this.turnText.setTint(PLAYER_COLORS.STUDENT);
        this.questionText.setTint(PLAYER_COLORS.STUDENT);
        break;
      default:
        this.turnText.setTint(PLAYER_COLORS.OTHER_PLAYER); // Blue for Other Players
        this.questionText.setTint(PLAYER_COLORS.OTHER_PLAYER);
        break;
    }
  }

  getCurrentStudentName(): string {
    const index = this.turnManager.getCurrentStudent();
    return AQUATIC_CHARACTERS[index] || 'Student';
  }

  // Generate a valid question based on the current state
  generateValidQuestion(): { ID: number; QUESTION: string; ANSWER: string; SPEECH_ANSWER: string } {
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