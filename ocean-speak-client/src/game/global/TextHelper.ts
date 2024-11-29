import Phaser from 'phaser';
import { COLOR_THEMES } from './Constants';

export class TextHelper {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Pre-defined text styles
  static TEXT_STYLES = {
    default: {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ADD8E6',
      stroke: '#000000',
      strokeThickness: 8,
    },
    aquatic: {
      fontFamily: 'Comic Sans MS',
      fontSize: '32px',
      color: '#ADD8E6', // Light Blue
      stroke: '#1E90FF', // Dodger Blue
      strokeThickness: 10,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#00008B', // Dark Blue
        blur: 8,
        fill: true,
      },
    },
    // Add more general styles if needed
  };

  AddAquaticTextEffect(text: Phaser.GameObjects.Text) {
    this.scene.tweens.add({
      targets: text, // The text object
      y: text.y + 10, // Slight vertical movement (up and down)
      angle: { start: -2, end: 2 }, // Slight rotation back and forth
      duration: 3000, // Total time for one oscillation cycle
      ease: 'Sine.easeInOut', // Smooth easing for natural movement
      yoyo: true, // Reverse the movement
      repeat: -1, // Loop infinitely
    });
    
    this.scene.tweens.add({
      targets: text,
      scale: 1.05, // Slight scale up for a "breathing" effect
      duration: 4000, // Duration for one full scale up and down
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }
  

  // Create text with a specific style
  createStyledText(x: number, y: number, depth: number, fontSize: string = '32px' ,// Default to 32px
    text: string, style: any): Phaser.GameObjects.Text {
    style.fontSize = fontSize;
    return this.scene.add.text(x, y, text, style).setDepth(depth); ;
  }

  // Create text with a specific color theme
  createColoredText(x: number, y: number, depth: number, fontSize: string = '32px', // Default to 32px, 
                  text: string, colorKey: keyof typeof COLOR_THEMES): Phaser.GameObjects.Text {
    const theme = COLOR_THEMES[colorKey];
    if (!theme) {
      console.error(`Color theme "${colorKey}" not found.`);
      return this.scene.add.text(x, y, text, TextHelper.TEXT_STYLES.default).setDepth(depth);
    }

    return this.scene.add.text(x, y, text, {
      fontFamily: 'Comic Sans MS',
      fontSize: fontSize,
      color: theme.color,
      stroke: theme.stroke,
      strokeThickness: 8,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: theme.shadow,
        blur: 10,
        fill: true,
      },
    }).setDepth(depth);;
  }

  // Update the color theme of an existing text object
  updateTextColor(textObject: Phaser.GameObjects.Text, colorKey: keyof typeof COLOR_THEMES): void {
    const theme = COLOR_THEMES[colorKey];
    if (!theme) {
      console.error(`Color theme "${colorKey}" not found.`);
      return;
    }

    textObject.setStyle({
      color: theme.color,
      stroke: theme.stroke,
      strokeThickness: 8,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: theme.shadow,
        blur: 10,
        fill: true,
      },
    });
  }

  // Iterate through color themes dynamically
  iterateColorsWithDelay(textObject: Phaser.GameObjects.Text, delay: number = 1000): void {
    const colorKeys = Object.keys(COLOR_THEMES) as (keyof typeof COLOR_THEMES)[];
    let currentIndex = 0;

    this.scene.time.addEvent({
      delay: delay,
      repeat: colorKeys.length - 1,
      callback: () => {
        this.updateTextColor(textObject, colorKeys[currentIndex]);
        currentIndex = (currentIndex + 1) % colorKeys.length;
      },
    });
  }
}
