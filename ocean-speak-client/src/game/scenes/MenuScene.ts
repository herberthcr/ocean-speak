import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import {
  BACKGROUNDS, SHADERS, SCENES, IMAGES, SCREEN, FONTS, MENU_STATES,
  SOUNDS, AQUATIC_CHARACTERS, DIFFICULTY
} from '../global/Constants';
import { Helpers } from '../global/Helpers';
import { TextHelper } from '../global/TextHelper'


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
  
 // Text helper
  private textHelper!: TextHelper;

  // Scene text
  private textArray: Phaser.GameObjects.BitmapText[] = []; // Array to store BitmapText objects

  // mode text
  private welcomeBitmapText: Phaser.GameObjects.Text;
  private offlineModeText: Phaser.GameObjects.Text;
  private onlineModeText: Phaser.GameObjects.Text;
  private soloModeText: Phaser.GameObjects.Text;
  private gameModeText: Phaser.GameObjects.Text;
  private nameTextObject: Phaser.GameObjects.Text;
  // difficulty text
  private selectDifficultyText: Phaser.GameObjects.Text;
  private easyText: Phaser.GameObjects.Text;
  private mediumText: Phaser.GameObjects.Text;
  private hardText: Phaser.GameObjects.Text;

  // Speech therapy on or of
  private speechText: Phaser.GameObjects.Text;
  private speechOnText: Phaser.GameObjects.Text;
  private speechOffText: Phaser.GameObjects.Text;
  private playGame: Phaser.GameObjects.Text;

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
    // Initialize Text helper
    this.textHelper = new TextHelper(this);
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
    this.welcomeBitmapText = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 6, 200, '70px', this.welcomeText, 'blue');
    this.welcomeBitmapText.setOrigin(0.5, 1).setDepth(100);
    this.textHelper.AddAquaticTextEffect(this.welcomeBitmapText);
    this.AddTextEffect(this.welcomeBitmapText);
    this.addTextToArray(this.welcomeBitmapText);

    this.playerNameText = 'Enter your name:\n ';
    this.nameTextObject = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2.8, 200, '48px', this.playerNameText, 'blue');
    this.nameTextObject.setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.nameTextObject);
    this.addTextToArray(this.nameTextObject);
    this.textHelper.AddAquaticTextEffect(this.nameTextObject);

    this.gameModeText = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2.2, 200, '48px', 'Choose Game Type', 'blue');
    this.gameModeText.setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.gameModeText);
    this.addTextToArray(this.gameModeText);
    this.textHelper.AddAquaticTextEffect(this.gameModeText);


    this.soloModeText = this.textHelper.createColoredText(SCREEN.WIDTH / 2 - 200, SCREEN.HEIGHT / 1.95, 200, '32px', 'Solo', 'blue');
    this.soloModeText.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.soloModeText);
    this.addTextToArray(this.soloModeText);
    this.textHelper.AddAquaticTextEffect(this.soloModeText);


    this.offlineModeText = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.95, 200, '32px', 'Simulation', 'blue');
    this.offlineModeText.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.offlineModeText);
    this.addTextToArray(this.offlineModeText);
    this.textHelper.AddAquaticTextEffect(this.offlineModeText);

    this.onlineModeText = this.textHelper.createColoredText(SCREEN.WIDTH / 2 + 200, SCREEN.HEIGHT / 1.95, 200, '32px', 'Online', 'blue');
    this.onlineModeText.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.onlineModeText);
    this.addTextToArray(this.onlineModeText);
    this.textHelper.AddAquaticTextEffect(this.onlineModeText);


    this.selectDifficultyText = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.65, 200, '48px', 'Select Difficulty', 'blue');
    this.selectDifficultyText.setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.selectDifficultyText);
    this.addTextToArray(this.selectDifficultyText);
    this.textHelper.AddAquaticTextEffect(this.selectDifficultyText);

    this.easyText = this.textHelper.createColoredText(SCREEN.WIDTH / 2 - 150, SCREEN.HEIGHT / 1.5, 200, '32px', 'Easy', 'blue');
    this.easyText.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.easyText);
    this.addTextToArray(this.easyText);
    this.textHelper.AddAquaticTextEffect(this.easyText);

    this.mediumText = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.5, 200, '32px', 'Medium', 'blue');
    this.mediumText.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.mediumText);
    this.addTextToArray(this.mediumText);
    this.textHelper.AddAquaticTextEffect(this.mediumText);

    this.hardText = this.textHelper.createColoredText(SCREEN.WIDTH / 2 + 150, SCREEN.HEIGHT / 1.5, 200, '32px', 'Hard', 'blue');
    this.hardText.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.hardText);
    this.addTextToArray(this.hardText);
    this.textHelper.AddAquaticTextEffect(this.hardText);

    this.speechText = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.32, 200, '48px', 'Do you have a microphone?', 'blue');
    this.speechText.setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.speechText);
    this.addTextToArray(this.speechText);
    this.textHelper.AddAquaticTextEffect(this.speechText);

    this.speechOnText = this.textHelper.createColoredText(SCREEN.WIDTH / 2 - 100, SCREEN.HEIGHT / 1.23, 200, '32px', 'Yes', 'blue');
    this.speechOnText.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.speechOnText);
    this.addTextToArray(this.speechOnText);
    this.textHelper.AddAquaticTextEffect(this.speechOnText);

    this.speechOffText =  this.textHelper.createColoredText(SCREEN.WIDTH / 2 + 100, SCREEN.HEIGHT / 1.23, 200, '32px', 'No', 'blue');
    this.speechOffText.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.addTextToArray(this.speechOffText);
    this.textHelper.AddAquaticTextEffect(this.speechOffText);

    this.playGame = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.05, 200, '64px', 'Start Game', 'blue');
    this.playGame.setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.textHelper.AddAquaticTextEffect(this.playGame);

    this.add.tween({
      targets: this.playGame,
      scaleX: 1.2,
      scaleY: 1.2,
      ease: 'Sine.easeInOut',
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    this.playGame.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.mouseOverSound.play();
      this.textHelper.updateTextColor(this.playGame, 'gold');
    });
    this.playGame.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      this.textHelper.updateTextColor(this.playGame, 'blue');
    });

    this.addTextToArray(this.playGame);

    this.mode = 'solo';
    this.difficulty = 'medium';
    this.speechRecognitionOn = 'on';
  
    this.textHelper.updateTextColor(this.mediumText, 'gold');
    this.textHelper.updateTextColor(this.speechOnText, 'gold');
    this.textHelper.updateTextColor(this.soloModeText, 'gold');

    this.soloModeText.on('pointerdown', () => {
      this.mode = 'solo';
      this.textHelper.updateTextColor(this.offlineModeText, 'blue');
      this.textHelper.updateTextColor(this.onlineModeText, 'blue');
      this.textHelper.updateTextColor(this.soloModeText, 'gold');
      this.mouseClickSound.play();
    });

    this.offlineModeText.on('pointerdown', () => {
      this.mode = 'simulation';
      this.textHelper.updateTextColor(this.offlineModeText, 'gold');
      this.textHelper.updateTextColor(this.onlineModeText, 'blue');
      this.textHelper.updateTextColor(this.soloModeText, 'blue');
      
      this.mouseClickSound.play();
    });

    this.onlineModeText.on('pointerdown', () => {
      this.mode = 'online';
      this.textHelper.updateTextColor(this.offlineModeText, 'blue');
      this.textHelper.updateTextColor(this.onlineModeText, 'gold');
      this.textHelper.updateTextColor(this.soloModeText, 'blue');
      this.mouseClickSound.play();
    });

    this.easyText.on('pointerdown', () => {
      this.difficulty = 'easy';
      this.textHelper.updateTextColor(this.mediumText, 'blue');
      this.textHelper.updateTextColor(this.hardText, 'blue');
      this.textHelper.updateTextColor(this.easyText, 'gold');
      this.mouseClickSound.play();
    });

    this.mediumText.on('pointerdown', () => {
      this.difficulty = 'medium';
      this.textHelper.updateTextColor(this.mediumText, 'gold');
      this.textHelper.updateTextColor(this.hardText, 'blue');
      this.textHelper.updateTextColor(this.easyText, 'blue');
      this.mouseClickSound.play();
    });

    this.hardText.on('pointerdown', () => {
      this.difficulty = 'hard';
      this.textHelper.updateTextColor(this.mediumText, 'blue');
      this.textHelper.updateTextColor(this.hardText, 'gold');
      this.textHelper.updateTextColor(this.easyText, 'blue');
      this.mouseClickSound.play();
    });

    this.speechOnText.on('pointerdown', () => {
      this.speechRecognitionOn = 'on';
      this.textHelper.updateTextColor(this.speechOnText, 'gold');
      this.textHelper.updateTextColor(this.speechOffText, 'blue');
      this.mouseClickSound.play();
    });

    this.speechOffText.on('pointerdown', () => {
      this.speechRecognitionOn = 'off';
      this.textHelper.updateTextColor(this.speechOnText, 'blue');
      this.textHelper.updateTextColor(this.speechOffText, 'gold');
      this.mouseClickSound.play();
    });

    this.playGame.on('pointerdown', () => {
      this.textHelper.updateTextColor(this.playGame, 'red');
      this.mouseClickSound.play();
      this.manageScreenTransition();
    });

  }

  // Add a BitmapText object to the array
  private addTextToArray(text: Phaser.GameObjects.Text): void {
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

  AddTextEffect(text: Phaser.GameObjects.Text) {
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
    
     const startGameText  = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 3, 200, '48px', `Starting game for `, 'blue');
    startGameText.setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(startGameText);
    this.textHelper.AddAquaticTextEffect(startGameText);

    const nameTextObject  = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2.1, 200, '48px', playerName, 'blue');
    nameTextObject.setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(nameTextObject);
    this.textHelper.AddAquaticTextEffect(nameTextObject);

    const difficultyKey = difficulty.toUpperCase() as keyof typeof DIFFICULTY;
    const selectedDifficulty = DIFFICULTY[difficultyKey];

    const rulesMax  = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.6, 200, '48px', selectedDifficulty.RULES_MAX_SCORE, 'blue');
    rulesMax.setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(rulesMax);
    this.textHelper.AddAquaticTextEffect(rulesMax);

    

    if (speechRecognitionOn == 'on') {

      const rulesMaxSpeech  = this.textHelper.createColoredText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.3, 200, '48px', selectedDifficulty.RULES_MAX_SPEECH_SCORE, 'blue');
      rulesMaxSpeech.setOrigin(0.5, 1).setDepth(100);
      this.AddTextEffect(rulesMaxSpeech);
      this.textHelper.AddAquaticTextEffect(rulesMaxSpeech);
    }

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Switch to the main game scene
      this.endParticles.destroy();
      this.input.enabled = true;
      this.scene.start(SCENES.UNDERWATER_SCENE, { playerName, isTeacher, mode, difficulty, teacherName, speechRecognitionOn });
    });
  }
}


