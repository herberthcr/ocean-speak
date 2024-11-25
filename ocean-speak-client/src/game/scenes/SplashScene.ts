import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { ECSWorld } from '../ecs/ECSWorld';
import { InputSystem } from '../systems/InputSystem';
import { DEFAULT_DIFFICULTY, BACKGROUNDS, SHADERS } from '../global/Constants';

export class SplashScene extends Scene
{
    private logo: any;
    private world: ECSWorld;
    constructor ()
    {
        super('SplashScene');
        this.logo = null;
    }

    create ()
    {
        this.add.image(0, 0, BACKGROUNDS.OCEAN_COMPLETE).setOrigin(0);
        this.logo =  this.add.image(512, 350, 'logo').setDepth(100).setScale(0.80);
        this.add.shader(SHADERS.TUNNEL_SHADER,  0,0, this.scale.width, this.scale.height).setOrigin(0);

        const fx = this.logo.postFX.addShine(0.3, .2, 1);
        this.add.tween({
          targets:  this.logo,
          scaleX: 0.81,
          scaleY: 0.81,
          ease: "Elastic", 
          duration: Phaser.Math.Between(10000,16000),
          repeat: -1, // -1: infinity
          yoyo: false
        });
        
        EventBus.emit('current-scene-ready', this);
        // Create ECS world and add the State component
        this.world = new ECSWorld();
        const stateEntity = this.world.createEntity();
        this.world.addComponent(stateEntity, 'state', { phase: 'intro' });
    
        // Add Input System
        this.world.addSystem(new InputSystem(this, this.world));
   }
 
   update(time: number, delta: number): void {
     this.world.update(delta); // Update the ECS world
   }

    playGame ()
    {
        this.scene.start('UnderWaterScene');
    }
}
