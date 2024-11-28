import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderingSystem } from '../systems/RenderingSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { UnderWaterObjectManager } from '../managers/UnderWaterObjectManager';
import { TurnManager } from '../managers/TurnManager';
import { InputSystem } from '../systems/InputSystem';
import { ECSWorld } from '../ecs/ECSWorld';
import { DEFAULT_DIFFICULTY, QUESTIONS, BACKGROUNDS, SHADERS, PARALLAX, IMAGES, FONTS, SOUNDS, SCREEN, ROLES } from '../global/Constants';

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
    this.add.bitmapText(20, 700, FONTS.FONTS_KEYS.PIXEL_FONT, 'Interaction: 0', 24).setName('interactionScore').setDepth(300).setTint(0xFFFF00);;
    this.add.bitmapText(20, 730, FONTS.FONTS_KEYS.PIXEL_FONT, 'Speech: 0', 24).setName('speechScore').setDepth(300).setTint(0xFFFF00);
    this.questionText = this.add
      .bitmapText(this.cameras.main.centerX, 50, FONTS.FONTS_KEYS.PIXEL_FONT, '', 32)
      .setOrigin(0.5)
      .setName('questionText').setDepth(150)
      .setTint(0xFF0000);  // Set initial color to red for Teacher's turn

    this.turnText = this.add
      .bitmapText(this.cameras.main.centerX, 20, FONTS.FONTS_KEYS.PIXEL_FONT, '', 24)
      .setOrigin(0.5)
      .setName('turnText').setDepth(150).setTint(0xFF0000);  // Set initial color to red for Teacher's turn;

    this.countdownText = this.add
      .bitmapText(this.cameras.main.centerX, this.cameras.main.centerY, FONTS.FONTS_KEYS.PIXEL_FONT, '', 48)
      .setOrigin(0.5)
      .setDepth(300)
      .setVisible(false).setTint(0xFF0000); // Hidden initially

    // Preload the sprite sheet for the sound icon (assume it has frames 1 to 3)
    this.soundIcon = this.add.sprite(965, 675, IMAGES.MICS).setOrigin(0).setScale(1.5);

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
    this.gameStateSystem = new GameStateSystem();
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


    this.teacherTurn();

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number): void {
    this.world.update(delta);
    //const deltaInSeconds = delta / 1000;
  }

  teacherTurn(): void {
    this.input.enabled = false; // Disable input during Teacher's Turn
    this.updateTurnText(`Teacher ${this.teacherName} Turn`);
    this.input.setDefaultCursor('url(assets/cursor_no.png), pointer');  // Custom cursor for student

    // Show "Teacher’s Turn" announcement

    this.announceTurn(`Teacher ${this.teacherName} Turn `, () => {

      // Simulate Teacher selecting a question
      this.time.delayedCall(2000, () => {
        const questionData = this.generateValidQuestion();
        this.currentAnswer = questionData.ANSWER;
        this.questionText.setText(`${questionData.QUESTION} - SPEAK:${questionData.SPEECH_ANSWER}`); // Show the question
        this.questionText.setVisible(true);
        // Switch to Student's Turn
        this.turnManager.switchTurn();
        this.startStudentTurn(); // Start countdown before enabling interaction
      });
    });
  }

  startStudentTurn(): void {

    this.startCountdown(() => {
      // Countdown completed: enable interaction for the Student
      this.updateTurnText(`Student ${this.playerName} Turn`); // Update turn text      
      this.studentTurn();
    });
  }

  studentTurn(): void {


    const wooshSound = this.sound.add(SOUNDS.WOOSH_SOUND);
    wooshSound.play();
    // Enable input for the Student's Turn
    this.input.enabled = true;
    // Change the cursor based on the current turn
    this.input.setDefaultCursor('url(assets/cursor.png), pointer');  // Custom cursor for student


    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.Sprite) => {
      
              // If the player is not allowed to click (during cooldown), ignore the click
              if (!this.canClick) return;

              // Set the flag to false to prevent further clicks until cooldown
              this.canClick = false;
      const clickedObject =
        this.fishGroup.getChildren().find((obj) =>
          (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)
        ) ||
        this.plantGroup.getChildren().find((obj) =>
          (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)
        );


      if (clickedObject) {
        const isCorrect = this.inputSystem.handleInteraction(
          clickedObject as Phaser.GameObjects.Sprite,
          this.currentAnswer, gameObjects
        );

        if (isCorrect) {
          this.input.enabled = false; // Disable input after correct answer
          this.questionText.setVisible(false);

          // Add a countdown before switching to the Teacher's Turn
          this.startCountdownForTeacher(() => {
            this.turnManager.switchTurn();
            this.teacherTurn();
          });
        }
      }
              // After the cooldown period, allow the next click
              this.time.delayedCall(this.clickCooldownTime, () => {
                this.canClick = true;  // Allow clicks again
            });
    });

    // Handle speech input during the Student's Turn
    // this.inputSystem.handleSpeech(this.currentAnswer);
  }

  startCountdownForTeacher(onComplete: () => void): void {

    let count = 5; // Start from 5
    this.countdownText.setText(String(count)).setVisible(true);


    const tickSound = this.sound.add(SOUNDS.COUNTER_SOUND); // Ensure `tickSound` is preloaded
    tickSound.play(); // Play sound on each tick
    const countdownTimer = this.time.addEvent({
      delay: 1000, // 1 second per tick
      repeat: 4, // 5 ticks total (0-4)
      callback: () => {
        if (count > 1) {
          count--;
          this.countdownText.setText(String(count));
          tickSound.play(); // Play sound on each tick
        } else {
          // On the last tick, hide countdown and proceed to Teacher's Turn
          this.countdownText.setVisible(false);
          countdownTimer.remove(); // Stop the timer
          onComplete(); // Trigger the next action
        }
      },
    });
  }

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
          this.countdownText.setText(`Student ${this.playerName} Turn.`).setTint(0xFFFF00);
          this.turnText.setTint(0xFFFF00);
          this.questionText.setTint(0xFFFF00);
          this.soundIcon.anims.play(this.soundIconONAnimKey);

          this.time.delayedCall(1000, () => {
            this.countdownText.setVisible(false);
            onComplete();
          });
        }
      },
    });
  }

  announceTurn(turn: string, onComplete: () => void): void {
    this.countdownText.setText(turn).setVisible(true);

    this.countdownText.setTint(0xFF0000);
    this.turnText.setTint(0xFF0000);
    this.questionText.setTint(0xFF0000);
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

  updateTurnText(turn: string): void {
    this.turnText.setText(turn);
  }

  generateValidQuestion(): { ID: number; QUESTION: string; ANSWER: string; SPEECH_ANSWER: string } {
    // Filter out invalid questions where the corresponding fish/plant hasn't been created
    const validQuestions = QUESTIONS.filter(question => {
        if (question.ANSWER.includes('Fish')) {
            return this.objectManager.hasFish(question.ANSWER);  // Check if the corresponding fish exists
        } else if (question.ANSWER.includes('Plant')) {
            return this.objectManager.hasPlant(question.ANSWER);  // Check if the corresponding plant exists
        }
        return false;
    });

    // Return a random valid question
    return Phaser.Math.RND.pick(validQuestions);
}

  plantGrow(plant: Phaser.GameObjects.Sprite) {
    this.tweens.add({
      targets: plant,
      scale: plant.scale + 0.1,
      duration: 300,
    });
  }
}
