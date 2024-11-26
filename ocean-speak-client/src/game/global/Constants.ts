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
    BLUE_BACKGROUND: 'bg2',
};

export const IMAGES = {
    BUBBLES: 'bubbles',
    LOGO: 'logo',
    OCEAN_TILES: 'ocean_tiles',
    OCEAN_TILEMAP: 'ocean_tilemap',
    SPRITES: 'sprites'
};

export const MENU_STATES = {
    PLAYER_TTPE: 'playerTypeSelection',
    ENTER_NAME: 'nameSelection',
    DIFFICULTY_SELECTION: 'difficultySelection',
    SESSION_MODE: 'sessionMode', // Online - Offiline
    RELAXING_SESSION: 'relaxingMode', 
    PLAY_GAME: 'playGame', 
};


export const SCENES = {
    SPLASH_SCREEN: 'SplashScene',
    MENU: 'MenuScene',
    UNDERWATER_SCENE: 'UnderWaterScene'
};

export const SOUNDS = {
    OCEAN_WAVES: 'ocean_waves',
    CORRECT_SOUND: 'correct_sound',
    INCORRECT_SOUND: 'incorrect_sound'
};

export const ROLES = {
    TEACHER: 'Teacher',
    STUDENT: 'Student'
};

export const PARALLAX = {
    TILE_LAYERS: [
        { imageKey: BACKGROUNDS.OCEAN_REVERSE, speed: 0.1, depth: -1 },
    ],
    SPRITES: [
        { imageKey: BACKGROUNDS.WATER_EFFECT, speed: 50, direction: { x: 1, y: 0 } },
    ],
};

export const SHADERS = {
    WATER_SHADER: 'waterShader',
    TUNNEL_SHADER: 'tunneShader'
};

export const FONTS = {
    FONT_SIZE_SMALL: 24,
    FONT_SIZE_MEDIUM: 32,
    FONT_SIZE_BIG: 48,
    FONTS_KEYS: {
        PIXEL_FONT: 'pixelfont'
    },
    
};

export const FISH_ANIMATIONS = {
    SWIM_BLUE: 'blueFish',
    SWIM_RED: 'redFish',
    SWIM_ORANGE: 'orangeFish',
    SWIM_GREEN: 'greenFish',
    SWIM_PURPLE: 'purpleFish',
    SWIM_GREY: 'greyFish',
    SWIM_GLOBE: 'gLobeFish'
};

export const PLANTS_ANIMATIONS = {
    PLANT_ANIM_GREEN: 'greenPlant',
    PLANT_ANIM_PURPLE: 'purplePlant',
    PLANT_ANIM_BLUE: 'bluePlant',
    PLANT_ANIM_ORANGE: 'orangePlant'
};

export const FISH = {
    DEFAULT_FISH_COUNT: 30, // Default number of fish
    FISH_BANK_COUNT: 3, // MAX IS 3 DUE to scatter logic
    IMAGE: IMAGES.SPRITES,
    FISH_FRAMERATE: 3,
    OSCILLATION_DURATION: { MIN: 1000, MAX: 1500 },
    WOBBLE_ANGLE: { MIN: -5, MAX: 5 },
    BLUE_FISH: {
        ANIMATION: FISH_ANIMATIONS.SWIM_BLUE,
        FRAMES: { START: 76, END: 77 },
        FISH_SPEED: 25
    },
    RED_FISH: {
        ANIMATION: FISH_ANIMATIONS.SWIM_RED,
        FRAMES: { START: 78, END: 79 },
        FISH_SPEED: 25
    },

    GREEN_FISH: {
        ANIMATION: FISH_ANIMATIONS.SWIM_GREEN,
        FRAMES: { START: 72, END: 73 },
        FISH_SPEED: 25
    },

    ORANGE_FISH: {
        ANIMATION: FISH_ANIMATIONS.SWIM_ORANGE,
        FRAMES: { START: 80, END: 81 },
        FISH_SPEED: 25
    },
    PURPLE_FISH: {
        ANIMATION: FISH_ANIMATIONS.SWIM_PURPLE,
        FRAMES: { START: 74, END: 75 },
        FISH_SPEED: 25
    },
    GLOBE_FISH: {
        ANIMATION: FISH_ANIMATIONS.SWIM_GLOBE,
        FRAMES: { START: 100, END: 101 },
        FISH_SPEED: 25
    },
    GREY_FISH: {
        ANIMATION: FISH_ANIMATIONS.SWIM_GREY,
        FRAMES: { START: 102, END: 103 },
        FISH_SPEED: 25
    },
};

export const PLANTS = {
    COUNT: 14, // Default number of plants MAX IS 14 DUE to scatter logic
    IMAGE: IMAGES.SPRITES,
    PLANTS_FRAMERATE: 2,
    SWAY_DURATION: { MIN: 1500, MAX: 2000 },
    SWAY_ANGLE: { MIN: -5, MAX: 5 },
    GROWING_SAND_HEIGHT: 190,
    PLANTS_MIN_GROWING_SPACE: 100,
    BLUE_PLANT: {
        ANIMATION: PLANTS_ANIMATIONS.PLANT_ANIM_BLUE,
        FRAMES: { START: 66, END: 67 },
    },
    PURPLE_PLANT: {
        ANIMATION: PLANTS_ANIMATIONS.PLANT_ANIM_PURPLE,
        FRAMES: { START: 11, END: 12 },
    },
    ORANGE_PLANT: {
        ANIMATION: PLANTS_ANIMATIONS.PLANT_ANIM_ORANGE,
        FRAMES: { START: 50, END: 51 },
    },
    GREEN_PLANT: {
        ANIMATION: PLANTS_ANIMATIONS.PLANT_ANIM_GREEN,
        FRAMES: { START: 30, END: 31 },
    },
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
        FISH_BASE_SPEED: 25,
        PLANT_SWAY: { MIN: 2000, MAX: 3000 },
    },
    MEDIUM: {
        FISH_COUNT: 10,
        PLANT_COUNT: 5,
        FISH_BASE_SPEED: 30,
        PLANT_SWAY: { MIN: 1500, MAX: 2500 },
    },
    HARD: {
        FISH_COUNT: 15,
        PLANT_COUNT: 8,
        FISH_BASE_SPEED: 35,
        PLANT_SWAY: { MIN: 1000, MAX: 2000 },
    },
};

export const DEFAULT_DIFFICULTY = DIFFICULTY.MEDIUM;

export const AQUATIC_CHARACTERS = [
    // SpongeBob SquarePants Characters
    'SpongeBob SquarePants',
    'Patrick Star',
    'Squidward Tentacles',
    'Mr. Krabs',
    'Sandy Cheeks',
    'Plankton',
    'Gary the Snail',
    'Pearl Krabs',

    // Finding Nemo/Finding Dory Characters
    'Nemo',
    'Dory',
    'Marlin',
    'Bruce',
    'Crush',
    'Squirt',

    // The Little Mermaid Characters
    'Ariel',
    'Flounder',
    'Sebastian',
    'King Triton',
    'Ursula',

    // Shark Tale Characters
    'Oscar',
    'Lenny',
    'Angie',

    // Other Popular Aquatic Characters
    'Aquaman',
    'King Neptune',
    'Mermaid Man',
    'Barnacle Boy',
    'Jabberjaw',

    //meme
    'Chill Guy'
];