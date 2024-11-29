
import { ECSWorld } from '../ecs/ECSWorld';
import { GameStateSystem } from './GameStateSystem';
import { System } from './System';
import Phaser from 'phaser';
import { TextHelper } from '../global/TextHelper'
import { FONTS, SOUNDS, IMAGES, PLANT_GROWTH, ACHIEVEMENTS, GAME_RULES, WRONG_ANSWERS, CORRECT_ANSWERS, PLANTS } from '../global/Constants';

export class InputSystem extends System {
  public scene: Phaser.Scene;
  private gameStateSystem: GameStateSystem;
  private speechRecognitionOn: string;
  private gameOver: boolean;
  private difficulty: string;

  constructor(scene: Phaser.Scene, world: ECSWorld, gameStateSystem: GameStateSystem) {
    super(world, scene);
    this.scene = scene;
    this.gameStateSystem = gameStateSystem;
    this.speechRecognitionOn = scene.speechRecognitionOn;
    this.difficulty = scene.difficulty;
    this.gameOver = false;
  }

  handleInteraction(clickTarget: Phaser.GameObjects.Sprite, correctAnswer: string) {
    if (!clickTarget) {
      return false; // No interaction occurred
    }
    const isCorrect = clickTarget.name === correctAnswer;

    // Display feedback
    this.displayFeedback(clickTarget, isCorrect);

    // Get the entityId from the sprite's custom data
    const fishEntityId = clickTarget.getData('entityId');

    // Call the method to disable collision temporarily
    this.disableCollisionTemporarily(fishEntityId);

    if (isCorrect) {
      this.gameStateSystem.incrementInteractionPoints();
      this.speechRecognitionOn === 'off' && this.gameStateSystem.incrementSpeechPoints();
      this.growPlants(); // Trigger plant growth
    } else {
      this.shrinkPlants(); // Shrink plants on incorrect answer
      this.gameStateSystem.resetInteractionStreak();
      this.gameStateSystem.reduceInteractionPoints();

      if (this.speechRecognitionOn === 'off') {
        this.gameStateSystem.reduceSpeechPoints();
        this.gameStateSystem.resetInteractionStreak();
      }

    }

    this.scene.interactionText.setText(`Interaction: ${this.gameStateSystem.interactionPoints}`);
    this.scene.speechPointsText.setText(`Speech: ${this.gameStateSystem.speechPoints}`);

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
    const webSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new webSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      let isCorrect = transcript.includes(correctAnswer.toLowerCase());

      if (this.difficulty === 'easy') { isCorrect = true; }
      this.displayFeedback(null, isCorrect, true); // Speech feedback
      this.scene.speakText.setVisible(false);
      this.scene.soundIcon.anims.play(this.scene.soundIconOFFAnimKey);

      if (isCorrect) {
        this.gameStateSystem.incrementSpeechPoints();
        this.scene.speechPointsText.setText(`Speech: ${this.gameStateSystem.speechPoints}`);
        this.growPlants();
      } else {
        this.shrinkPlants();
        this.gameStateSystem.resetSpeechStreak();
      }

      this.checkAchievements();
      this.checkWinCondition();
    };

    //if(this.difficulty !== 'easy') {
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

    if (allMaxSize && this.gameStateSystem.getMaxPlantsGrow() <= 100) {

      this.gameStateSystem.incrementMaxPlantsGrow(100);
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


    if (allMinSize && this.gameStateSystem.getMinPlants() >= 0) {
      this.gameStateSystem.incrementMinPlantsGrow(-1);
    }
  }

  resetPlants() {

    const plantGroup = (this.scene as any).plantGroup as Phaser.GameObjects.Group;
    if (!plantGroup) return;
    plantGroup.getChildren().forEach((plant: Phaser.GameObjects.Sprite) => {
      this.scene.tweens.add({
        targets: plant,
        scale: PLANTS.PLANTS_SCALE,
        duration: 300,
      });
    });
  }

  displayFeedback(target: Phaser.GameObjects.Sprite | null, isCorrect: boolean, isSpeech = false) {
    const x = target ? target.x : this.scene.cameras.main.centerX;
    const y = target ? target.y - 20 : this.scene.cameras.main.centerY;

    const feedbackText = this.scene.add.bitmapText(
      x,
      y,
      FONTS.FONTS_KEYS.PIXEL_FONT,

      isCorrect ? Phaser.Math.RND.pick(Object.values(CORRECT_ANSWERS)) : Phaser.Math.RND.pick(Object.values(WRONG_ANSWERS)),
      32
    ).setOrigin(0.5).setDepth(300);;


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
    const interactionStreak = this.gameStateSystem.getInteractionStreak();
    const speechStreak = this.gameStateSystem.getSpeechStreak();
    const plantsGrow = this.gameStateSystem.getMaxPlantsGrow();
    const minplantsGrow = this.gameStateSystem.getMinPlants();

    // Create a list to hold the achievements
    const achievementsToDisplay: string[] = [];
    if (interactionStreak === 5) {
      achievementsToDisplay.push(ACHIEVEMENTS.FIVE_INTERACTIONS_STREAK);
    }
    if (interactionStreak === 10) {
      achievementsToDisplay.push(ACHIEVEMENTS.TEN_INTERACTIONS_STREAK);
    }
    if (speechStreak === 5 && this.speechRecognitionOn === 'on') {
      achievementsToDisplay.push(ACHIEVEMENTS.FIVE_SPEECH_STREAK);
    }
    if (speechStreak === 10 && this.speechRecognitionOn === 'on') {
      achievementsToDisplay.push(ACHIEVEMENTS.TEN_SPEECH_STREAK);
    }
    if (plantsGrow === 100) {

      this.gameStateSystem.incrementMaxPlantsGrow(101);
      achievementsToDisplay.push(ACHIEVEMENTS.MAX_PLANT_GROWTH_ACHIEVEMENT);
    }
    if (minplantsGrow === -1) {
      this.gameStateSystem.incrementMinPlantsGrow(-2);
      achievementsToDisplay.push(ACHIEVEMENTS.MIN_PLANT_GROWTH_GAME_OVER);
    }

    // Display the achievements sequentially with a delay
    this.displayAchievementsSequentially(achievementsToDisplay);
  }

  // Method to display achievements one at a time with a delay
  displayAchievementsSequentially(achievements: string[]) {
    let delay = 0;

    // Iterate through the achievements array
    achievements.forEach((achievement, index) => {
      this.scene.time.delayedCall(delay, () => {
        this.displayAchievement(achievement); // Display the achievement
      });

      // Increment the delay for the next achievement (e.g., 2 seconds)
      delay += 2000;  // Adjust delay as needed (2000ms = 2 seconds)
    });
  }

  displayAchievement(message: string) {

    const achievementText = this.scene.textHelper.createColoredText(this.scene.cameras.main.centerX, this.scene.achievementY, 200, '24px', message, 'yellow');
    achievementText.setOrigin(0.5).setName('achievementText');
    // Update the y position for the next achievement (with a vertical offset)
    this.scene.achievementY += this.scene.achievementOffset;

    if (this.scene.achievementY > 500) {
      this.scene.achievementY = 100;  // Reset back to the starting position if it exceeds a certain Y threshold
    }

    this.scene.sound.play(SOUNDS.ACHIEVEMENT_SOUND);

    const emitter = this.scene.add.particles(400, 250, IMAGES.BUBBLES, {
      frame: ['bluebubble', 'redbubble', 'greenbubble', 'silverbubble'],
      lifespan: 4000,
      speed: { min: 100, max: 150 },
      scale: { start: 0.5, end: 0 },
      rotate: { start: 0, end: 360 },
      gravityY: 10,
      blendMode: 'ADD',
      emitting: false
    });
    emitter.explode(100);
    this.scene.time.delayedCall(3000, () => achievementText.destroy());
  }

  checkWinCondition() {
    if (this.gameStateSystem.hasWon() && !this.gameOver) {
  
      this.endGame();
    }
  }

  GameStart() {
    this.gameOver = false;
  }


  endGame() {
    this.gameOver = true;
    this.scene.sound.play(SOUNDS.FANFARE_SOUND);
    this.playWinEmitter();
    this.resetPlants();

    const congratsText = this.scene.textHelper.createColoredText(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY, 200, '72px', 'Congratulations!', 'yellow');
    congratsText.setOrigin(0.5).
      setName('congratsText');

    const congratsTween = this.scene.tweens.add({
      targets: congratsText,
      scale: 1.5,
      yoyo: true,
      duration: 1000,
      repeat: -1,
    });
    this.scene.tweens.add({
      targets: congratsText,
      alpha: 0, // Gradually reduce alpha to 0
      duration: 8000, // Fade out duration
      onComplete: () => {
        congratsTween.destroy();
        congratsText.destroy();
      },
    });
    this.scene.endGame();
  }


  playWinEmitter() {

    const particleEmitter = this.scene.add.particles(0, 0, IMAGES.BUBBLES, {
      frame: ['silverbubble'],
      scale: { min: 0.05, max: 1 },
      rotate: { start: 0, end: 360 },
      speed: { min: 30, max: 80 },
      lifespan: 6000,
      frequency: 25,
      gravityY: 90
    }).setAlpha(0.6);

    const emitterPositionTweenn = this.scene.tweens.add({
      targets: particleEmitter,
      particleX: 700,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout',
      duration: 1500
    });

    this.scene.tweens.add({
      targets: particleEmitter,
      alpha: 0, // Gradually reduce alpha to 0
      duration: 15000, // Fade out duration
      onComplete: () => {
        emitterPositionTweenn.destroy();
        particleEmitter.stop(); // Stop the emitter after fading out
        particleEmitter.destroy();
      },
    });
  }
}
