
import { ECSWorld } from '../ecs/ECSWorld';
import { GameStateSystem } from './GameStateSystem';
import { System } from './System';
import Phaser from 'phaser';
import { FONTS, SOUNDS, IMAGES, PLANT_GROWTH, GAME_RULES, WRONG_ANSWERS, CORRECT_ANSWERS } from '../global/Constants';

export class InputSystem extends System {
  public scene: Phaser.Scene;
  private gameStateSystem: GameStateSystem;

  constructor(scene: Phaser.Scene, world: ECSWorld, gameStateSystem: GameStateSystem) {
    super(world, scene);
    this.scene = scene;
    this.gameStateSystem = gameStateSystem;
  }


  handleInteraction(clickTarget: Phaser.GameObjects.Sprite, correctAnswer: string, gameObject: any) {
    if (!clickTarget) {
      return false; // No interaction occurred
    }
    const isCorrect = clickTarget.name === correctAnswer;

    // Display feedback
    this.displayFeedback(clickTarget, isCorrect);
    debugger
    // if (gameObject instanceof Phaser.GameObjects.Sprite) {
    // Get the entityId from the sprite's custom data
    const fishEntityId = clickTarget.getData('entityId');

    // Call the method to disable collision temporarily
    this.disableCollisionTemporarily(fishEntityId);
    //}


    if (isCorrect) {
      this.gameStateSystem.incrementInteractionPoints();
      this.gameStateSystem.incrementSpeechPoints();
      this.scene.children.getByName('interactionScore').setText(
        `Interaction: ${this.gameStateSystem.interactionPoints}`
      );
      this.scene.children.getByName('speechScore').setText(
        `Speech: ${this.gameStateSystem.speechPoints}`
      );
      this.growPlants(); // Trigger plant growth
    } else {
      this.shrinkPlants(); // Shrink plants on incorrect answer
      this.gameStateSystem.resetStreak();
    }

    this.checkAchievements();
    this.checkWinCondition();

    return isCorrect;
  }
  private disableCollisionTemporarily(fishEntityId: number): void {
    const gameObject = this.world.getComponent(fishEntityId, 'gameObject');
    const velocity = this.world.getComponent(fishEntityId, 'velocity') as Velocity;

    if (gameObject.type === 'fish') {
      // Disable collision
      velocity.disabled = true;

      // Reset collision and visual effects after 1 second
      this.scene.time.delayedCall(300, () => {
        velocity.disabled = false;
      });
    }
  }

  handleSpeech(correctAnswer: string) {
    const recognition = new window.SpeechRecognition() || new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const isCorrect = transcript.includes(correctAnswer.toLowerCase());

      this.displayFeedback(null, isCorrect, true); // Speech feedback

      if (isCorrect) {
        this.gameStateSystem.incrementSpeechPoints();
        this.scene.children.getByName('speechScore').setText(
          `Speech: ${this.gameStateSystem.speechPoints}`
        );
        this.growPlants();
      } else {
        this.shrinkPlants();
        this.gameStateSystem.resetStreak();
      }

      this.checkAchievements();
      this.checkWinCondition();
    };

    recognition.onerror = () => console.error('Speech recognition failed');
    recognition.onend = () => recognition.stop();
  }

  growPlants() {
    const plantGroup = (this.scene as any).plantGroup as Phaser.GameObjects.Group;
    if (!plantGroup) return;

    let allMaxSize = true;

    plantGroup.getChildren().forEach((plant: Phaser.GameObjects.Sprite) => {
      const newScale = Math.min(plant.scale + PLANT_GROWTH.SCALE_INCREMENT, PLANT_GROWTH.MAX_SCALE);

      if (newScale < PLANT_GROWTH.MAX_SCALE) {
        allMaxSize = false;
      }

      this.scene.tweens.add({
        targets: plant,
        scale: newScale,
        duration: 300,
      });
    });

    if (allMaxSize) {
      this.displayAchievement(GAME_RULES.MAX_PLANT_GROWTH_ACHIEVEMENT);
    }
  }

  shrinkPlants() {
    const plantGroup = (this.scene as any).plantGroup as Phaser.GameObjects.Group;
    if (!plantGroup) return;

    let allMinSize = true;

    plantGroup.getChildren().forEach((plant: Phaser.GameObjects.Sprite) => {
      const newScale = Math.max(plant.scale - PLANT_GROWTH.SCALE_INCREMENT, PLANT_GROWTH.MIN_SCALE);

      if (newScale > PLANT_GROWTH.MIN_SCALE) {
        allMinSize = false;
      }

      this.scene.tweens.add({
        targets: plant,
        scale: newScale,
        duration: 300,
      });
    });

    if (allMinSize) {
      //this.endGame(false); // Game over if all plants shrink to minimum size
    }
  }

  displayFeedback(target: Phaser.GameObjects.Sprite | null, isCorrect: boolean, isSpeech = false) {
    const x = target ? target.x : this.scene.cameras.main.centerX;
    const y = target ? target.y - 20 : this.scene.cameras.main.centerY;

    const feedbackText = this.scene.add.bitmapText(
      x,
      y,
      FONTS.FONTS_KEYS.PIXEL_FONT,
      
      isCorrect ? Phaser.Math.RND.pick(Object.values(CORRECT_ANSWERS)) : Phaser.Math.RND.pick(Object.values(WRONG_ANSWERS) ),
      32
    ).setOrigin(0.5);
    

    feedbackText.setTint(isCorrect ? 0xffffff : 0xff0000); // Green for correct, red for incorrect

    this.scene.tweens.add({
      targets: feedbackText,
      alpha: 0,
      y: y - 50,
      duration: 1000,
      onComplete: () => feedbackText.destroy(),
    });

    if (target !== null) {
      // Create a circle centered on the fish
      const circle = this.scene.add.circle(target.x, target.y, 10, 0xffffff, 0.5); // Semi-transparent white
      circle.setDepth(1); // Ensure it's rendered above the fish

      // Tween to grow and fade the circle
      this.scene.tweens.add({
        targets: circle,
        radius: 70, // Grow the circle to this size
        alpha: 0, // Fade out the circle
        duration: 700, // Duration of the effect
        ease: 'Cubic.easeOut',
        onComplete: () => {
          circle.destroy(); // Cleanup the circle
        },
      });

      // Visual feedback
      this.scene.tweens.add({
        targets: target,
        scale: 1.5,
        duration: 150,
        yoyo: true,
        ease: 'Power1',
      });
    }

    if (isCorrect) {
      this.scene.sound.play(SOUNDS.CORRECT_SOUND);
    } else {
      this.scene.sound.play(SOUNDS.INCORRECT_SOUND);
    }
  }


  checkAchievements() {
    const streak = this.gameStateSystem.getStreak();
    if (streak === 5) {
      this.displayAchievement(GAME_RULES.ACHIEVEMENTS.FIVE_CORRECT_IN_ROW);
    }
    if (streak === 10) {
      this.displayAchievement(GAME_RULES.ACHIEVEMENTS.TEN_CORRECT);
    }
  }

  displayAchievement(message: string) {
    const achievementText = this.scene.add
      .bitmapText(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY / 2,
        FONTS.FONTS_KEYS.PIXEL_FONT,
        message,
        32
      )
      .setOrigin(0.5)
      .setTint(0xffff00)
      .setDepth(15);

    this.scene.time.delayedCall(3000, () => achievementText.destroy());
  }

  checkWinCondition() {
    if (this.gameStateSystem.hasWon()) {
      this.endGame(true);
    }
  }

  endGame() {
    console.log(this.gameStateSystem);
    this.scene.sound.play(SOUNDS.FANFARE_SOUND);
    this.playWelcomeEmitter();

    const congratsText = this.scene.add.bitmapText(
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

    this.scene.time.delayedCall(10000, () => {
      // this.scene.scene.restart(); // Restart the scene
      window.location.reload();
    });
  }

  playWelcomeEmitter() {

    this.scene.emitterParticles = this.scene.add.particles(0, 0, IMAGES.BUBBLES, {
      frame: ['silverbubble'],
      scale: { min: 0.05, max: 1 },
      rotate: { start: 0, end: 360 },
      speed: { min: 25, max: 50 },
      lifespan: 6000,
      frequency: 25,
      gravityY: 90
    }).setAlpha(0.6);

    this.scene.tweens.add({
      targets: this.scene.emitterParticles,
      particleX: 700,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout',
      duration: 1500
    });
  }
}
