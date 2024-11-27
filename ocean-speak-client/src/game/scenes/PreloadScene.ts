import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { BACKGROUNDS, SHADERS, ASSETS, IMAGES, SCENES, FONTS, SOUNDS } from '../global/Constants';

export class PreloadScene extends Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        this.load.setPath(ASSETS);

        // Add backgrounds
        this.load.image(BACKGROUNDS.OCEAN_COMPLETE, 'ocean_complete.png');
        this.load.image(BACKGROUNDS.OCEAN_REVERSE, 'ocean_reverse_complete.png');
        this.load.image(BACKGROUNDS.WATER_EFFECT, 'waterEffect.png');
        this.load.image(BACKGROUNDS.BLUE_BACKGROUND, 'bg2.png');

        // Add Images
        this.load.atlas(IMAGES.BUBBLES, 'bubbles.png', 'bubbles.json')
        this.load.image(IMAGES.LOGO, 'ocean-speech.png');
        this.load.image(IMAGES.CURSOR, 'cursor.png');
        this.load.image(IMAGES.NO_CURSOR, 'cursor_no.png');
        

        // Preload tileset and spritesheet
        this.load.image(IMAGES.OCEAN_TILES, 'ocean_tiles.png'); // Path to tileset
        this.load.spritesheet(IMAGES.MICS, 'sound_icons.png', { frameWidth: 32, frameHeight: 32 });

        // Add Shaders
        this.load.glsl(SHADERS.WATER_SHADER, 'shaders/waterShader.frag'); // Water ripple shader file
        this.load.glsl(SHADERS.TUNNEL_SHADER, 'shaders/tunnel.frag'); // Splash shader file

        // Fonts
        this.load.bitmapFont(FONTS.FONTS_KEYS.PIXEL_FONT, "fonts/pixelfont.png", "fonts/pixelfont.xml");

        // load the JSON file
        this.load.tilemapTiledJSON(IMAGES.OCEAN_TILEMAP, 'ocean_tiles.json');
        this.load.spritesheet(IMAGES.SPRITES, 'ocean_tiles.png', {
            frameWidth: 64,
            frameHeight: 64,
        });

        //sounds
        this.load.audio(SOUNDS.OCEAN_WAVES, 'sounds/ocean_sound.wav');
        this.load.audio(SOUNDS.CORRECT_SOUND, 'sounds/correct_sound.mp3');
        this.load.audio(SOUNDS.INCORRECT_SOUND, 'sounds/incorrect_sound.mp3');
        this.load.audio(SOUNDS.FANFARE_SOUND, 'sounds/fanfare.wav');
        this.load.audio(SOUNDS.COUNTER_SOUND, 'sounds/counter.flac');
        this.load.audio(SOUNDS.WOOSH_SOUND, 'sounds/woosh.mp3');

    }

    create() {
        this.input.setDefaultCursor('url(assets/cursor.png), pointer');  // Custom cursor for student
        this.scene.start(SCENES.SPLASH_SCREEN);
    }
}
