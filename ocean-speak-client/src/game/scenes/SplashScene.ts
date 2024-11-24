import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class SplashScene extends Scene
{
    private logo: any;
    constructor ()
    {
        super('SplashScene');
        this.logo = null;
    }

    create ()
    {
        
        this.add.image(512, 384, 'background');
        this.logo =  this.add.image(512, 350, 'logo').setDepth(100).setScale(0.80);

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
    }

    playGame ()
    {
        this.scene.start('UnderWaterScene');
    }
}
