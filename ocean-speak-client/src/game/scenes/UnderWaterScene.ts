import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderingSystem } from '../systems/RenderingSystem';
import { UnderWaterObjectManager } from '../managers/UnderWaterObjectManager';
import { InputSystem } from '../systems/InputSystem';
import { ECSWorld } from '../ecs/ECSWorld';
import { DEFAULT_DIFFICULTY, BACKGROUNDS, SHADERS, PARALLAX } from '../global/Constants';
import { BubbleEmitterConfig } from '../interfaces/BubbleEmitterConfig';

export class UnderWaterScene extends Scene
{
    private world!: ECSWorld;
    private objectManager!: UnderWaterObjectManager;
    private renderingSystem!: RenderingSystem;
    public plantGroup!: Phaser.GameObjects.Group; // Plant group
    public fishBankGroups: Phaser.GameObjects.Group[] = []; // Array of fish bank groups
    private selectedDifficulty = DEFAULT_DIFFICULTY; // Default difficulty

    constructor ()
    {
        super('UnderWaterScene');
    }
          
    create(): void {

       // this.add.image(0, 0, 'background').setOrigin(1);
        //this.add.shader('waterShader',  0,0, this.scale.width, this.scale.height).setOrigin(0);

      // Initialize the ECS World
      this.world = new ECSWorld();

      this.renderingSystem = new RenderingSystem(this, this.world);
        // Add parallax background layers
      PARALLAX.TILE_LAYERS.forEach((layer) => {
         this.renderingSystem.addParallaxLayer(layer.imageKey, 0.1, layer.depth, 1); // Slowest layer
      });

      // Add sprite-based parallax layers
      this.renderingSystem.addParallaxSprite(BACKGROUNDS.WATER_EFFECT, 50, { x: 1, y: 0 }); // Horizontal movement

      // Add sprite-based parallax layers using constants
   //   PARALLAX.SPRITES.forEach((sprite) => {
     //     this.renderingSystem.addParallaxSprite(sprite.imageKey, sprite.speed, 50, sprite.direction, 2.8);
     // });

     
       // Add a bubble emitter with a tween
       this.renderingSystem.addBubbleEmitter();
        // Add shader overlay
       this.renderingSystem.addShader(SHADERS.WATER_SHADER);

        // Register the rendering system
        this.world.addSystem(this.renderingSystem);

        // Create the plant group and store it in the scene
        this.plantGroup = this.add.group();
        this.objectManager = new UnderWaterObjectManager(this, this.world , this.selectedDifficulty);  

        this.world.addSystem(new AnimationSystem(this, this.world));

        const stateEntity = this.world.createEntity();
        this.world.addComponent(stateEntity, 'state', { phase: 'gameplay' });
        this.world.addSystem(new InputSystem(this, this.world));

        // Creat Animations
        this.objectManager.createAnimations();
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
