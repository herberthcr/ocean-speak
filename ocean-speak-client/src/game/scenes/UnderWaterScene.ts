import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { MovementSystem } from '../systems/MovementSystem';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderingSystem } from '../systems/RenderingSystem';
import { InputSystem } from '../systems/InputSystem';
import { ECSWorld } from '../ecs/ECSWorld';

export class UnderWaterScene extends Scene
{
    private world!: ECSWorld;
    private movementSystem!: MovementSystem;
    private animationSystem!: AnimationSystem;
    private renderingSystem!: RenderingSystem;
    private inputSystem!: InputSystem;
    private maxFish = 10; // Limit to 10 fishes
    private fishTypes = ['swimBlue', 'swimRed', 'swimOrange']; // Define fish animation types

    constructor ()
    {
        super('UnderWaterScene');
    }
          
        create(): void {


            // Initialize the ECS World
            this.world = new ECSWorld();
            
            // Create Tilemap and Animations
           // this.createTilemap();
            this.createAnimations();
        
            // Initialize Systems
            this.movementSystem = new MovementSystem();
            this.animationSystem = new AnimationSystem(this, this.world);
            this.renderingSystem = new RenderingSystem(this, this.world);
            this.inputSystem = new InputSystem(this, this.world);

            // Create Tilemap through RenderingSystem
            this.renderingSystem.setupTilemap('ocean_tilemap', 'ocean_tiles', ['waterLayer', 'sandLayer', ]);

            // Add random fishes
            this.createRandomFishes();

            EventBus.emit('current-scene-ready', this);
          }
        
          update(time: number, delta: number): void {
            const deltaInSeconds = delta / 1000;
            // Update Systems
            this.movementSystem.update(this.world.getEntitiesByComponent('velocity'), deltaInSeconds);
            this.animationSystem.update(deltaInSeconds);
          }

         /* private createTilemap(): void {
 
            // create the Tilemap
            const map = this.make.tilemap({ key: 'ocean_tilemap' });

            // add the tileset image we are using
            const tileset = map.addTilesetImage('ocean_tiles', 'ocean_tiles')
            
            // create the layers we want in the right order
            // "Sand" layer will be on top of "water" layer
            map.createLayer('sandLayer', tileset, 0, 0).setDepth(2); // Sand at the bottom
            map.createLayer('waterLayer', tileset).setDepth(1); // Sand at the bottom
         }*/
          
          private createAnimations(): void {
            this.anims.create({
              key: 'swimBlue',
              frames: this.anims.generateFrameNumbers('fishSprites', { start: 76, end: 77 }),
              frameRate: 8,
              repeat: -1,
            });
        
            this.anims.create({
              key: 'swimRed',
              frames: this.anims.generateFrameNumbers('fishSprites', { start: 78, end: 79 }),
              frameRate: 8,
              repeat: -1,
            });

            this.anims.create({
                key: 'swimOrange',
                frames: this.anims.generateFrameNumbers('fishSprites', { start: 80, end: 81 }),
                frameRate: 8,
                repeat: -1,
              });
          }
        
          createRandomFishes(): void {
            for (let i = 0; i < this.maxFish; i++) {
              const x = Phaser.Math.Between(0, this.scale.width);
              const y = Phaser.Math.Between(0, this.scale.height);
              const vx = Phaser.Math.FloatBetween(-100, 100); // Random velocity
              const vy = Phaser.Math.FloatBetween(-100, 100);
              const type = Phaser.Math.RND.pick(this.fishTypes); // Random type
        
              this.createFish(x, y, vx, vy, type);
            }
          }


        createFish(x: number, y: number, vx: number, vy: number, _animationKey: string): void {
                const fishEntity = this.world.createEntity();
                const fishSprite = this.add.sprite(x, y, 'fishSprites').play(_animationKey).setDepth(10);
            
                fishEntity
                  .addComponent('type', { value: 'fish' }) // Specify type as 'fish'
                  .addComponent('position', { x, y })
                  .addComponent('velocity', { vx, vy })
                  .addComponent('sprite', { sprite: fishSprite })
                  .addComponent('animation', { animationKey: _animationKey });
        }  
    }
