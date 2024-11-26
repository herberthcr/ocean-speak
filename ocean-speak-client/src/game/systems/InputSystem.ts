import { ECSWorld } from '../ecs/ECSWorld';
import Phaser from 'phaser';
import { System } from './System';
import { Size } from '../components/Size';
import { Velocity } from '../components/Velocity';
import { UnderWaterScene } from '../scenes/UnderWaterScene';
import {  FONTS, SOUNDS, IMAGES, SCENES } from '../global/Constants';
import { GameStateSystem } from './GameStateSystem';

export class InputSystem extends System {

  private gameStateSystem: GameStateSystem; // Reference to the game state manager
  private correctAnswersText: Phaser.GameObjects.BitmapText;

  constructor(scene: Phaser.Scene, world: ECSWorld, gameStateSystem: GameStateSystem) {
    super(world, scene);

    // Set up global input listener
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.gameStateSystem = gameStateSystem;
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const x = pointer.x;
    const y = pointer.y;

    // Query for the State component
    const stateEntity = this.world.queryEntities(['state'])[0];
    const state = this.world.getComponent(stateEntity, 'state');

    if (state.phase === 'gameplay') {
      const entities = this.world.queryEntities(['gameObject']);


      for (const entityId of entities) {
        const gameObject = this.world.getComponent(entityId, 'gameObject');


        const size = this.world.getComponent<Size>(entityId, 'size');
        const velocity = this.world.getComponent(entityId, 'velocity') as Velocity;

        const sprite = gameObject.sprite;
        if (gameObject.type === 'fish') {
          
          const bounds = sprite.getBounds();
          const fishSprite = sprite as Phaser.GameObjects.Sprite;

          if (bounds.contains(x, y)) {
            // Disable collision
            velocity.disabled = true;
            this.handleObjectClick(fishSprite); // Trigger the effect on click
          }

          // Reset collision and visual effects after 1 second
          this.scene.time.delayedCall(300, () => {
            //  velocity.disabled = false;
            //this.resetFish(gameObject.sprite);
            // Remove the tint
            velocity.disabled = false;
            fishSprite.clearTint();
          });
        }

        if (gameObject.type === 'plant') {

          const bounds = gameObject.sprite.getBounds();
          const plantSprite = sprite as Phaser.GameObjects.Sprite;

          const growFactor = 0.2;
          // Check if the click/tap is on the plant
          if (bounds.contains(x, y)) {
            //this.growAllPlants(0.2);
            this.handleObjectClick(plantSprite);
          }
        }
      }
    }
  }

  handleObjectClick(sprite: Phaser.GameObjects.Sprite) {
    const scene = sprite.scene;
  
    const color = Math.random() < 0.5 ? 0x00ff00 : 0xff0000;

    // Create a circle centered on the fish
    const circle = scene.add.circle(sprite.x, sprite.y, 10, color, 0.5); // Semi-transparent white
    circle.setDepth(1); // Ensure it's rendered above the fish
  
    sprite.setTint(0x48bf53); // Greenish
    // Visual feedback
    this.scene.tweens.add({
      targets: sprite,
      scale: 2,
      duration: 150,
      yoyo: true,
      ease: 'Power1',
    });

      // Determine the text based on the color
   const textContent = color === 0xff0000?  "Incorrect" : "Correct";
   let growFactor = 0.2;
   
   // Create a bitmap text object near the fish
    const text = scene.add.bitmapText(sprite.x, sprite.y - 60,  FONTS.FONTS_KEYS.PIXEL_FONT, textContent, FONTS.FONT_SIZE_MEDIUM); // Font key and size
    if (textContent === 'Incorrect') {
      text.setTint(color); // Apply red tint only for "Incorrect"
      growFactor = -0.2;
      scene.sound.play(SOUNDS.INCORRECT_SOUND); // Preloaded key for the "Wrong" sound
    }else{
      scene.sound.play(SOUNDS.CORRECT_SOUND); // Preloaded key for the "Correct" sound
      this.gameStateSystem.incrementCorrectAnswers(); // Increment correct answers
    //  scene.correctAnswers++;
    this.scene.correctAnswersText.setText(`Correct: ${this.gameStateSystem.getCorrectAnswers()}`); // Update the counter
    }
    text.setDepth(2); // Ensure it's above the fish and circle

    this.growAllPlants(growFactor);

    // Tween to fade and destroy the text
    scene.tweens.add({
      targets: text,
      alpha: 0, // Fade out
      y: text.y - 20, // Move upward slightly
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy(); // Cleanup the text
      },
    });

    // Tween to grow and fade the circle
    scene.tweens.add({
      targets: circle,
      radius: 70, // Grow the circle to this size
      alpha: 0, // Fade out the circle
      duration: 700, // Duration of the effect
      ease: 'Cubic.easeOut',
      onComplete: () => {
        circle.destroy(); // Cleanup the circle
      },
    });

    
        // Check if the game should end
        if (this.gameStateSystem.getCorrectAnswers() >= 10) {
          this.scene.input.enabled = false;
          this.endGame(); // Trigger game end
        }
  }

  

  growAllPlants(growFactor: number) {

    const plantGroup = (this.scene as UnderWaterScene).plantGroup;
    // If any plant was clicked, grow all plants
    plantGroup.getChildren().forEach((plant) => {
      const plantSprite = plant as Phaser.GameObjects.Sprite;

      // Find the corresponding ECS entity to update its size component
      const entities = this.world.queryEntities(['gameObject', 'size']);
      for (const entityId of entities) {
        const gameObject = this.world.getComponent<GameObjectComponent>(entityId, 'gameObject');
        const size = this.world.getComponent<Size>(entityId, 'size');

        if (gameObject.sprite === plantSprite) {
          size.currentSize += growFactor; // Increment the size
          plantSprite.setScale(size.currentSize); // Apply the new size visually

          this.scene.tweens.add({
            targets: gameObject.sprite,
            scale: size.currentSize + 0.5, // Slightly larger scale for feedback
            duration: 100,
            yoyo: true, // Return to normal size
          });
          break;
        }
      }
    });
  }

  endGame() {
    this.scene.sound.play(SOUNDS.FANFARE_SOUND);
    this.playWelcomeEmitter();

    const congratsText =  this.scene.add.bitmapText(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      FONTS.FONTS_KEYS.PIXEL_FONT,
      'Congratulations!',
      FONTS.FONT_SIZE_BIG
    )
      .setOrigin(0.5)
      .setTint(0xffff00)
      .setDepth(150);

      this.scene.tweens.add({
      targets: congratsText,
      scale: 1.5,
      yoyo: true,
      duration: 1000,
      repeat: -1,
    });

    this.scene.time.delayedCall(7000, () => {
     // this.scene.scene.restart(); // Restart the scene
     window.location.reload();
    });
  }

  playWelcomeEmitter() {
    /*this.scene.emitterParticles = this.scene.add.particles(0, 0, IMAGES.BUBBLES, {
      x: { min: 0, max: this.scene.scale.width },
      y: { min: 0, max: this.scene.scale.height },
      speed: 50,
      lifespan: 2000,
      scale: { start: 1, end: 0 },
      quantity: 50,
    }).setAlpha(0.6);*/

    this.scene.emitterParticles = this.scene.add.particles(0, 0, IMAGES.BUBBLES, {
      x: { min: 0, max: this.scene.scale.width },
      y: { min: 0, max: this.scene.scale.height },
      speed: 200,
      lifespan: 2000,
      scale: { start: 0.5, end: 0 },
      quantity: 50,
  }).setAlpha(0.6);

    // Start the emitter
    //this.scene.emitterParticles.start();
  }

  update(): void { }
}
