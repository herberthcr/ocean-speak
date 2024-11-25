// Constants.ts
export const ASSETS = 'assets';

export const TILEMAP = {
    KEY: 'underwaterMap',
    TILESET_IMAGE: 'tilesetImage',
    BACKGROUND_LAYER: 'backgroundLayer',
};

export const BACKGROUNDS = {
    WATER_EFFECT: 'waterEffect',
    OCEAN_COMPLETE: 'ocean',
    OCEAN_REVERSE: 'ocean_reverse',
};

export const IMAGES = {
    BUBBLES: 'bubbles',
    LOGO: 'logo',
    OCEAN_TILES: 'ocean_tiles',
    OCEAN_TILEMAP: 'ocean_tilemap',
    SPRITES: 'sprites'
};

export const SCENES = {
    SPLASH_SCREEN: 'SplashScene',
    MENU: 'MenuScene',
    UNDERWATER_SCENE: 'UnderWaterScene'
};

export const PARALLAX = {
    TILE_LAYERS: [
        { imageKey: BACKGROUNDS.OCEAN_REVERSE, speed: 0.1, depth: -1 },
    ],
    SPRITES: [
        { imageKey: BACKGROUNDS.FOG, speed: 50, direction: { x: 1, y: 0 } },
    ],
};

export const SPRITES = {
    FISH_SPRITESHEET: 'fishSprites',
    PLANT_SPRITESHEET: 'plantSprites',
};

export const SHADERS = {
    WATER_SHADER: 'waterShader',
    TUNNEL_SHADER: 'tunneShader'
};

export const ANIMATIONS = {
    SWIM_BLUE: 'swimBlue',
    SWIM_RED: 'swimRed',
    SWIM_GREEN: 'swimGreen',
    SWIM_YELLOW: 'swimYellow',
    SWIM_PURPLE: 'swimPurple',
};

export const FISH = {
    COUNT: 10, // Default number of fish
    OSCILLATION_DURATION: { MIN: 1000, MAX: 1500 },
    WOBBLE_ANGLE: { MIN: -5, MAX: 5 },
};

export const PLANTS = {
    COUNT: 5, // Default number of plants
    SWAY_DURATION: { MIN: 1500, MAX: 2000 },
    SWAY_ANGLE: { MIN: -5, MAX: 5 },
};

export const SCREEN = {
    WIDTH: 1024,
    HEIGHT: 768,
    WATERHEIGHT: 576
};

export const DIFFICULTY = {
    EASY: {
        FISH_COUNT: 5,
        PLANT_COUNT: 3,
        FISH_SPEED: { MIN: 50, MAX: 100 },
        PLANT_SWAY: { MIN: 2000, MAX: 3000 },
    },
    MEDIUM: {
        FISH_COUNT: 10,
        PLANT_COUNT: 5,
        FISH_SPEED: { MIN: 100, MAX: 150 },
        PLANT_SWAY: { MIN: 1500, MAX: 2500 },
    },
    HARD: {
        FISH_COUNT: 15,
        PLANT_COUNT: 8,
        FISH_SPEED: { MIN: 150, MAX: 200 },
        PLANT_SWAY: { MIN: 1000, MAX: 2000 },
    },
};

export const DEFAULT_DIFFICULTY = DIFFICULTY.MEDIUM;