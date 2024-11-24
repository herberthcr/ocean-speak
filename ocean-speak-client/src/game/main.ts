
import { PreloadScene } from './scenes/PreloadScene';
import { UnderWaterScene } from './scenes/UnderWaterScene';
import { SplashScene } from './scenes/SplashScene';

import { AUTO, Game, Types } from 'phaser';


const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
   // backgroundColor: '#028af8',
    pixelArt: true,
    physics: {
      // Arcarde physics plugin, manage physics simulation
      default: 'arcade',
      arcade: {
      }
    },
    //fps: { forceSetTimeOut: true, target: 60 },
    scene: [
        PreloadScene, SplashScene, UnderWaterScene
    ]
};

const StartGame = (parent: any) => {
    return new Game({ ...config, parent });
}

export default StartGame;

