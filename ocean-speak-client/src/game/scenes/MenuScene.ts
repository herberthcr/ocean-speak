import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { ECSWorld } from '../ecs/ECSWorld';
import { InputSystem } from '../systems/InputSystem';
import { DEFAULT_DIFFICULTY, BACKGROUNDS, SHADERS, SCENES, IMAGES, SCREEN, FONTS, MENU_STATES, SOUNDS, AQUATIC_CHARACTERS, DIFFICULTY } from '../global/Constants';



export class MenuScene extends Scene {
  private playerName: string;
  private isTeacher: boolean;
  private stateDone: boolean;
  private menuParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private difficulty: string = 'Easy';
  private mode: string = 'Offline';
  private keys!: any;
  private backspace!: any;
  private enter!: any;
  private text: Phaser.GameObjects.Text;
  private playerNameText: string;
  private welcomeText: string;
  private playerSelectionText: string;
  private legendText: Phaser.GameObjects.BitmapText;
  private nameTextObject: Phaser.GameObjects.BitmapText;

  private currentState: string;

  // Scene text
  private textArray: Phaser.GameObjects.BitmapText[] = []; // Array to store BitmapText objects
  private welcomeBitmapText: Phaser.GameObjects.BitmapText;
  private offlineModeText: Phaser.GameObjects.BitmapText;

  constructor() {
    super('MenuScene');
    this.playerName = '';
    this.currentState = '';
    this.isTeacher = false;
    this.stateDone = false;
  }

  // Register allowed keys
  init() {
    var alpha = "abcdefghijklmnopqrstuvwxyz1234567890".split("").join(",");
    this.keys = this.input.keyboard.addKeys(alpha);
    this.backspace = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.BACKSPACE
    );
    this.enter = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );
  }

  create() {
    // Disable input
    this.input.enabled = true;
    this.cameras.main.fadeIn(1000, 0, 150, 200);
    this.createBackgrounds();
    this.playWelcomeEmitter();

    // initial state
    this.currentState = MENU_STATES.PLAYER_TTPE;

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number): void {

    this.handleMenuState();
    if (this.currentState === MENU_STATES.ENTER_NAME) {

      for (const key of Object.keys(this.keys)) {
        if (Phaser.Input.Keyboard.JustDown(this.keys[key])) {
          if (this.playerName.length < 15) {

            this.playerName += key;
          }
        }
      }
      if (Phaser.Input.Keyboard.JustDown(this.backspace)) {
        this.playerName = this.playerName.substring(0, this.playerName.length - 1);
      }
      if (Phaser.Input.Keyboard.JustDown(this.enter)) {
        //  this.scene.start("playgame", this.playerName);
      }
      this.nameTextObject.setText(this.playerNameText + this.playerName);

    }

  }

  handleMenuState() {
    switch (this.currentState) {
      case MENU_STATES.PLAYER_TTPE:
        if (!this.stateDone) {
          this.initialSetup();
        }
        break;

      case MENU_STATES.ENTER_NAME:
        //this.enterTeacherSetup();  
        if (!this.stateDone) {
          this.setAllTextInvisible();
          this.nameSetup();
        }
        break;

      case MENU_STATES.DIFFICULTY_SELECTION:
        if (!this.stateDone) {
          this.setAllTextInvisible();
          this.enterTeacherSetup();
        }
        break;

      case MENU_STATES.SESSION_MODE:

        break;

      case MENU_STATES.RELAXING_SESSION:
        if (!this.stateDone) {
          this.stateDone = true;
          this.currentState = MENU_STATES.PLAY_GAME;
          this.addTextToArray(this.welcomeBitmapText);
          this.addTextToArray(this.legendText);
          this.addTextToArray(this.offlineModeText);
          this.setAllTextInvisible();
          this.goToMainGame();
        }
        break;
    }
  }

  playWelcomeEmitter() {
    this.menuParticles = this.add.particles(0, 0, IMAGES.BUBBLES, {
      x: { min: 0, max: this.scale.width },
      y: { min: 0, max: this.scale.height },
      speed: 50,
      lifespan: 2000,
      scale: { start: 0.5, end: 0 },
      quantity: 50,
    }).setAlpha(0.2);

    // Start the emitter
    this.menuParticles.start();
  }

  createBackgrounds() {
    this.add.image(0, 0, BACKGROUNDS.BLUE_BACKGROUND).setOrigin(0);
    this.add.shader(SHADERS.TUNNEL_SHADER, 0, 0, this.scale.width, this.scale.height).setOrigin(0);
  }

  initialSetup() {
    this.welcomeText = `Welcome to the ocean`;
    this.playerSelectionText = `Select type of player?`;

    this.welcomeBitmapText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2.5, FONTS.FONTS_KEYS.PIXEL_FONT,
      this.welcomeText, FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.welcomeBitmapText);
    // this.addTextToArray(this.welcomeBitmapText);

    const playerTypeSelection = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2, FONTS.FONTS_KEYS.PIXEL_FONT,
      this.playerSelectionText, FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(playerTypeSelection);
    this.addTextToArray(playerTypeSelection);

    const teacherText = this.add.bitmapText(SCREEN.WIDTH / 3, SCREEN.HEIGHT / 1.7, FONTS.FONTS_KEYS.PIXEL_FONT,
      'TEACHER', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();

    this.AddTextEffect(teacherText);
    this.addTextToArray(teacherText);

    teacherText.on('pointerdown', () => this.enterTeacherSetup());

    const studentText = this.add.bitmapText(SCREEN.WIDTH / 1.5, SCREEN.HEIGHT / 1.7, FONTS.FONTS_KEYS.PIXEL_FONT,
      'STUDENT', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(studentText);
    this.addTextToArray(studentText);

    this.offlineModeText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.3, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Play Game', FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.offlineModeText);

    this.legendText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.05, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Relaxing offline mode, \n will be default \n if no values entered', FONTS.FONT_SIZE_SMALL).setOrigin(0.5, 1).setDepth(100).setInteractive();

    this.AddTextEffect(this.legendText);


    teacherText.on('pointerdown', () => {
      this.input.enabled = false;
      this.isTeacher = true;
      this.currentState = MENU_STATES.ENTER_NAME;
      this.stateDone = false;
    });

    studentText.on('pointerdown', () => {
      this.input.enabled = false;
      this.isTeacher = false;
      this.currentState = MENU_STATES.ENTER_NAME;
      this.stateDone = false;
    });

    this.offlineModeText.on('pointerdown', () => {
      this.input.enabled = false;
      this.currentState = MENU_STATES.RELAXING_SESSION;
      this.stateDone = false;
    });
    this.stateDone = true;
  }

  // Add a BitmapText object to the array
  private addTextToArray(text: Phaser.GameObjects.BitmapText): void {
    this.textArray.push(text); // Push the BitmapText to the array
  }

  // Set all BitmapText objects in the array to invisible
  private setAllTextInvisible(): void {

    this.textArray.forEach((text) => {
      text.setVisible(false);
    });
    this.resetTextArray();
  }

  // Reset the array by clearing its contents
  private resetTextArray(): void {
    this.textArray = [];
  }

  AddTextEffect(text: Phaser.GameObjects.BitmapText) {
    this.add.tween({
      targets: text,
      scaleX: 1.01,
      scaleY: 1.01,
      ease: "Elastic", // 'Cubic', 'Elastic', 'Bounce', 'Back'
      duration: 6000,
      repeat: -1, // -1: infinity
      yoyo: false
    });

    text.on(Phaser.Input.Events.POINTER_OVER, () => {
      text.setTint(0xc0e578);
    })
    text.on(Phaser.Input.Events.POINTER_OUT, () => {
      text.setTint(0xffffff);
    })
  }

  nameSetup() {
    this.input.enabled = true;
    this.playerNameText = 'Enter your name:\n\n ';

    this.nameTextObject = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.6, FONTS.FONTS_KEYS.PIXEL_FONT,
      this.playerNameText, FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100);

    this.AddTextEffect(this.nameTextObject);
    this.addTextToArray(this.nameTextObject);
  }

  // Teacher setup process
  enterTeacherSetup() {
    const playerTypeSelection = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Enter Name ', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(playerTypeSelection);
    this.addTextToArray(playerTypeSelection);
  }

  // Teacher options (difficulty, mode, name)
  setupTeacherOptions() {

    this.add.text(400, 150, 'Select Difficulty:', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

    const difficulties = ['Easy', 'Medium', 'Hard'];
    difficulties.forEach((level, index) => {
      const button = this.add.text(400, 200 + index * 50, level, {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#007700',
        padding: { x: 10, y: 5 },
      }).setInteractive().setOrigin(0.5);

      button.on('pointerdown', () => {
        this.difficulty = level;
        //     this.askGameMode();
      });
    });
  }


  goToMainGame() {

    console.log('CLICK, CLICK');
    this.cameras.main.fadeOut(1000, 0, 150, 200); // Fade to black over 3 seconds
    // Gradually fade out particles
    this.tweens.add({
      targets: this.menuParticles,
      alpha: 0, // Gradually reduce alpha to 0
      duration: 2000, // Fade out duration
      onComplete: () => {
        this.menuParticles.stop(); // Stop the emitter after fading out
        this.menuParticles.destroy(); // Optional: Destroy the particles
      },
    });

    // Stop the background music
    const backgroundMusic = this.sound.get(SOUNDS.OCEAN_WAVES);
    if (backgroundMusic) {
      backgroundMusic.stop();
    }

    if (!this.playerName) {
      const randomName = Phaser.Utils.Array.GetRandom(AQUATIC_CHARACTERS);
      this.playerName = randomName;
    }

    const startGameText = this.add.bitmapText(500, 400, FONTS.FONTS_KEYS.PIXEL_FONT,
      `Starting game for ${this.playerName}`, FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(startGameText);

    const playerName = this.playerName;
    const isTeacher = this.isTeacher;
    const mode = 'offline';
    const difficulty = DIFFICULTY.EASY;
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Switch to the main game scene
      this.clearScene();
      this.scene.start(SCENES.UNDERWATER_SCENE, { playerName, isTeacher, mode, difficulty });
    });
  }

  // Clear the current scene
  clearScene() {
    this.children.removeAll();
  }

  playGame() {
    this.scene.start('UnderWaterScene');
  }
}
