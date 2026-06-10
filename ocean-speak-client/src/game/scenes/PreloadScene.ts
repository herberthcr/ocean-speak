import { Scene } from 'phaser';
import { BACKGROUNDS, SHADERS, ASSETS, IMAGES, SCENES, FONTS, SOUNDS } from '../global/Constants';
import { KANA_ITEMS, VOCAB_ITEMS } from '../../data/content';

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
        this.load.image(IMAGES.BACK, 'back.png');
        

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
        this.load.audio(SOUNDS.ACHIEVEMENT_SOUND, 'sounds/achievement.mp3');
        this.load.audio(SOUNDS.MOUSE_OVER_SOUND, 'sounds/mouse_over_sound.wav');
        this.load.audio(SOUNDS.MOUSE_CLICK_SOUND, 'sounds/mouse_click_sound.wav');

        // Komorebi: pronunciation clips (edge-tts, ADR-0008). Keyed by content audio id —
        // kana morae (hira_*) and curated vocabulary words (word_*, modo palabras).
        KANA_ITEMS.forEach((item) => {
            this.load.audio(item.audio, `audio/${item.audio}.mp3`);
        });
        VOCAB_ITEMS.forEach((v) => {
            this.load.audio(v.audio, `audio/${v.audio}.mp3`);
        });
    }

    create() {
        this.input.setDefaultCursor('url(assets/cursor.png), pointer');  // Custom cursor for student
        this.generateKomorebiTextures();

        // Boot into the Komorebi mode-select menu (Relax/Tiempo/Libre); the legacy Splash/Menu
        // remain for reference. Gate on the JP font so kana render crisp from the first frame.
        const startMenu = () => this.scene.start(SCENES.MODE_SELECT);

        if (document.fonts?.load) {
            // The sample text forces the CJK subsets we draw at boot (menu kanji icons + title)
            // to be fetched before any canvas text renders — canvas won't repaint on late fonts.
            const sample = '禅時語魚こもれび';
            Promise.all([
                document.fonts.load('400 44px "Noto Sans JP"', sample),
                document.fonts.load('700 44px "Noto Sans JP"', sample),
            ]).then(() => startMenu()).catch(() => startMenu());
        } else {
            startMenu();
        }
    }

    // Komorebi look: small textures drawn at runtime (no art assets needed for the demo).
    private generateKomorebiTextures(): void {
        // Faceted crystal gem — replaces Ocean Speak's plants as the chargeable reward.
        const gem = this.make.graphics({ x: 0, y: 0 }, false);
        gem.fillStyle(0x9ff1f6, 1); gem.fillTriangle(32, 4, 8, 34, 56, 34);   // crown
        gem.fillStyle(0x39c0c8, 1); gem.fillTriangle(8, 34, 32, 84, 32, 34);  // left facet
        gem.fillStyle(0x1f6f78, 1); gem.fillTriangle(56, 34, 32, 84, 32, 34); // right facet
        gem.lineStyle(2, 0xffffff, 0.7); gem.lineBetween(14, 30, 30, 12);     // glint
        gem.generateTexture('crystalGem', 64, 88);
        gem.destroy();

        // Komorebi light shaft (white→transparent vertical gradient; tinted/rotated in scenes).
        const shaft = this.make.graphics({ x: 0, y: 0 }, false);
        shaft.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0.55, 0.55, 0, 0);
        shaft.fillRect(0, 0, 180, 620);
        shaft.generateTexture('lightShaft', 180, 620);
        shaft.destroy();

        // Falling petal/leaf.
        const petal = this.make.graphics({ x: 0, y: 0 }, false);
        petal.fillStyle(0xf6c9d4, 1);
        petal.fillEllipse(8, 5, 14, 8);
        petal.generateTexture('petal', 16, 10);
        petal.destroy();
    }
}
