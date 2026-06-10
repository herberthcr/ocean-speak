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
import { SCREEN, QUESTIONS, BACKGROUNDS, SHADERS, PARALLAX, IMAGES, FONTS, FISH_ANIMATIONS, PLANTS_ANIMATIONS, SOUNDS, DIFFICULTY, ROLES, AQUATIC_CHARACTERS, COLOR_THEMES, PLAYER_COLORS, DEFAULT_DIFFICULTY, SCENES, KOI_POND, KANA } from '../global/Constants';
import { useDebugValue } from 'react';
import { poolForLevel, levelConfig, levelLabel, meaningOf, MAX_LEVEL, itemByRomaji, wordsForLevel, KANA_ITEMS, VOCAB_ITEMS, type Level, type VocabItem } from '../../data/content';
import { t, currentLang } from '../../i18n/strings';
import { matchesSpeech, type KanaItem } from '../../domain/kana-matching';
import { startWord, tapKana, slotsFor, type SpellState } from '../../domain/word-spelling';
import { WORD_CARD_PREFIX } from '../../domain/progress';
import { progressStore } from '../../state/progressStore';

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
  // Komorebi koi pond
  private currentLevel: number = KOI_POND.START_LEVEL;
  private mode: 'relax' | 'time' | 'free' | 'words' = 'relax';
  // Modo palabras: current word + spelling chain + pools
  private currentWord?: VocabItem;
  private spell?: SpellState;
  private wordPool: VocabItem[] = [];
  private wordPondPool: KanaItem[] = [];
  private lastWordRomaji?: string;
  // Time mode: one persistent level budget — drains continuously, hits add time, misses cost it.
  private budgetLeftMs: number = 0;
  private budgetRunning: boolean = false;
  private budgetBarBg?: Phaser.GameObjects.Rectangle;
  private budgetBarFill?: Phaser.GameObjects.Rectangle;
  private pondInputReady: boolean = false;
  // M1b: optional ja-JP voice input (ADR-0010). Click always remains the fallback.
  private voiceOn: boolean = false;
  private recognition?: SpeechRecognition;
  // Visual juice: correct-answer streak and the pulsing halo on the target koi (early levels).
  private streak: number = 0;
  private targetGlow?: Phaser.GameObjects.Arc;
  private targetGlowSprite?: Phaser.GameObjects.Sprite;
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

  init(data: { playerName: string, isTeacher: boolean, mode: string, difficulty: string, teacherName: string, speechRecognitionOn: string, pondMode?: 'relax' | 'time' | 'free' | 'words' }) {
    this.playerName = data.playerName;
    this.playerType = data.isTeacher ? ROLES.TEACHER : ROLES.STUDENT;
    this.gameMode = data.mode;
    this.difficulty = data.difficulty;
    this.teacherName = data.teacherName;
    this.speechRecognitionOn = data.speechRecognitionOn;
    this.mode = data.pondMode ?? 'relax'; // Komorebi pond mode (ModeSelectScene)
  }

  create(): void {
    this.cameras.main.fadeIn(1000, 0, 150, 200);
    this.input.enabled = true; // Re-enable input

    // Initialize the ECS World
    this.world = new ECSWorld();

    this.turnManager = new TurnManager();

    // Komorebi koi pond is calm (ADR-0016): no abrupt game-over. Solo runs effectively endless;
    // charging the crystal is the reward, not a score race.
    const { maxScore, maxSpeechScore } = this.gameMode === 'solo'
      ? { maxScore: Number.MAX_SAFE_INTEGER, maxSpeechScore: Number.MAX_SAFE_INTEGER }
      : this.getMaxScores(this.difficulty);

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

    // Komorebi ambience: light shafts through the water, drifting petals, warm tint.
    this.createKomorebiAmbience();

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
    // plus the kana pool for the current level (koi are labelled with these kana).
    this.objectManager = new UnderWaterObjectManager(this, this.world, DIFFICULTY[this.difficulty.toUpperCase()], poolForLevel(this.currentLevel));

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
      debugger
      this.speechRecognitionOn = 'off';
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
    // Keep the target halo pinned to its koi (runs after the ECS wrote sprite positions).
    if (this.targetGlow && this.targetGlowSprite) {
      this.targetGlow.setPosition(this.targetGlowSprite.x, this.targetGlowSprite.y);
    }
    // Time mode: the level budget drains continuously while questions are live.
    if (this.mode === 'time' && this.budgetRunning && !this.gameOver) {
      this.budgetLeftMs -= delta;
      this.updateBudgetBar();
      if (this.budgetLeftMs <= 0) {
        this.onLevelTimeUp();
      }
    }
  }

  // --- Komorebi ambience (V1) -----------------------------------------------------------------

  private createKomorebiAmbience(): void {
    // Light shafts (the literal komorebi): tilted gradient beams, slowly breathing.
    [{ x: 190, rot: -0.16, a: 0.10 }, { x: 520, rot: -0.10, a: 0.07 }, { x: 830, rot: -0.20, a: 0.12 }]
      .forEach((s, i) => {
        const shaft = this.add.image(s.x, -30, 'lightShaft')
          .setOrigin(0.5, 0)
          .setRotation(s.rot)
          .setAlpha(s.a)
          .setTint(0xfff2c9)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(55);
        this.tweens.add({
          targets: shaft,
          alpha: s.a * 0.45,
          duration: 2600 + i * 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      });

    // Warm late-afternoon tint over the whole pond.
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffc98a, 0.05)
      .setOrigin(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(56);

    // Petals drifting down through the light.
    this.add.particles(0, -10, 'petal', {
      x: { min: 0, max: this.scale.width },
      lifespan: 16000,
      speedY: { min: 8, max: 20 },
      speedX: { min: -10, max: 16 },
      rotate: { start: 0, end: 240 },
      alpha: { start: 0.8, end: 0.25 },
      scale: { min: 0.7, max: 1.2 },
      frequency: 1100,
      quantity: 1,
    }).setDepth(57);
  }

  // --- Juice (V3) -------------------------------------------------------------------------------

  // Pulsing halo on one koi carrying the target kana (beginner help, levels 1–2, glyph stage).
  private attachTargetGlow(romaji: string): void {
    this.clearTargetGlow();
    const sprite = this.fishGroup.getChildren()
      .find((o) => (o as Phaser.GameObjects.Sprite).name === romaji) as Phaser.GameObjects.Sprite | undefined;
    if (!sprite) return;
    this.targetGlowSprite = sprite;
    this.targetGlow = this.add.circle(sprite.x, sprite.y, 44)
      .setStrokeStyle(3, 0xffe28a, 0.9)
      .setDepth(49);
    this.tweens.add({
      targets: this.targetGlow,
      scale: 1.18,
      alpha: 0.45,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private clearTargetGlow(): void {
    if (this.targetGlow) {
      this.tweens.killTweensOf(this.targetGlow);
      this.targetGlow.destroy();
      this.targetGlow = undefined;
    }
    this.targetGlowSprite = undefined;
  }

  // Catch celebration: bubble burst + scale punch + golden flash on the koi.
  private collectEffect(sprite: Phaser.GameObjects.Sprite): void {
    this.add.particles(sprite.x, sprite.y, IMAGES.BUBBLES, {
      frame: ['silverbubble', 'bluebubble'],
      lifespan: 900,
      speed: { min: 60, max: 140 },
      scale: { start: 0.45, end: 0 },
      gravityY: -40,
      emitting: false,
    }).setDepth(60).explode(12);

    sprite.setTint(0xfff3b0);
    this.time.delayedCall(220, () => sprite.clearTint());
    this.tweens.add({ targets: sprite, scale: 1.7, duration: 130, yoyo: true, ease: 'Power2' });
  }

  // Floating streak counter (×2, ×3…) that grows with the run.
  private showStreak(): void {
    if (this.streak < 2) return;
    const text = this.textHelper.createColoredText(
      this.cameras.main.centerX, 120, 300, '40px', `×${this.streak}`, 'gold');
    text.setOrigin(0.5).setScale(Math.min(1 + this.streak * 0.07, 1.7)).setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, y: 100, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: text, alpha: 0, y: 70, delay: 800, duration: 400,
      onComplete: () => text.destroy(),
    });
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
    this.questionText.setName('questionText').setOrigin(0.5).setFontFamily(KANA.FONT_FAMILY).setFontSize(36);
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
    // Komorebi: enter the Escriba's koi pond.
    // Relax/Time flow (ADR-0018): LESSON (row intro) → PLAY (×N per kana) → REWARD (cards).
    // Free mode: no questions — tap any koi to hear it.
    this.currentLevel = progressStore.currentLevel;
    this.updateTurnText(t('pondTitle'));
    this.textHelper.updateTextColor(this.turnText, 'yellow');
    this.interactionText.setVisible(false); // legacy HUD; progress lives in the side panel

    // Voice toggle from the side panel (ADR-0010: optional, click always works). Each pond
    // entry starts click-only; the panel mirrors that via `voice-state`.
    const onVoiceToggle = (on: boolean) => {
      this.voiceOn = on && (this.mode === 'relax' || this.mode === 'time');
      if (!this.voiceOn) {
        this.stopVoiceListening();
      } else if (this.currentAnswer) {
        const item = itemByRomaji(this.currentAnswer);
        if (item) this.startVoiceListening(item);
      }
    };
    EventBus.on('voice-toggle', onVoiceToggle);
    this.events.once('shutdown', () => {
      EventBus.off('voice-toggle', onVoiceToggle);
      this.stopVoiceListening();
    });
    EventBus.emit('voice-state', false);

    if (this.mode === 'free') {
      this.startFreeMode();
      return;
    }
    if (this.mode === 'words') {
      this.startWordsMode();
      return;
    }
    this.registerPondInput();
    this.beginLevel(false);
  }

  // --- Modo palabras (deletreo encadenado, catálogo de mini-juegos) ---------------------------

  // Tap kana in order to spell a word (す→し→すし). Completing a word earns its vocabulary card.
  // Words come from the level's cumulative pool; thin pools (early levels) fall back to the full
  // curated list, labelling the pond with all 46 kana so everything stays spellable.
  private startWordsMode(): void {
    const forLevel = wordsForLevel(this.currentLevel);
    const useLevelPool = forLevel.length >= 3;
    this.wordPool = useLevelPool ? forLevel : VOCAB_ITEMS;
    this.wordPondPool = useLevelPool ? poolForLevel(this.currentLevel) : KANA_ITEMS;

    this.objectManager.reassignKana(this.fishGroup, this.wordPondPool);
    this.updateWaitingMessage(t('wordsModeMsg'), 'student');
    EventBus.emit('row-progress', null);
    this.registerWordInput();
    this.nextWord();
  }

  private nextWord(): void {
    if (this.gameOver) return;
    const unowned = this.wordPool.filter((w) => !progressStore.isOwned(WORD_CARD_PREFIX + w.romaji));
    let candidates = unowned.length > 0 ? unowned : this.wordPool;
    // Never re-ask the word just completed back-to-back — it sounds like a glitchy repeat.
    const fresh = candidates.filter((w) => w.romaji !== this.lastWordRomaji);
    if (fresh.length > 0) candidates = fresh;
    const word = Phaser.Math.RND.pick(candidates);
    this.currentWord = word;
    this.spell = startWord(word.kana);

    // Every kana of the word must swim in the pond; relabel with a guarantee when one is missing.
    const missing = word.kanaRomaji.filter((r) => !this.objectManager.hasKana(r));
    if (missing.length > 0) {
      this.objectManager.reassignKana(this.fishGroup, this.wordPondPool, word.kanaRomaji);
    }
    this.presentWord();
  }

  private presentWord(): void {
    const word = this.currentWord;
    if (!word || !this.spell) return;
    this.input.enabled = true;
    this.renderWordSlots();
    if (this.cache.audio.exists(word.audio)) {
      this.sound.play(word.audio);
    }
    this.emitWordTarget();
  }

  private renderWordSlots(): void {
    if (!this.spell) return;
    this.questionText.setText(slotsFor(this.spell).join('  '));
    this.textHelper.updateTextColor(this.questionText, 'gold');
    this.questionText.setVisible(true);
  }

  private emitWordTarget(): void {
    const word = this.currentWord;
    if (!word || !this.spell) return;
    EventBus.emit('word-target', {
      reading: word.reading,
      romaji: word.romaji,
      meaning: meaningOf(word, currentLang()),
      audio: word.audio,
      slots: slotsFor(this.spell),
    });
  }

  private registerWordInput(): void {
    this.input.enabled = true;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.canClick || this.gameOver || !this.currentWord || !this.spell) return;
      this.canClick = false;

      const clicked = this.fishGroup.getChildren().find((obj) =>
        (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)) as Phaser.GameObjects.Sprite | undefined;
      if (clicked) {
        const item = itemByRomaji(clicked.name);
        if (item) this.handleWordTap(clicked, item);
      }
      this.time.delayedCall(this.clickCooldownTime, () => { this.canClick = true; });
    });
  }

  private handleWordTap(sprite: Phaser.GameObjects.Sprite, item: KanaItem): void {
    if (!this.currentWord || !this.spell) return;
    const { state, result } = tapKana(this.spell, item.prompt);
    this.spell = state;

    if (result === 'break') {
      // Chain broken — gentle feedback, the word restarts (never punishes, ADR-0006).
      this.streak = 0;
      this.sound.play(SOUNDS.INCORRECT_SOUND);
      this.cameras.main.shake(120, 0.002);
    } else {
      if (this.cache.audio.exists(item.audio)) {
        this.sound.play(item.audio);
      }
      this.tweens.add({ targets: sprite, scale: 1.4, duration: 140, yoyo: true, ease: 'Power1' });
    }

    this.renderWordSlots();
    this.emitWordTarget();
    if (result === 'complete') this.onWordComplete();
  }

  private onWordComplete(): void {
    const word = this.currentWord;
    if (!word) return;
    this.currentWord = undefined; // ignore taps until the next word arrives
    this.lastWordRomaji = word.romaji;
    this.streak++;
    this.showStreak();

    const awarded = progressStore.awardWordCard(word.romaji);
    this.inputSystem.growPlants(); // each completed word charges the crystal
    if (awarded) this.popWordCard(word);
    this.updateWaitingMessage(`${word.reading} — ${meaningOf(word, currentLang())}`, 'student');
    // Say the whole word once the last kana clip has finished (いいえ, not い…え)…
    this.time.delayedCall(650, () => {
      if (this.cache.audio.exists(word.audio)) this.sound.play(word.audio);
    });
    // …and only announce the next challenge after that clip has had room to breathe.
    this.time.delayedCall(
      awarded ? KOI_POND.WORD_NEXT_DELAY_CARD_MS : KOI_POND.WORD_NEXT_DELAY_MS,
      () => this.nextWord(),
    );
  }

  private popWordCard(v: VocabItem): void {
    const card = this.add.container(this.cameras.main.centerX, 200).setDepth(400);
    const bg = this.add.rectangle(0, 0, 210, 150, 0x123b52).setStrokeStyle(3, 0xffd479);
    const reading = this.add.text(0, -30, v.reading, {
      fontFamily: KANA.FONT_FAMILY, fontSize: '42px', color: '#ffffff', stroke: KANA.STROKE, strokeThickness: 4,
    }).setOrigin(0.5);
    const meaning = this.add.text(0, 24, meaningOf(v, currentLang()), {
      fontFamily: 'Arial', fontSize: '14px', color: '#9fe7ec', align: 'center', wordWrap: { width: 190 },
    }).setOrigin(0.5);
    const tag = this.add.text(0, 56, t('newWordCard'), {
      fontFamily: 'Arial', fontSize: '14px', color: '#ffd479',
    }).setOrigin(0.5);
    card.add([bg, reading, meaning, tag]);
    card.setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: card, alpha: 0, y: 150, delay: 1300, duration: 500, onComplete: () => card.destroy() });
  }

  // Free exploration: every koi is tappable; tapping plays its pronunciation and shows the
  // romaji. No questions, no progress, no reward — a sandbox to wander and listen.
  private startFreeMode(): void {
    this.objectManager.reassignKana(this.fishGroup, poolForLevel(this.currentLevel));
    this.announceFreeMode();
    this.questionText.setText(t('tapAnyKoi'));
    this.textHelper.updateTextColor(this.questionText, 'cyan');
    this.questionText.setVisible(true);
    EventBus.emit('row-progress', null);
    EventBus.emit('kana-target', {
      prompt: '', romaji: '', audio: '',
      level: this.currentLevel, label: t('modeFree'), mode: 'free', review: false,
    });

    this.input.enabled = true;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.canClick) return;
      this.canClick = false;

      const clicked = this.fishGroup.getChildren().find((obj) =>
        (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y));
      if (clicked) {
        const item = itemByRomaji((clicked as Phaser.GameObjects.Sprite).name);
        if (item) {
          this.inputSystem.displayFeedback(clicked as Phaser.GameObjects.Sprite, true, false, item.romaji, item.audio);
          EventBus.emit('kana-target', {
            prompt: item.prompt, romaji: item.romaji, audio: item.audio,
            level: this.currentLevel, label: t('modeFree'), mode: 'free', review: false,
          });
        }
      }
      this.time.delayedCall(this.clickCooldownTime, () => { this.canClick = true; });
    });
  }

  private announceFreeMode(): void {
    this.updateWaitingMessage(t('freeModeMsg'), 'student');
  }

  // Level entry ritual: optional camera fade, fresh koi labels (new row guaranteed on the pond),
  // then the row lesson. Play resumes when the lesson closes.
  private beginLevel(withFade: boolean): void {
    this.input.enabled = false;
    this.currentAnswer = '';
    this.questionText.setText('');
    this.clearQuestionTimer();
    // Fresh time budget for the level (the clock arms on the "¡A pescar!" button).
    this.budgetLeftMs = KOI_POND.TIME_BUDGET.START_MS;
    this.budgetRunning = false;
    this.updateBudgetBar();

    const cfg = levelConfig(this.currentLevel);
    const relabel = () => {
      this.objectManager.reassignKana(this.fishGroup, poolForLevel(this.currentLevel), cfg.adds);
      this.announceLevel();
    };

    if (withFade) {
      this.cameras.main.fadeOut(300, 5, 19, 31);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        relabel();
        this.cameras.main.fadeIn(300, 5, 19, 31);
        this.cameras.main.once('camerafadeincomplete', () => this.openLesson(cfg));
      });
    } else {
      relabel();
      this.openLesson(cfg);
    }
  }

  // The pond keeps animating behind the lesson (only its input is disabled, no pause).
  private openLesson(cfg: Level): void {
    const items = cfg.adds
      .map((r) => itemByRomaji(r))
      .filter((i): i is KanaItem => Boolean(i));
    this.scene.launch(SCENES.LESSON, { level: cfg.level, label: levelLabel(cfg, currentLang()), items });
    this.events.once('lesson-done', () => {
      cfg.adds.forEach((r) => progressStore.markTaught(r)); // the lesson IS the teach-first beat
      this.input.enabled = true;
      // Time mode: the level clock arms exactly when the player presses "¡A pescar!" and runs
      // continuously until the level ends (overlays freeze it by pausing the scene).
      if (this.mode === 'time') {
        this.ensureBudgetBar();
        this.budgetRunning = true;
      }
      this.nextKanaQuestion();
    });
  }

  private repeatLevel(): void {
    progressStore.resetMasteryFor(levelConfig(this.currentLevel).adds);
    this.beginLevel(true);
  }

  // Mirror the new row's mastery pips to the HTML side panel.
  private emitRowProgress(): void {
    const cfg = levelConfig(this.currentLevel);
    EventBus.emit('row-progress', {
      level: cfg.level,
      label: cfg.label,
      threshold: cfg.correctPerKana,
      row: cfg.adds.map((r) => ({
        prompt: itemByRomaji(r)?.prompt ?? r,
        romaji: r,
        mastery: Math.min(progressStore.masteryOf(r), cfg.correctPerKana),
        isTarget: r === this.currentAnswer,
      })),
    });
  }

  // Register the koi click handler exactly once (reused across questions and levels).
  private registerPondInput(): void {
    if (this.pondInputReady) return;
    this.pondInputReady = true;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || !this.canClick || !this.currentAnswer) return;
      this.canClick = false;

      const clicked =
        this.fishGroup.getChildren().find((obj) =>
          (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y)) ||
        this.plantGroup.getChildren().find((obj) =>
          (obj as Phaser.GameObjects.Sprite).getBounds().contains(pointer.x, pointer.y));

      if (clicked) {
        const isCorrect = this.inputSystem.handleInteraction(clicked as Phaser.GameObjects.Sprite, this.currentAnswer);
        if (isCorrect) {
          this.collectEffect(clicked as Phaser.GameObjects.Sprite);
          this.onCorrectAnswer();
        } else {
          this.streak = 0;
          // Time mode: a wrong tap costs budget (the crystal still never discharges).
          if (this.mode === 'time') {
            this.budgetLeftMs = Math.max(0, this.budgetLeftMs - KOI_POND.TIME_BUDGET.MISS_PENALTY_MS);
            this.updateBudgetBar();
          }
        }
      }

      this.time.delayedCall(this.clickCooldownTime, () => { this.canClick = true; });
    });
  }

  // Correct taps needed to master a kana (and earn its card) at the current level.
  private threshold(): number {
    return levelConfig(this.currentLevel).correctPerKana;
  }

  // Next kana to ask. Usually a not-yet-mastered kana from this level's new row; ~1 in 5 times
  // an interleaved review of a mastered kana from an earlier row (SRS-lite). Null when every
  // new-row kana is mastered (the level is complete) — review never blocks completion.
  private pickTarget(): { item: KanaItem; review: boolean } | null {
    const th = this.threshold();
    const cfg = levelConfig(this.currentLevel);
    const rowCandidates = cfg.adds
      .filter((r) => progressStore.masteryOf(r) < th && this.objectManager.hasKana(r))
      .map((r) => itemByRomaji(r))
      .filter((i): i is KanaItem => Boolean(i));
    if (rowCandidates.length === 0) return null;

    const reviewPool = progressStore
      .reviewCandidates(poolForLevel(this.currentLevel).map((i) => i.romaji), cfg.adds, th)
      .filter((r) => this.objectManager.hasKana(r))
      .map((r) => itemByRomaji(r))
      .filter((i): i is KanaItem => Boolean(i));
    if (reviewPool.length > 0 && Phaser.Math.RND.frac() < KOI_POND.REVIEW_CHANCE) {
      return { item: Phaser.Math.RND.pick(reviewPool), review: true };
    }
    return { item: Phaser.Math.RND.pick(rowCandidates), review: false };
  }

  private nextKanaQuestion(): void {
    if (this.gameOver) return;
    this.clearQuestionTimer();

    const target = this.pickTarget();
    if (!target) { this.onLevelComplete(); return; }
    const { item, review } = target;
    this.currentAnswer = item.romaji;

    if (!progressStore.isTaught(item.romaji)) {
      this.input.enabled = false;          // hand off to the teach overlay
      this.scene.pause();
      this.scene.launch(SCENES.TEACH, { item });
      this.events.once('teach-done', (taughtItem: KanaItem) => {
        progressStore.markTaught(taughtItem.romaji);
        this.presentQuestion(item, review);
      });
    } else {
      this.presentQuestion(item, review);
    }
  }

  // Pose the challenge and mirror it to the HTML card. Recognition stage shows the glyph
  // ("Toca か"); recall stage hides it and cues by sound/romaji ("¿Cuál suena 'ka'?").
  // In Time mode the per-question countdown starts here.
  private presentQuestion(item: KanaItem, review: boolean = false): void {
    if (this.gameOver) return;
    this.input.enabled = true;

    const recall = progressStore.isRecallStage(item.romaji, KOI_POND.RECALL_AFTER_TAPS);

    EventBus.emit('kana-target', {
      prompt: item.prompt,
      romaji: item.romaji,
      audio: item.audio,
      level: this.currentLevel,
      label: levelLabel(levelConfig(this.currentLevel), currentLang()),
      mode: recall ? 'recall' : 'glyph',
      review,
    });

    this.questionText.setText(recall
      ? `${t('whichSoundsA')}${item.romaji}${t('whichSoundsB')}`
      : `${t('tap')}  ${item.prompt}`);
    this.textHelper.updateTextColor(this.questionText, review ? 'cyan' : 'pink');
    this.questionText.setVisible(true);
    this.emitRowProgress();

    // Beginner help: halo one matching koi while the glyph is still shown (levels 1–2).
    if (!recall && this.currentLevel <= 2) {
      this.attachTargetGlow(item.romaji);
    }

    if (this.cache.audio.exists(item.audio)) {
      this.sound.play(item.audio);
    }

    if (this.voiceOn) {
      this.startVoiceListening(item);
    }
  }

  // --- M1b: ja-JP voice input -----------------------------------------------------------------

  // Listen continuously while this question is active, re-arming after each utterance. Saying the
  // target kana collects ALL matching koi (AoE — voice is powerful, ADR-0010). Interim results
  // are surfaced to the panel as live feedback ("escuchando" + what the recognizer heard), so the
  // player can see it IS hearing them even on a miss. Transient errors (silence, network) just
  // re-arm; only a denied/missing mic disables voice. Click is always the fallback.
  private startVoiceListening(item: KanaItem): void {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    this.stopVoiceListening();

    const rec = new Ctor();
    this.recognition = rec;
    rec.lang = 'ja-JP';
    rec.interimResults = true;   // live transcript for visual feedback
    rec.continuous = true;
    rec.maxAlternatives = 5;
    let fatal = false;

    rec.onstart = () => {
      if (this.recognition === rec) EventBus.emit('voice-listening', true);
    };
    // Megaphone lights up while the player is actually speaking.
    rec.onspeechstart = () => { if (this.recognition === rec) EventBus.emit('voice-speaking', true); };
    rec.onspeechend = () => { if (this.recognition === rec) EventBus.emit('voice-speaking', false); };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (this.currentAnswer !== item.romaji || this.gameOver) return;
      let heard = '';
      let matched = false;
      let hasFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) hasFinal = true;
        for (let a = 0; a < result.length; a++) {
          if (a === 0) heard += result[a].transcript; // best guess for display
          if (matchesSpeech(result[a].transcript, item)) matched = true;
        }
      }
      heard = heard.trim();

      if (matched) {
        EventBus.emit('voice-heard', '');
        EventBus.emit('voice-speaking', false);
        this.collectAllMatching(item);
        this.onCorrectAnswer();
        return;
      }

      if (hasFinal && heard) {
        // A complete utterance that didn't match → clear "didn't get it" feedback (no penalty).
        EventBus.emit('voice-miss', heard);
        this.sound.play(SOUNDS.INCORRECT_SOUND);
        this.streak = 0;
      } else {
        EventBus.emit('voice-heard', heard); // live interim transcript
      }
    };

    rec.onerror = (e) => {
      // Permanent failures: turn voice off and tell the panel. Everything else is transient.
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed' || e?.error === 'audio-capture') {
        fatal = true;
        this.voiceOn = false;
        EventBus.emit('voice-state', false);
        EventBus.emit('voice-denied', true);
      }
    };

    rec.onend = () => {
      if (!fatal && this.voiceOn && this.recognition === rec
        && this.currentAnswer === item.romaji && !this.gameOver) {
        try { rec.start(); } catch { /* already restarting */ }
      } else if (this.recognition === rec) {
        EventBus.emit('voice-listening', false);
      }
    };

    EventBus.emit('voice-listening', true);
    try { rec.start(); } catch { /* concurrent start */ }
  }

  private stopVoiceListening(): void {
    const rec = this.recognition;
    EventBus.emit('voice-listening', false);
    EventBus.emit('voice-speaking', false);
    EventBus.emit('voice-heard', '');
    if (!rec) return;
    this.recognition = undefined; // clear first so onend won't re-arm
    rec.onstart = null;
    rec.onspeechstart = null;
    rec.onspeechend = null;
    rec.onresult = null;
    rec.onend = null;
    rec.onerror = null;
    try { rec.abort(); } catch { /* never started */ }
  }

  // Voice AoE: celebrate every koi carrying the spoken kana; charge the crystal once.
  private collectAllMatching(item: KanaItem): void {
    const targets = this.fishGroup.getChildren()
      .filter((o) => (o as Phaser.GameObjects.Sprite).name === item.romaji) as Phaser.GameObjects.Sprite[];

    targets.forEach((sprite, i) => {
      if (i === 0) {
        this.inputSystem.displayFeedback(sprite, true, false, item.romaji, item.audio);
        this.collectEffect(sprite);
        return;
      }
      const circle = this.add.circle(sprite.x, sprite.y, 10, 0x9fe7ec, 0.5).setDepth(1);
      this.tweens.add({
        targets: circle, radius: 70, alpha: 0, duration: 700, ease: 'Cubic.easeOut',
        onComplete: () => circle.destroy(),
      });
      this.tweens.add({ targets: sprite, scale: 1.5, duration: 150, yoyo: true, ease: 'Power1' });
    });

    this.inputSystem.growPlants(); // crystal charges once per answered question
  }

  // --- Time mode: level budget bar -------------------------------------------------------------

  private ensureBudgetBar(): void {
    if (this.budgetBarBg) return;
    const x = this.cameras.main.centerX - 160;
    this.budgetBarBg = this.add.rectangle(x, 632, 320, 10, 0x0a2030, 0.9)
      .setOrigin(0, 0.5).setDepth(250).setStrokeStyle(1, 0x39c0c8, 0.6);
    this.budgetBarFill = this.add.rectangle(x + 1, 632, 318, 8, 0x39c0c8)
      .setOrigin(0, 0.5).setDepth(251);
    this.updateBudgetBar();
  }

  private updateBudgetBar(): void {
    if (!this.budgetBarFill) return;
    const frac = Phaser.Math.Clamp(this.budgetLeftMs / KOI_POND.TIME_BUDGET.START_MS, 0, 1);
    this.budgetBarFill.setScale(frac, 1);
    this.budgetBarFill.setFillStyle(frac > 0.45 ? 0x39c0c8 : frac > 0.2 ? 0xffd479 : 0xff6b6b);
  }

  // Budget hit zero: the Time-mode run FAILS. The pond pauses behind the time-up overlay;
  // retrying replays the level (row mastery resets, cards and taught status are kept).
  private onLevelTimeUp(): void {
    this.budgetRunning = false;
    this.clearQuestionTimer();
    this.currentAnswer = '';
    this.streak = 0;
    this.cameras.main.shake(180, 0.004);

    this.input.enabled = false;
    this.scene.pause();
    this.scene.launch(SCENES.TIME_UP);
    this.events.once('timeup-done', (opts?: { retry?: boolean }) => {
      if (opts?.retry) {
        progressStore.resetMasteryFor(levelConfig(this.currentLevel).adds);
        this.beginLevel(true);
      } else {
        this.thisIsTheEnd(); // back to the menu (reload — the known-safe exit in this fork)
      }
    });
  }

  private onCorrectAnswer(): void {
    this.clearQuestionTimer();
    this.streak++;
    this.showStreak();

    // Time mode: a hit buys time (capped at full). The clock keeps running — one level-wide run.
    if (this.mode === 'time') {
      this.budgetLeftMs = Math.min(
        this.budgetLeftMs + KOI_POND.TIME_BUDGET.HIT_BONUS_MS,
        KOI_POND.TIME_BUDGET.START_MS,
      );
      this.updateBudgetBar();
    }

    const romaji = this.currentAnswer;
    this.currentAnswer = ''; // no question pending: ignore taps until the next prompt
    const awarded = progressStore.recordCorrect(romaji, this.threshold());
    this.emitRowProgress();
    if (awarded) {
      const item = itemByRomaji(romaji);
      if (item) this.popCard(item);
    }

    // Pause so the tapped kana's pronunciation (and the card pop) finish before what follows.
    if (progressStore.levelComplete(levelConfig(this.currentLevel).adds, this.threshold())) {
      this.time.delayedCall(awarded ? 1400 : 900, () => this.onLevelComplete());
    } else {
      this.time.delayedCall(
        awarded ? KOI_POND.NEXT_QUESTION_DELAY_CARD_MS : KOI_POND.NEXT_QUESTION_DELAY_MS,
        () => this.nextKanaQuestion(),
      );
    }
  }

  // Level cleared: pause and show the reward (cards earned); advance on "Siguiente nivel".
  private onLevelComplete(): void {
    if (this.gameOver) return;
    this.clearQuestionTimer();
    const cfg = levelConfig(this.currentLevel);
    const isLast = this.currentLevel >= MAX_LEVEL;

    // Time-mode stars by remaining budget: plenty = 3, comfortable = 2, survived = 1.
    // (Running out is a fail now, so completion always means the bar never hit zero.)
    let stars = 0;
    if (this.mode === 'time') {
      this.budgetRunning = false;
      const frac = this.budgetLeftMs / KOI_POND.TIME_BUDGET.START_MS;
      stars = frac >= 0.45 ? 3 : frac >= 0.18 ? 2 : 1;
      progressStore.setLevelStars(cfg.level, stars);
    }

    this.input.enabled = false;
    this.scene.pause();
    this.scene.launch(SCENES.REWARD, { level: cfg.level, label: levelLabel(cfg, currentLang()), cards: cfg.adds, isLast, stars });
    this.events.once('reward-done', (opts?: { repeat?: boolean }) => {
      if (opts?.repeat) {
        this.repeatLevel();
      } else {
        this.advanceLevel(isLast);
      }
    });
  }

  private advanceLevel(isLast: boolean): void {
    if (isLast) {
      this.input.enabled = true;
      this.currentAnswer = '';
      this.questionText.setText(t('hiraganaDone'));
      this.updateWaitingMessage(t('hiraganaCollectionDone'), 'student');
      return;
    }
    this.currentLevel += 1;
    progressStore.setLevel(this.currentLevel);
    this.beginLevel(true);
  }

  // Brief "new card!" flourish when a kana is mastered.
  private popCard(item: KanaItem): void {
    const card = this.add.container(this.cameras.main.centerX, 200).setDepth(400);
    const bg = this.add.rectangle(0, 0, 120, 156, 0x123b52).setStrokeStyle(3, 0xffd479);
    const glyph = this.add.text(0, -16, item.prompt, {
      fontFamily: KANA.FONT_FAMILY, fontSize: '60px', color: '#ffffff', stroke: KANA.STROKE, strokeThickness: 4,
    }).setOrigin(0.5);
    const tag = this.add.text(0, 52, t('newCard'), {
      fontFamily: 'Arial', fontSize: '14px', color: '#ffd479',
    }).setOrigin(0.5);
    card.add([bg, glyph, tag]);
    card.setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: card, alpha: 0, y: 150, delay: 1100, duration: 500, onComplete: () => card.destroy() });
  }

  private announceLevel(): void {
    const cfg = levelConfig(this.currentLevel);
    this.updateWaitingMessage(`${t('level')} ${cfg.level} — ${levelLabel(cfg, currentLang())}`, 'student');
  }

  private clearQuestionTimer(): void {
    this.stopVoiceListening(); // question is over — stop the per-question mic session
    this.clearTargetGlow();
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
    if(this.gameMode === 'online'){
      this.sendGameStateToServer();
    }
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