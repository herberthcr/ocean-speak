import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderingSystem } from '../systems/RenderingSystem';
import { UnderWaterObjectManager } from '../managers/UnderWaterObjectManager';
import { InputSystem } from '../systems/InputSystem';
import { ECSWorld } from '../ecs/ECSWorld';
import { DEFAULT_DIFFICULTY, BACKGROUNDS, SHADERS, PARALLAX, IMAGES, FONTS, SOUNDS, SCREEN, ROLES } from '../global/Constants';
//import { DEFAULT_DIFFICULTY, BACKGROUNDS, SHADERS, SCENES, IMAGES, SCREEN, FONTS, MENU_STATES, SOUNDS, AQUATIC_CHARACTERS  } from '../global/Constants';

import { BubbleEmitterConfig } from '../interfaces/BubbleEmitterConfig';

export class UnderWaterScene extends Scene {
  private world!: ECSWorld;
  private objectManager!: UnderWaterObjectManager;
  private renderingSystem!: RenderingSystem;
  public plantGroup!: Phaser.GameObjects.Group; // Plant group
  public fishBankGroups: Phaser.GameObjects.Group[] = []; // Array of fish bank groups
  private selectedDifficulty = DEFAULT_DIFFICULTY; // Default difficulty
  private nameTextObject: Phaser.GameObjects.BitmapText;
  private playerName: string;
  private playerType: string;
  private gameMode: string;
  private difficulty: string;


  constructor() {
    super('UnderWaterScene');
    this.playerName= 'Martha'
    this.playerType= 'Teacher'
  }

  init(data: { playerName: string, isTeacher: boolean, mode: string, difficulty: string }) {
    this.playerName = data.playerName; // Receive player name from the previous scene
    this.playerType = data.isTeacher ? ROLES.TEACHER : ROLES.STUDENT;
    this.gameMode = data.mode;
    this.difficulty = data.difficulty;
  }

  create(): void {

    this.nameTextObject = this.add.bitmapText(SCREEN.WIDTH / 1.4, SCREEN.HEIGHT / 1, FONTS.FONTS_KEYS.PIXEL_FONT,
      `${this.playerType}: ${this.playerName} `, FONTS.FONT_SIZE_MEDIUM).setOrigin(0.5, 1).setDepth(100).setInteractive();
      this.nameTextObject.setTint(0xa587c9);
      //this.AddTextEffect(this.offlineModeText);

    this.cameras.main.fadeIn(1000, 0, 150, 200);
    this.input.enabled = true; // Re-enable input
    // Initialize the ECS World
    this.world = new ECSWorld();

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
    this.world.addSystem(new InputSystem(this, this.world));

    // Create animation system and add to the world
    this.world.addSystem(new AnimationSystem(this, this.world));

    // Create the plant group and store it in the scene
    this.plantGroup = this.add.group();
    // Create the object underwater manager used to create the game objects
    this.objectManager = new UnderWaterObjectManager(this, this.world, this.selectedDifficulty);

    // Creat Animations
    this.objectManager.createFishAnimations();
    this.objectManager.createPlantsAnimations();
    // Add random fishes
    this.objectManager.createRandomFishes();
    // Add fish and fish banks
    this.objectManager.createFishBanks(this.fishBankGroups);
    // Create plants 
    this.objectManager.createPlants(this.plantGroup);

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number): void {
    this.world.update(delta);
    //const deltaInSeconds = delta / 1000;
  }
}
