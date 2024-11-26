import Phaser from 'phaser';
import { ECSWorld } from '../ecs/ECSWorld';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { GameObjectComponent } from '../components/GameObjectComponent';
import { FISH, FISH_ANIMATIONS, DIFFICULTY, PLANTS, SCREEN, PLANTS_ANIMATIONS } from '../global/Constants';

export class UnderWaterObjectManager {
  private scene: Phaser.Scene;
  private difficulty: typeof DIFFICULTY.EASY;
  private world!: ECSWorld;

  /// TODO REFACTOR WITH VALUES FROM CONSTANT FILE
  private fishTypes = Object.values(FISH_ANIMATIONS);
  private plantsTypes = Object.values(PLANTS_ANIMATIONS);
  private fishSpeed = 50;

  constructor(scene: Phaser.Scene, world: ECSWorld, difficulty: typeof DIFFICULTY.EASY) {
    this.scene = scene;
    this.world = world;
    this.difficulty = difficulty;
  }

  createFishAnimations(): void {
    this.scene.anims.create({
      key: FISH.GREEN_FISH.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(FISH.IMAGE,
        { start: FISH.GREEN_FISH.FRAMES.START, end: FISH.GREEN_FISH.FRAMES.END }),
      frameRate: FISH.FISH_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: FISH.BLUE_FISH.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(FISH.IMAGE,
        { start: FISH.BLUE_FISH.FRAMES.START, end: FISH.BLUE_FISH.FRAMES.END }),
      frameRate: FISH.FISH_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: FISH.RED_FISH.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(FISH.IMAGE,
        { start: FISH.RED_FISH.FRAMES.START, end: FISH.RED_FISH.FRAMES.END }),
      frameRate: FISH.FISH_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: FISH.ORANGE_FISH.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(FISH.IMAGE,
        { start: FISH.ORANGE_FISH.FRAMES.START, end: FISH.ORANGE_FISH.FRAMES.END }),
      frameRate: FISH.FISH_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: FISH.PURPLE_FISH.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(FISH.IMAGE,
        { start: FISH.PURPLE_FISH.FRAMES.START, end: FISH.PURPLE_FISH.FRAMES.END }),
      frameRate: FISH.FISH_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: FISH.GLOBE_FISH.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(FISH.IMAGE,
        { start: FISH.GLOBE_FISH.FRAMES.START, end: FISH.GLOBE_FISH.FRAMES.END }),
      frameRate: FISH.FISH_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: FISH.GREY_FISH.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(FISH.IMAGE,
        { start: FISH.GREY_FISH.FRAMES.START, end: FISH.GREY_FISH.FRAMES.END }),
      frameRate: FISH.FISH_FRAMERATE,
      repeat: -1,
    });
  }

  createPlantsAnimations(): void {

    this.scene.anims.create({
      key: PLANTS.GREEN_PLANT.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(PLANTS.IMAGE,
        { start: PLANTS.GREEN_PLANT.FRAMES.START, end: PLANTS.GREEN_PLANT.FRAMES.END }),
      frameRate: PLANTS.PLANTS_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: PLANTS.ORANGE_PLANT.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(PLANTS.IMAGE,
        { start: PLANTS.ORANGE_PLANT.FRAMES.START, end: PLANTS.ORANGE_PLANT.FRAMES.END }),
      frameRate: PLANTS.PLANTS_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: PLANTS.PURPLE_PLANT.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(PLANTS.IMAGE,
        { start: PLANTS.PURPLE_PLANT.FRAMES.START, end: PLANTS.PURPLE_PLANT.FRAMES.END }),
      frameRate: PLANTS.PLANTS_FRAMERATE,
      repeat: -1,
    });

    this.scene.anims.create({
      key: PLANTS.BLUE_PLANT.ANIMATION,
      frames: this.scene.anims.generateFrameNumbers(PLANTS.IMAGE,
        { start: PLANTS.BLUE_PLANT.FRAMES.START, end: PLANTS.BLUE_PLANT.FRAMES.END }),
      frameRate: PLANTS.PLANTS_FRAMERATE,
      repeat: -1,
    });
  }

  createRandomFishes(): void {
    for (let i = 0; i < FISH.DEFAULT_FISH_COUNT; i++) {
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, SCREEN.WATERHEIGHT);
      const vx = Phaser.Math.FloatBetween(-100, 100); // Random velocity
      const vy = Phaser.Math.FloatBetween(-100, 100);
      const _animationKey = Phaser.Math.RND.pick(this.fishTypes); // Random type

      this.createFish(x, y, vx, vy, _animationKey);
    }
  }

  createFishBanks(fishBankGroups: Phaser.GameObjects.Group[]): void {

    const minSpacing = 45; // Minimum distance between fish in the same bank
    const minBankSpacing = 100; // Minimum distance between banks
    const bankCenters: { x: number; y: number }[] = []; // Track bank center positions

    // Shuffle the animations array to ensure random but non-repeating order
    const shuffledAnimations = Phaser.Utils.Array.Shuffle([...this.fishTypes]);

    for (let i = 0; i < FISH.FISH_BANK_COUNT; i++) {
      const bankGroup = this.scene.add.group(); // Create a Phaser group for the fish bank
      fishBankGroups.push(bankGroup);

      // Assign the next animation in the shuffled list
      const type = shuffledAnimations[i % shuffledAnimations.length];

      // Random initial direction and speed for the bank
      const initialDirection = Phaser.Math.Between(-1, 1) || 1; // Random direction (-1 or 1)
      const initialSpeed = 50; // Slower speed for banks

      // Generate a valid central position for the bank
      let centerX = 0, centerY = 0;
      let validBankPosition = false;

      // Add fish to the bank in a clustered formation
      while (!validBankPosition) {
        centerX = Phaser.Math.Between(100, this.scene.scale.width - 100);
        centerY = Phaser.Math.Between(100, SCREEN.WATERHEIGHT - 100);

        // Check if this bank's center is far enough from all other bank centers
        validBankPosition = bankCenters.every(
          (center) =>
            Math.abs(centerX - center.x) >= minBankSpacing && // Horizontal spacing
            Math.abs(centerY - center.y) >= minBankSpacing    // Vertical spacing
        );

        if (validBankPosition) {
          bankCenters.push({ x: centerX, y: centerY });
        }
      }

      const positions: { x: number; y: number }[] = []; // Track positions within the bank

      // Add fish to the bank
      for (let j = 0; j < 5; j++) { // Each bank has 5 fish

        let x = 0, y = 0;
        let validPosition = false;

        while (!validPosition) {
          // Generate a position around the central point
          x = centerX + Phaser.Math.Between(-60, 60); // Spread around center
          y = centerY + Phaser.Math.Between(-60, 60);

          // Check if this position is far enough from all other fish in the bank
          validPosition = positions.every(
            (pos) => Phaser.Math.Distance.Between(x, y, pos.x, pos.y) >= minSpacing
          );

          // If valid, add the position to the list
          if (validPosition) {
            positions.push({ x, y });
          }
        }

        const entityId = this.world.createEntity();
        const sprite = this.scene.add.sprite(x, y, 'sprites').play(type).setDepth(10 + i + j);
        const gameObject: GameObjectComponent = { sprite, type: 'fish', grouped: true };
        const position: Position = { x, y };

        const velocity: Velocity = {
          vx: initialDirection * initialSpeed,
          vy: Phaser.Math.Between(-10, 10), // Small Y-axis variation
          speed: initialSpeed,
        };

        this.world.addComponent(entityId, 'position', position);
        this.world.addComponent(entityId, 'velocity', velocity);
        this.world.addComponent(entityId, 'gameObject', gameObject);

        // Add the fish sprite to the group
        bankGroup.add(sprite);

        // Add fishy movement (oscillation and wobble)
        this.addTweensToFish(sprite);
      }
    }
  }

  createFish(x: number, y: number, vx: number, vy: number, _animationKey: string): void {

    const entityId = this.world.createEntity();
    const sprite = this.scene.add.sprite(x, y, 'sprites').play(_animationKey).setDepth(10);
    const gameObject: GameObjectComponent = { sprite, type: 'fish', grouped: false };
    const position: Position = { x, y };
    const speed = Phaser.Math.Between(50, 100);  // Random speed for each fish
    const velocity: Velocity = { vx: Phaser.Math.Between(-this.fishSpeed, this.fishSpeed), vy: Phaser.Math.Between(-this.fishSpeed, this.fishSpeed), speed };

    this.world.addComponent<GameObjectComponent>(entityId, 'gameObject', gameObject);
    this.world.addComponent<Position>(entityId, 'position', position);
    this.world.addComponent<Velocity>(entityId, 'velocity', velocity);

    // Add fishy movement (oscillation and wobble)
    this.addTweensToFish(sprite);
  }

  // Function to add tweens for oscillation and wobble
  addTweensToFish(sprite: Phaser.GameObjects.Sprite): void {
    // Add vertical oscillation (up and down)
    this.scene.tweens.add({
      targets: sprite,
      y: sprite.y + Phaser.Math.Between(-10, 10), // Oscillate up/down
      duration: Phaser.Math.Between(1000, 1500), // Randomize duration
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Add wobble effect (small rotations)
    this.scene.tweens.add({
      targets: sprite,
      angle: Phaser.Math.Between(-5, 5), // Small wobble
      duration: Phaser.Math.Between(800, 1200), // Randomize duration
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.scene.add.tween({
      targets: sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      ease: "bounce",
      duration: Phaser.Math.Between(3000, 4000),
      repeat: -1, // -1: infinity
      yoyo: false
    });
  }

  createPlants(plantGroup: Phaser.GameObjects.Group): void {

    const positions: { x: number; y: number }[] = []; // Keep track of placed positions

    for (let i = 0; i < PLANTS.COUNT; i++) {
      let x = 0, y = 0;
      let validPosition = false;

      while (!validPosition) {
        // Generate a random position within the screen bounds
        x = Phaser.Math.Between(50, this.scene.scale.width - 50);
        y = Phaser.Math.Between(this.scene.scale.height - PLANTS.GROWING_SAND_HEIGHT, this.scene.scale.height - 50);

        // Check if this position is far enough from existing plants
        validPosition = positions.every(
          (pos) => Phaser.Math.Distance.Between(x, y, pos.x, pos.y) >= PLANTS.PLANTS_MIN_GROWING_SPACE
        );

        // If valid, add the position to the list
        if (validPosition) {
          positions.push({ x, y });
        }
      }
      const type = Phaser.Math.RND.pick(this.plantsTypes); // Random type

      const entityId = this.world.createEntity();

      //  const sprite = this.add.sprite(x, y, 'sprites').setDepth(5);
      const sprite = this.scene.add.sprite(x, y, 'sprites').play(type).setDepth(5).setOrigin(0.5, 1);
      const gameObject: GameObjectComponent = { sprite, type: 'plant', grouped: true };
      const position: Position = { x, y };

      this.world.addComponent(entityId, 'position', position);
      this.world.addComponent(entityId, 'gameObject', gameObject);
      this.world.addComponent(entityId, 'size', { currentSize: 1.0 }); // Initial size

      // Add the plant sprite to the group
      plantGroup.add(sprite);

      this.addPlantSway(sprite);
    }
  }

  private addPlantSway(sprite: Phaser.GameObjects.Sprite): void {
    this.scene.tweens.add({
      targets: sprite,
      angle: Phaser.Math.Between(PLANTS.SWAY_ANGLE.MIN, PLANTS.SWAY_ANGLE.MAX),
      duration: Phaser.Math.Between(PLANTS.SWAY_DURATION.MIN, PLANTS.SWAY_DURATION.MAX),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}