import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class PreloadScene extends Scene
{
    private logo: any;
    constructor ()
    {
        super('PreloadScene');
        this.logo = null;
    }

    preload ()
    {
        this.load.setPath('assets');
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'ocean-speech.png');

        // Preload tileset and spritesheet
        this.load.image('ocean_tiles', 'ocean_tiles.png'); // Path to tileset

	    // load the JSON file
	    this.load.tilemapTiledJSON('ocean_tilemap', 'ocean_tiles.json');

        this.load.spritesheet('sprites', 'ocean_tiles.png', {
            frameWidth: 64,
            frameHeight: 64,
          });
    }

    create() {
        this.scene.start("SplashScene");
    }
}
