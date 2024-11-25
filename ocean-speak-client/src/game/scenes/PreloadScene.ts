import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { BACKGROUNDS, SHADERS, ASSETS, IMAGES, SCENES } from '../global/Constants';

export class PreloadScene extends Scene
{
    constructor ()
    {
        super('PreloadScene');
    }

    preload ()
    {
        this.load.setPath(ASSETS);

        // Add backgrounds
        this.load.image(BACKGROUNDS.OCEAN_COMPLETE, 'ocean.png');
        this.load.image(BACKGROUNDS.OCEAN_REVERSE, 'ocean_reverse.png');
        this.load.image(BACKGROUNDS.WATER_EFFECT, 'waterEffect.png');

        // Add Images
        this.load.atlas(IMAGES.BUBBLES, 'bubbles.png', 'bubbles.json')
        this.load.image(IMAGES.LOGO, 'ocean-speech.png');
        // Preload tileset and spritesheet
        this.load.image(IMAGES.OCEAN_TILES, 'ocean_tiles.png'); // Path to tileset

        // Add Shaders
        this.load.glsl(SHADERS.WATER_SHADER, 'shaders/waterShader.frag'); // Water ripple shader file
        this.load.glsl(SHADERS.TUNNEL_SHADER, 'shaders/tunnel.frag'); // Splash shader file

	    // load the JSON file
	    this.load.tilemapTiledJSON(IMAGES.OCEAN_TILEMAP, 'ocean_tiles.json');

        this.load.spritesheet(IMAGES.SPRITES, 'ocean_tiles.png', {
            frameWidth: 64,
            frameHeight: 64,
          });
    }

    create() {
        this.scene.start(SCENES.SPLASH_SCREEN);
    }
}
