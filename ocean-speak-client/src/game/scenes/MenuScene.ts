import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { ECSWorld } from '../ecs/ECSWorld';
import { InputSystem } from '../systems/InputSystem';
import { DEFAULT_DIFFICULTY, BACKGROUNDS, SHADERS, SCENES, IMAGES, SCREEN, FONTS, MENU_STATES, 
  SOUNDS, AQUATIC_CHARACTERS, DIFFICULTY } from '../global/Constants';
import { Helpers } from '../global/Helpers';


export class MenuScene extends Scene {
  private playerName: string;
  private teacherName: string;
  private isTeacher: boolean;
  private stateDone: boolean;
  private menuParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private endParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private difficulty: string = 'Easy';
  private mode: string = 'Offline';
  private keys!: any;
  private backspace!: any;
  private enter!: any;
  private text: Phaser.GameObjects.Text;
  private playerNameText: string;
  private welcomeText: string;
  private playerSelectionText: string;


  private currentState: string;

  // Scene text
  private textArray: Phaser.GameObjects.BitmapText[] = []; // Array to store BitmapText objects
  private welcomeBitmapText: Phaser.GameObjects.BitmapText;
  private offlineModeText: Phaser.GameObjects.BitmapText;
  private onlineModeText: Phaser.GameObjects.BitmapText;
  private configModeText: Phaser.GameObjects.BitmapText;
  private legendText: Phaser.GameObjects.BitmapText;
  private nameTextObject: Phaser.GameObjects.BitmapText;

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
    }
    this.nameTextObject.setText(this.playerNameText + this.playerName)
  }

  manageScreenTransition() {
    this.input.enabled = false;
    if (this.mode == 'online') {
      this.addTextToArray(this.offlineModeText);
    }else{
      this.addTextToArray(this.onlineModeText);
    }
    
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

    this.welcomeBitmapText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 3, FONTS.FONTS_KEYS.PIXEL_FONT,
      this.welcomeText, FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.welcomeBitmapText);
    this.addTextToArray(this.welcomeBitmapText);

    this.playerNameText = 'Enter your name:\n\n ';
    this.nameTextObject = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2, FONTS.FONTS_KEYS.PIXEL_FONT,
      this.playerNameText, FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(this.nameTextObject);
    this.addTextToArray(this.nameTextObject);

    this.offlineModeText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.6, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Simulation Session', FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.offlineModeText);

    this.onlineModeText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.4, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Online Session', FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100).setInteractive();
    this.AddTextEffect(this.onlineModeText);

    this.configModeText = this.add.bitmapText(SCREEN.WIDTH / 1.7, 10, FONTS.FONTS_KEYS.PIXEL_FONT,
      'Teacher configuration', FONTS.FONT_SIZE_SMALL).setOrigin(0, 0).setDepth(100).setInteractive();
    this.AddTextEffect(this.configModeText);
    this.addTextToArray(this.configModeText);

    this.legendText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 1.05, 
      FONTS.FONTS_KEYS.PIXEL_FONT,
      '  Simulation mode will simulate the teacher \n\n      (Its ok to leave the name blank)', 
      FONTS.FONT_SIZE_SMALL).setOrigin(0.5, 1).setDepth(100);
      this.AddTextEffect(this.legendText);
      this.addTextToArray(this.legendText);

    this.offlineModeText.on('pointerdown', () => {
      this.mode = 'offline';
      this.manageScreenTransition();
    });

    this.onlineModeText.on('pointerdown', () => {
      this.mode = 'online';
      this.manageScreenTransition();
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

  goToMainGame() {

    this.cameras.main.fadeOut(3000, 0, 150, 200); // Fade to black over 3 seconds

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
    const teacherName = this.teacherName ;

    const isTeacher = this.isTeacher;
    const mode = 'offline';
    const difficulty = 'easy';

    const startGameText = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 3, FONTS.FONTS_KEYS.PIXEL_FONT,
      `Starting game for `, FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
    this.AddTextEffect(startGameText);
    startGameText.setTint(0xc0e578);

    const nameTextObject = this.add.bitmapText(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2.1, FONTS.FONTS_KEYS.PIXEL_FONT,
      playerName, FONTS.FONT_SIZE_BIG).setOrigin(0.5, 1).setDepth(100);
      this.AddTextEffect(nameTextObject);
      nameTextObject.setTint(0xc0e578);

    this.cameras.main.once('camerafadeoutcomplete', () => {

      // Switch to the main game scene
      this.endParticles.destroy();
      this.input.enabled = true;
      this.scene.start(SCENES.UNDERWATER_SCENE, { playerName, isTeacher, mode, difficulty, teacherName });
    });
  }

  playGame() {
    this.scene.start('UnderWaterScene');
  }
}



