import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderingSystem } from '../systems/RenderingSystem';
import { InputSystem } from '../systems/InputSystem';
import { ECSWorld } from '../ecs/ECSWorld';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { GameObjectComponent } from '../components/GameObjectComponent';

export class UnderWaterScene extends Scene
{
    private world!: ECSWorld;
    private maxFish = 20; // Limit to 10 fishes
    private fishSpeed = 50;
    private fishTypes = ['swimBlue', 'swimRed', 'swimOrange', 'greenFish','purpleFish']; // Define fish animation types
    private plantsTypes = ['greenPlant', 'purplePlant', 'bluePlant']; // Define fish animation types
    private waterHeight = 576;

    constructor ()
    {
        super('UnderWaterScene');
    }
          
        create(): void {

          // Initialize the ECS World
          this.world = new ECSWorld();
            
          // Creat Animations
          this.createAnimations();
        
           // Add Rendering System
          const renderingSystem = new RenderingSystem(this, this.world);
          this.world.addSystem(renderingSystem);
          renderingSystem.setupTilemap('ocean_tilemap', 'ocean_tiles', ['waterLayer', 'sandLayer', ]);

          this.world.addSystem(new AnimationSystem(this, this.world));
          this.world.addSystem(new InputSystem(this, this.world));

          // Add random fishes
          this.createRandomFishes();
          this.createPlants();

          EventBus.emit('current-scene-ready', this);
         }
        
          update(time: number, delta: number): void {
            this.world.update(delta);
            //const deltaInSeconds = delta / 1000;
          }
          
          private createAnimations(): void {
            this.anims.create({
              key: 'swimBlue',
              frames: this.anims.generateFrameNumbers('sprites', { start: 76, end: 77 }),
              frameRate: 8,
              repeat: -1,
            });
        
            this.anims.create({
              key: 'swimRed',
              frames: this.anims.generateFrameNumbers('sprites', { start: 78, end: 79 }),
              frameRate: 8,
              repeat: -1,
            });

            this.anims.create({
                key: 'swimOrange',
                frames: this.anims.generateFrameNumbers('sprites', { start: 80, end: 81 }),
                frameRate: 8,
                repeat: -1,
              });

              this.anims.create({
                key: 'greenFish',
                frames: this.anims.generateFrameNumbers('sprites', { start: 72, end: 73 }),
                frameRate: 8,
                repeat: -1,
              });

              this.anims.create({
                key: 'purpleFish',
                frames: this.anims.generateFrameNumbers('sprites', { start: 74, end: 75 }),
                frameRate: 8,
                repeat: -1,
              });

             this.anims.create({
                key: 'greenPlant',
                frames: this.anims.generateFrameNumbers('sprites', { start: 30, end: 31 }),
                frameRate: 2,
                repeat: -1,
              });

              this.anims.create({
                key: 'purplePlant',
                frames: this.anims.generateFrameNumbers('sprites', { start: 11, end: 12 }),
                frameRate: 2,
                repeat: -1,
              });

              this.anims.create({
                key: 'bluePlant',
                frames: this.anims.generateFrameNumbers('sprites', { start: 66, end: 67 }),
                frameRate: 2,
                repeat: -1,
              });
          }
        
          createRandomFishes(): void {
            for (let i = 0; i < this.maxFish; i++) {
              const x = Phaser.Math.Between(0, this.scale.width);
              const y = Phaser.Math.Between(0, this.waterHeight);
              const vx = Phaser.Math.FloatBetween(-100, 100); // Random velocity
              const vy = Phaser.Math.FloatBetween(-100, 100);
              const type = Phaser.Math.RND.pick(this.fishTypes); // Random type
        
              this.createFish(x, y, vx, vy, type);
            }
          }


        createFish(x: number, y: number, vx: number, vy: number, _animationKey: string): void {

          const entityId = this.world.createEntity();

          const sprite = this.add.sprite(x, y, 'sprites').play(_animationKey).setDepth(10);
          const gameObject: GameObjectComponent = { sprite, type: 'fish' };
          const position: Position = { x, y };
          const speed = Phaser.Math.Between(50, 100);  // Random speed for each fish
          const velocity: Velocity = { vx: Phaser.Math.Between(-this.fishSpeed, this.fishSpeed), vy: Phaser.Math.Between(-this.fishSpeed, this.fishSpeed), speed };
        
         // debugger
          this.world.addComponent<GameObjectComponent>(entityId, 'gameObject', gameObject);
          this.world.addComponent<Position>(entityId, 'position', position);
          this.world.addComponent<Velocity>(entityId, 'velocity', velocity);
        }  

        createPlants(): void {
          const plantCount = 25;
          for (let i = 0; i < plantCount; i++) {
            const type = Phaser.Math.RND.pick(this.plantsTypes); // Random type
            const x = Phaser.Math.Between(50, this.scale.width - 50);
            const y = Phaser.Math.Between(this.scale.height - 222, this.scale.height - 50);
        
            const entityId = this.world.createEntity();
        
          //  const sprite = this.add.sprite(x, y, 'sprites').setDepth(5);
            const sprite = this.add.sprite(x, y, 'sprites').play(type).setDepth(5);
            const gameObject: GameObjectComponent = { sprite, type: 'plant' };
            const position: Position = { x, y };
        
            this.world.addComponent(entityId, 'position', position);
            this.world.addComponent(entityId, 'gameObject', gameObject);
            this.world.addComponent(entityId, 'size', { currentSize: 1.0 }); // Initial size
          }
        }
        
    }
