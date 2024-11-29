import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import {
  BACKGROUNDS, SHADERS, SCENES, IMAGES, SCREEN, FONTS, MENU_STATES,
  SOUNDS, AQUATIC_CHARACTERS, DIFFICULTY
} from '../global/Constants';
import { Helpers } from '../global/Helpers';


export class MenuScene extends Scene {
  private playerName: string;
  private teacherName: string;
  private isTeacher: boolean;
  private menuParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private endParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private difficulty: string = 'easy';
  private mode: string = 'solo';
  private speechRecognitionOn: string = 'off';
  private keys!: any;
  private backspace!: any;
  private enter!: any;
  private playerNameText: string;
  private welcomeText: string;

  // Scene text
  private textArray: Phaser.GameObjects.BitmapText[] = []; // Array to store BitmapText objects

  // mode text
  private welcomeBitmapText: Phaser.GameObjects.BitmapText;
  private offlineModeText: Phaser.GameObjects.BitmapText;
  private onlineModeText: Phaser.GameObjects.BitmapText;
  private soloModeText: Phaser.GameObjects.BitmapText;
  private gameModeText: Phaser.GameObjects.BitmapText;
  private nameTextObject: Phaser.GameObjects.BitmapText;
  // difficulty text
  private selectDifficultyText: Phaser.GameObjects.BitmapText;
  private easyText: Phaser.GameObjects.BitmapText;
  private mediumText: Phaser.GameObjects.BitmapText;
  private hardText: Phaser.GameObjects.BitmapText;

  // Speech therapy on or of
  private speechText: Phaser.GameObjects.BitmapText;
  private speechOnText: Phaser.GameObjects.BitmapText;
  private speechOffText: Phaser.GameObjects.BitmapText;
  private playGame: Phaser.GameObjects.BitmapText;

  private mouseOverSound: Phaser.Sound.BaseSound;
  private mouseClickSound: Phaser.Sound.BaseSound;



  constructor() {
    super('MenuScene');
    this.playerName = '';
    this.isTeacher = false;
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
    this.mouseOverSound = this.sound.add(SOUNDS.MOUSE_OVER_SOUND);
    this.mouseClickSound = this.sound.add(SOUNDS.MOUSE_CLICK_SOUND);

    // initial state
    this.currentState = MENU_STATES.PLAYER_TTPE;
    this.initialSetup();

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number): void {
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
      this.manageScreenTransition();
    }
    this.nameTextObject.setText(this.playerNameText + this.playerName)
  }

  manageScreenTransition() {
    this.input.enabled = false;
    this.setAllTextInvisible();
    this.goToMainGame();
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
  }

  createBackgrounds() {
    this.add.image(0, 0, BACKGROUNDS.BLUE_BACKGROUND).setOrigin(0);
    this.add.shader(SHADERS.TUNNEL_SHADER, 0, 0, this.scale.width, this.scale.height).setOrigin(0);
  }

  initialSetup() {
    this.welcomeText = `Welcome to the ocean`;
    this.playerSelectionText = `Select type of player?`;

    this.welcomeBitmapText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 5.5, FONTS.FONTS_KEYS.PIXEL_FONT,
      this.welcomeText, FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.welcomeBitmapText);
    this.addTextToArray(this.welcomeBitmapText);

    this.playerNameText = 'Enter your name:\n\n ';
    this.nameTextObject = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2.8, FONTS.FONTS_KEYS.PIXEL_FONT,
      this.playerNameText, FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.nameTextObject);
    this.addTextToArray(this.nameTextObject);

    this.gameModeText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2.2, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Choose Game Type', FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.gameModeText);
    this.addTextToArray(this.gameModeText);

    this.soloModeText = this.add.bitmapText(SCREEN.WIDTH / 2 - 250, SCREEN.HEIGHT / 2, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Solo', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.soloModeText);
    this.addTextToArray(this.soloModeText);

    this.offlineModeText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Simulation', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.offlineModeText);
    this.addTextToArray(this.offlineModeText);

    this.onlineModeText = this.add.bitmapText(SCREEN.WIDTH / 2 + 250, SCREEN.HEIGHT / 2, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Online', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.onlineModeText);
    this.addTextToArray(this.onlineModeText);

    this.selectDifficultyText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.65, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Game Difficulty', FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.selectDifficultyText);
    this.addTextToArray(this.selectDifficultyText);

    this.easyText = this.add.bitmapText(SCREEN.WIDTH / 2 - 250, SCREEN.HEIGHT / 1.55, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Easy', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.easyText);
    this.addTextToArray(this.easyText);

    this.mediumText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.55, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Medium', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.mediumText);
    this.addTextToArray(this.mediumText);

    this.hardText = this.add.bitmapText(SCREEN.WIDTH / 2 + 250, SCREEN.HEIGHT / 1.55, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Hard', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.hardText);
    this.addTextToArray(this.hardText);

    this.speechText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.35, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Do you have a microphone?', FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.speechText);
    this.addTextToArray(this.speechText);

    this.speechOnText = this.add.bitmapText(SCREEN.WIDTH / 2 - 100, SCREEN.HEIGHT / 1.27, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Yes', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.speechOnText);
    this.addTextToArray(this.speechOnText);

    this.speechOffText = this.add.bitmapText(SCREEN.WIDTH / 2 + 100, SCREEN.HEIGHT / 1.27, FONTS.FONTS_KEYS.PIXEL_FONT,
      'No', FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.speechOffText);
    this.addTextToArray(this.speechOffText);

    this.playGame = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.08, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Play Game', FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100).setInteractive();

    this.add.tween({
      targets: this.playGame,
      scaleX: 1.25,
      scaleY: 1.25,
      ease: 'Sine.easeInOut',
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    this.playGame.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.mouseOverSound.play();
      this.playGame.setTint(0xc0e578);
    });
    this.playGame.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      this.playGame.setTint(0xFFFFFF);
    });

    this.addTextToArray(this.playGame);

    this.mode = 'solo';
    this.difficulty = 'medium';
    this.speechRecognitionOn = 'on';
    this.soloModeText.setTint(0xc0e578);
    this.mediumText.setTint(0xc0e578);
    this.speechOnText.setTint(0xc0e578);

    this.soloModeText.on('pointerdown', () => {
      this.mode = 'solo';
      this.offlineModeText.setTint(0xffffff);
      this.onlineModeText.setTint(0xffffff);
      this.soloModeText.setTint(0xc0e578);
      this.mouseClickSound.play();
    });

    this.offlineModeText.on('pointerdown', () => {
      this.mode = 'simulation';
      this.offlineModeText.setTint(0xc0e578);
      this.onlineModeText.setTint(0xffffff);
      this.soloModeText.setTint(0xffffff);
      this.mouseClickSound.play();
    });

    this.onlineModeText.on('pointerdown', () => {
      this.mode = 'online';
      this.offlineModeText.setTint(0xffffff);
      this.onlineModeText.setTint(0xc0e578);
      this.soloModeText.setTint(0xffffff);
      this.mouseClickSound.play();
    });


    this.easyText.on('pointerdown', () => {
      this.difficulty = 'easy';
      this.mediumText.setTint(0xffffff);
      this.hardText.setTint(0xffffff);
      this.easyText.setTint(0xc0e578);
      this.mouseClickSound.play();
    });

    this.mediumText.on('pointerdown', () => {
      this.difficulty = 'medium';
      this.hardText.setTint(0xffffff);
      this.mediumText.setTint(0xc0e578);
      this.easyText.setTint(0xffffff);
      this.mouseClickSound.play();
    });

    this.hardText.on('pointerdown', () => {
      this.difficulty = 'hard';
      this.mediumText.setTint(0xffffff);
      this.hardText.setTint(0xc0e578);
      this.easyText.setTint(0xffffff);
      this.mouseClickSound.play();
    });

    this.speechOnText.on('pointerdown', () => {
      this.speechRecognitionOn = 'on';
      this.speechOnText.setTint(0xc0e578);
      this.speechOffText.setTint(0xffffff);
      this.mouseClickSound.play();
    });

    this.speechOffText.on('pointerdown', () => {
      this.speechRecognitionOn = 'off';
      this.speechOnText.setTint(0xffffff);
      this.speechOffText.setTint(0xc0e578);
      this.mouseClickSound.play();
    });

    this.playGame.on('pointerdown', () => {
      this.mouseClickSound.play();
      this.manageScreenTransition();
    });

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
      this.mouseOverSound.play();
    });
  }

  goToMainGame() {

    this.cameras.main.fadeOut(5000, 0, 150, 200); // Fade to black over 3 seconds

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

    this.endParticles = this.add.particles(100, 568, IMAGES.BUBBLES, {
      x: { min: 0, max: this.scale.width },
      y: { min: 0, max: this.scale.height },
      speed: 200,
      lifespan: 2500,
      scale: { start: 0.5, end: 0 },
      quantity: 50,
    }).setAlpha(0.6);

    if (!this.playerName) {
      const randomNamePlayerName = Phaser.Utils.Array.GetRandom(AQUATIC_CHARACTERS);
      this.playerName = randomNamePlayerName;
    }
    const playerName = Helpers.capitalizeFirstLetter(this.playerName);
    this.teacherName = Phaser.Utils.Array.GetRandom(AQUATIC_CHARACTERS);
    const teacherName = this.teacherName;
    const isTeacher = this.isTeacher;
    const mode = this.mode;
    const difficulty = this.difficulty;
    const speechRecognitionOn = this.speechRecognitionOn;

    const startGameText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 3, FONTS.FONTS_KEYS.PIXEL_FONT,
      `Starting game for `, FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(startGameText);
    startGameText.setTint(0xc0e578);

    const nameTextObject = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2.1, FONTS.FONTS_KEYS.PIXEL_FONT,
      playerName, FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(nameTextObject);
    nameTextObject.setTint(0xc0e578);

    const difficultyKey = difficulty.toUpperCase() as keyof typeof DIFFICULTY;
    const selectedDifficulty = DIFFICULTY[difficultyKey];

    const rulesMax = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.6, FONTS.FONTS_KEYS.PIXEL_FONT,
      selectedDifficulty.RULES_MAX_SCORE, FONTS.FONT_SIZE_MEDIUM_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(rulesMax);
    rulesMax.setTint(0xc0e578);

    if (speechRecognitionOn == 'on') {
      const rulesMaxSpeech = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.3, FONTS.FONTS_KEYS.PIXEL_FONT,
        selectedDifficulty.RULES_MAX_SPEECH_SCORE, FONTS.FONT_SIZE_MEDIUM_BIG).setOrigin(0.5, 1).setDepth(100);
      this.AddTextEffect(rulesMaxSpeech);
      rulesMaxSpeech.setTint(0xc0e578);
    }

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Switch to the main game scene
      this.endParticles.destroy();
      this.input.enabled = true;
      this.scene.start(SCENES.UNDERWATER_SCENE, { playerName, isTeacher, mode, difficulty, teacherName, speechRecognitionOn });
    });
  }
}


