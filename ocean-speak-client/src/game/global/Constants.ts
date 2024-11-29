export const SCREEN = {
    WIDTH: 1024,
    HEIGHT: 768,
    WATERHEIGHT: 576
};

export const DIFFICULTY = {
    EASY: {
        FISH_COUNT: 25,
        FISH_BANK_COUNT: 1,
        PLANT_COUNT: 3,
        FISH_BASE_SPEED: 35,
        PLANT_SWAY: { MIN: 2000, MAX: 3000 },
        MAX_SCORE: 5, // Winning condition
        MAX_SPEECH_SCORE: 3, // Winning condition
        RULES_MAX_SCORE: '5 Interaction points to win',
        RULES_MAX_SPEECH_SCORE: '3 Speech points to win',
    },
    MEDIUM: {
        FISH_COUNT: 40,
        PLANT_COUNT: 7,
        FISH_BANK_COUNT: 2,
        FISH_BASE_SPEED: 75,
        PLANT_SWAY: { MIN: 1500, MAX: 2500 },
        MAX_SCORE: 10, // Winning condition
        MAX_SPEECH_SCORE: 5, // Winning condition
        RULES_MAX_SCORE: '10 Interaction points to win',
        RULES_MAX_SPEECH_SCORE: '5 Speech points to win',
    },
    HARD: {
        FISH_COUNT: 75,
        PLANT_COUNT: 10,
        FISH_BANK_COUNT: 3,
        FISH_BASE_SPEED: 90,
        PLANT_SWAY: { MIN: 1000, MAX: 2000 },
        MAX_SCORE: 15, // Winning condition
        MAX_SPEECH_SCORE: 10, // Winning condition
        RULES_MAX_SCORE: '15 Interaction points to win',
        RULES_MAX_SPEECH_SCORE: '10 Speech points to win',
    },
};

// Constants.ts
export const ACHIEVEMENTS = {
    FIVE_INTERACTIONS_STREAK: 'Five Interactions in a Row!. You are the best!',
    TEN_INTERACTIONS_STREAK: 'Ten Interactions Correct Answers! Osom!',
    FIVE_SPEECH_STREAK: 'Five Speech Points streak! Amazing!',
    TEN_SPEECH_STREAK: 'Ten Speech Points streak! You are incredible',
    MAX_PLANT_GROWTH_ACHIEVEMENT: 'Master Gardener! All Plants Fully Grown!',
    MIN_PLANT_GROWTH_GAME_OVER: 'Ooppps! Plants Wilted!!',
}

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
    SPRITES: 'sprites',
    MICS: 'mics',
    CURSOR: 'cursor',
    NO_CURSOR: 'nocursor',
    BACK: 'back'
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
    INCORRECT_SOUND: 'incorrect_sound',
    FANFARE_SOUND: 'fanfare_sound',
    COUNTER_SOUND: 'counter_sound',
    WOOSH_SOUND: 'woosh_sound',
    ACHIEVEMENT_SOUND: 'achievement',
    MOUSE_OVER_SOUND: 'mouse_over_sound',
    MOUSE_CLICK_SOUND: 'mouse_click_sound'  
};

export const WRONG_ANSWERS = {
    TRY: 'Try Again!',
    OOPS: 'Ooops!',
    NOT_FOUND: '404 Not Found!',
    NOT_QUITE: 'Not quite!',
    YOUCAN: 'You can do it!',
    INCORRECT: 'Incorrect!',
    ASK: 'Ask for help!',
    CLOSE: 'So close!',
    OOPSIE: 'Oopsie Daisy!',
    ALMOST: 'Almost there!',
    KEEP_GOING: 'Keep Going!',
    NOT_THIS_TIME: 'Not this time!',
    NICE_TRY: 'Nice Try!',
    UH_OH: 'Uh-oh!',
    HMMM: 'Hmm... Try Again!',
    DONT_WORRY: "Don't worry!",
    NEXT_TIME: 'Next time!',
    YIKES: 'Yikes!',
    OOF: 'Oof! Try again!',
    ZONK: 'Zonk! Try harder!',
    WHOOPS: 'Whoopsie!',
    NOPE: 'Nope!',
    OH_WELL: 'Oh well!',
    GOSH: 'Gosh, not quite!',
    DRATS: 'Drats!',
    MISSED: 'Missed it!',
    WRONGWAY: 'Wrong way!',
    TRYHARDER: 'Try harder!',
    GOTCHA: 'Gotcha! Try again!',
    BACK_TO_IT: 'Back to it!',
    GIVE_ANOTHER: 'Give it another go!',
  };

  export const CORRECT_ANSWERS = {
    CORRECT: 'Correct!',
    YOU: 'You are the best!',
    SUPERB: 'Superb!',
    COOL: 'Cool!',
    INCREDIBLE: 'Incredible!',
    YEAH: 'Yeah!',
    HERO: 'You are my hero!',
    FANTASTIC: 'Fantastic!',
    AWESOME: 'Awesome!',
    GREAT_JOB: 'Great Job!',
    YOU_DID_IT: 'You did it!',
    WELL_DONE: 'Well done!',
    AMAZING: 'Amazing!',
    BRAVO: 'Bravo!',
    YIPPEE: 'Yippee!',
    PERFECT: 'Perfect!',
    NAILED_IT: 'Nailed it!',
    EXCELLENT: 'Excellent!',
    TERRIFIC: 'Terrific!',
    WHOO_HOO: 'Whoo-hoo!',
    YES: 'Yes!',
    SUPERSTAR: 'Superstar!',
    WINNER: 'Winner!',
    GOLD_STAR: 'Gold star!',
    HIGH_FIVE: 'High Five!',
    KEEP_IT_UP: 'Keep it up!',
    LEGENDARY: 'Legendary!',
    GENIUS: 'Genius!',
    CHAMPION: 'Champion!',
    SPOT_ON: 'Spot on!',
    WONDERFUL: 'Wonderful!',
    BULLSEYE: 'Bullseye!',
    KNOCKED_IT: 'Knocked it out!',
    SPLENDID: 'Splendid!',
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
    FONT_SIZE_MEDIUM_BIG: 42,
    FONT_SIZE_BIG: 48,
    FONT_SIZE_VERY_BIG: 64,
    FONTS_KEYS: {
        PIXEL_FONT: 'pixelfont'
    },

};


// Define a color theme map
export const COLOR_THEMES = {
    blue: {
      color: '#ADD8E6', // Light Blue
      stroke: '#1E90FF', // Dodger Blue
      shadow: '#00008B', // Dark Blue
    },
    orange: {
      color: '#FFA500', // Orange
      stroke: '#FF8C00', // Dark Orange
      shadow: '#FF4500', // Orange Red
    },
    red: {
      color: '#FF6347', // Tomato
      stroke: '#FF4500', // Orange Red
      shadow: '#8B0000', // Dark Red
    },
    brown: {
        color: '#D2B48C', // Tan
        stroke: '#8B4513', // Saddle Brown
        shadow: '#4F2F1D', // Dark Brown
    },
    grey: {
      color: '#D3D3D3', // Light Grey
      stroke: '#A9A9A9', // Dark Grey
      shadow: '#696969', // Dim Grey
    },
    purple: {
      color: '#9370DB', // Medium Purple
      stroke: '#BA55D3', // Orchid
      shadow: '#4B0082', // Indigo
    },
    green: {
      color: '#00FF00', 
      stroke: '#006400',
      shadow: '#32CD32', 
    },
    yellow: {
        color: '#FFFF00', // Bright Yellow
        stroke: '#FFD700', // Gold
        shadow: '#B8860B', // Dark Goldenrod
      },
      cyan: {
        color: '#00FFFF', // Cyan
        stroke: '#00CED1', // Dark Turquoise
        shadow: '#008B8B', // Dark Cyan
      },
      pink: {
        color: '#FFC0CB', // Pink
        stroke: '#FF69B4', // Hot Pink
        shadow: '#C71585', // Medium Violet Red
      },
      gold: {
        color: '#FFD700', // Gold
        stroke: '#DAA520', // Goldenrod
        shadow: '#B8860B', // Dark Goldenrod
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
    DEFAULT_FISH_COUNT: 35, // Default number of fish
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
    COUNT: 10, // Default number of plants MAX IS 10 DUE to scatter logic
    IMAGE: IMAGES.SPRITES,
    PLANTS_FRAMERATE: 2,
    PLANTS_SCALE: 1,
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

export const PLANT_GROWTH = {
    SCALE_INCREMENT: 0.3, // Growth per correct answer
    MAX_SCALE: 3.0, // Maximum scale for plants
    MIN_SCALE: 0.3, // Minimum scale for plants
};

export const DEFAULT_DIFFICULTY = DIFFICULTY.MEDIUM;

export const QUESTIONS = [
    { ID: 1, QUESTION: 'Click the red fish', ANSWER: FISH_ANIMATIONS.SWIM_RED, SPEECH_ANSWER: 'RED FISH', COLOR: 'red' },  // Red
    { ID: 2, QUESTION: 'Click the blue fish', ANSWER: FISH_ANIMATIONS.SWIM_BLUE, SPEECH_ANSWER: 'BLUE FISH', COLOR: 'blue' },  // Blue
    { ID: 3, QUESTION: 'Click the orange fish', ANSWER: FISH_ANIMATIONS.SWIM_ORANGE, SPEECH_ANSWER: 'ORANGE FISH', COLOR: 'orange' },  // Orange
    { ID: 4, QUESTION: 'Click the green fish', ANSWER: FISH_ANIMATIONS.SWIM_GREEN, SPEECH_ANSWER: 'GREEN FISH', COLOR: 'green' },  // Green
    { ID: 5, QUESTION: 'Click the globe fish', ANSWER: FISH_ANIMATIONS.SWIM_GLOBE, SPEECH_ANSWER: 'GLOBE FISH', COLOR: 'brown' },  // Yellow
    { ID: 6, QUESTION: 'Click the grey fish', ANSWER: FISH_ANIMATIONS.SWIM_GREY, SPEECH_ANSWER: 'GREY FISH', COLOR: 'grey' },  // Grey
    { ID: 7, QUESTION: 'Click the purple fish', ANSWER: FISH_ANIMATIONS.SWIM_PURPLE, SPEECH_ANSWER: 'PURPLE FISH', COLOR: 'purple' },  // Purple
    { ID: 8, QUESTION: 'Click the purple plant', ANSWER: PLANTS_ANIMATIONS.PLANT_ANIM_PURPLE, SPEECH_ANSWER: 'PURPLE PLANT', COLOR: 'purple' },  // Purple
    { ID: 9, QUESTION: 'Click the green plant', ANSWER: PLANTS_ANIMATIONS.PLANT_ANIM_GREEN, SPEECH_ANSWER: 'GREEN PLANT', COLOR: 'green' },  // Green
    { ID: 10, QUESTION: 'Click the blue plant', ANSWER: PLANTS_ANIMATIONS.PLANT_ANIM_BLUE, SPEECH_ANSWER: 'BLUE PLANT', COLOR: 'blue' },  // Blue
    { ID: 11, QUESTION: 'Click the orange plant', ANSWER: PLANTS_ANIMATIONS.PLANT_ANIM_ORANGE, SPEECH_ANSWER: 'ORANGE PLANT', COLOR: 'orange' },  // Orange
];

// Define colors for each role
export const PLAYER_COLORS = {
    TEACHER: 0xFF0000,  // Red for the Teacher
    STUDENT: 0xFFFF00,  // Yellow for the Student
    OTHER_PLAYER: 0x0000FF  // Blue for other players
};

export const AQUATIC_CHARACTERS = [
    // SpongeBob SquarePants Characters
    'SpongeBob',
    'Patrick Star',
    'Squidward',
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
    'Chill Guy',

    //One Piece
    'Luffy',
    'Zoro',
    'Sanji',
    'Nami',
    'Nico Robin',
    'Jinbei',
];