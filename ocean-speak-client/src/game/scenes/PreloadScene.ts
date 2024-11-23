import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class PreloadScene extends Scene
{
    constructor ()
    {
        super('PreloadScene');
    }

    preload ()
    {
        this.load.setPath('assets');
      //  this.load.image('star', 'star.png');
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');

        // Preload tileset and spritesheet
        this.load.image('ocean_tiles', 'ocean_tiles.png'); // Path to tileset

	    // load the JSON file
	    this.load.tilemapTiledJSON('ocean_tilemap', 'ocean_tiles.json');

        this.load.spritesheet('fishSprites', 'ocean_tiles.png', {
            frameWidth: 64,
            frameHeight: 64,
          });
    }

    create ()
    {
        
        this.add.image(512, 384, 'background');
        this.add.image(512, 350, 'logo').setDepth(100);
        this.add.text(512, 490, 'Preload', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        EventBus.emit('current-scene-ready', this);
    }

    playGame ()
    {
        this.scene.start('UnderWaterScene');
    }
}
