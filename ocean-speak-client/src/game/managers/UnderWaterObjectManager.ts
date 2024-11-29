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
  private createdFish: Set<string> = new Set();  // Tracks created fish by type
  private createdPlants: Set<string> = new Set();  // Tracks created plants by type


  constructor(scene: Phaser.Scene, world: ECSWorld, difficulty: typeof DIFFICULTY.EASY) {
    this.scene = scene;
    this.world = world;
    this.difficulty = difficulty;
    this.fishSpeed = difficulty.FISH_BASE_SPEED;  // Adjust fish speed based on difficulty
  }

  createPlantsAnimations() {
    // Loop through the keys of the PLANTS constant (e.g., BLUE_PLANT, PURPLE_PLANT, etc.)
    Object.keys(PLANTS).forEach((plantKey) => {
      const plant = PLANTS[plantKey];  // Get the plant configuration object (e.g., BLUE_PLANT, PURPLE_PLANT)

      // Check if the plant has the necessary properties for animation
      if (plant.ANIMATION && plant.FRAMES) {
        const animationKey = plant.ANIMATION;  // This will be something like "PLANT_ANIM_BLUE"
        const frameStart = plant.FRAMES.START;  // Frame start index
        const frameEnd = plant.FRAMES.END;  // Frame end index

        // Check if the animation already exists before creating it
        if (!this.scene.anims.exists(animationKey)) {
          // Create the animation for the current plant
          this.scene.anims.create({
            key: animationKey,  // Unique animation key for each plant (e.g., PLANT_ANIM_BLUE)
            frames: this.scene.anims.generateFrameNumbers(PLANTS.IMAGE, {
              start: frameStart,  // Frame start from the PLANTS constant
              end: frameEnd,      // Frame end from the PLANTS constant
            }),
            frameRate: PLANTS.PLANTS_FRAMERATE,  // Use the global frame rate from the PLANTS constant
            repeat: -1,  // Loop the animation indefinitely
          });
          console.log(`Created animation for: ${animationKey}`);
        } else {
          console.log(`Animation already exists for: ${animationKey}`);
        }
      }
    });
  }

  createFishAnimations() {
    // Loop through the keys of the FISH constant (e.g., BLUE_FISH, RED_FISH, etc.)
    Object.keys(FISH).forEach((fishKey) => {
      const fish = FISH[fishKey];  // Get the fish configuration object (e.g., BLUE_FISH, RED_FISH)

      // Check if the fish has the necessary properties for animation
      if (fish.ANIMATION && fish.FRAMES) {
        const animationKey = fish.ANIMATION;  // This will be something like "SWIM_BLUE"
        const frameStart = fish.FRAMES.START;  // Frame start index
        const frameEnd = fish.FRAMES.END;  // Frame end index

        // Check if the animation already exists before creating it
        if (!this.scene.anims.exists(animationKey)) {
          // Create the animation for the current fish
          this.scene.anims.create({
            key: animationKey,  // Unique animation key for each fish (e.g., SWIM_BLUE)
            frames: this.scene.anims.generateFrameNumbers(FISH.IMAGE, {
              start: frameStart,  // Frame start from the FISH constant
              end: frameEnd,      // Frame end from the FISH constant
            }),
            frameRate: FISH.FISH_FRAMERATE,  // Use the global frame rate from the FISH constant
            repeat: -1,  // Loop the animation indefinitely
          });
          console.log(`Created animation for: ${animationKey}`);
        } else {
          console.log(`Animation already exists for: ${animationKey}`);
        }
      }
    });
  }

  createRandomFishes(fishGroup: Phaser.GameObjects.Group): void {
    for (let i = 0; i < this.difficulty.FISH_COUNT; i++) {
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, SCREEN.WATERHEIGHT);
      const vx = Phaser.Math.FloatBetween(-100, 100); // Random velocity
      const vy = Phaser.Math.FloatBetween(-100, 100);
      const _animationKey = Phaser.Math.RND.pick(this.fishTypes); // Random type

      this.createFish(x, y, vx, vy, _animationKey, fishGroup); // Pass fishGroup here
    }
  }

  

  createFishBanks(fishBankGroups: Phaser.GameObjects.Group[], fishGroup: Phaser.GameObjects.Group): void {

    const minSpacing = 45; // Minimum distance between fish in the same bank
    const minBankSpacing = 100; // Minimum distance between banks
    const bankCenters: { x: number; y: number }[] = []; // Track bank center positions

    // Shuffle the animations array to ensure random but non-repeating order
    const shuffledAnimations = Phaser.Utils.Array.Shuffle([...this.fishTypes]);

    for (let i = 0; i < this.difficulty.FISH_BANK_COUNT; i++) {
      const bankGroup = this.scene.add.group(); // Create a Phaser group for the fish bank
      fishBankGroups.push(bankGroup);

      // Assign the next animation in the shuffled list
      const type = shuffledAnimations[i % shuffledAnimations.length];

      // Random initial direction and speed for the bank
      const initialDirection = Phaser.Math.Between(-1, 1) || 1; // Random direction (-1 or 1)
      const initialSpeed = this.fishSpeed; // Slower speed for banks

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

        // Assign a name to the sprite
        sprite.setName(type); // Use the animation key as the name
        // Store the entityId in the sprite for later reference
        sprite.setData('entityId', entityId); // Store the entityId in sprite data

        this.world.addComponent(entityId, 'position', position);
        this.world.addComponent(entityId, 'velocity', velocity);
        this.world.addComponent(entityId, 'gameObject', gameObject);

        // Make the sprite interactive
        sprite.setInteractive({ useHandCursor: true });

        // Add the BANK fish sprite to the group
        bankGroup.add(sprite);
        // Also add the fish to the general fish group
        fishGroup.add(sprite);

        // Add fishy movement (oscillation and wobble)
        this.addTweensToFish(sprite);

        if (!this.createdFish.has(type)) {
          // Logic for creating a fish, e.g., adding it to the scene
          console.log(`Creating fish: ${type}`);
          this.createdFish.add(type);  // Mark fish as created
        }
      }
    }
  }

  createFish(x: number, y: number, vx: number, vy: number, _animationKey: string, fishGroup: Phaser.GameObjects.Group): void {
    const entityId = this.world.createEntity();
    const sprite = this.scene.add.sprite(x, y, 'sprites').play(_animationKey).setDepth(10);
    const gameObject: GameObjectComponent = { sprite, type: 'fish', grouped: false };
    const position: Position = { x, y };
    const speed = Phaser.Math.Between(25, 50) + this.fishSpeed; // Random speed for each fish
    const velocity: Velocity = { vx, vy, speed };

    // Assign a name to the sprite
    sprite.setName(_animationKey); // Use the animation key as the name
    // Store the entityId in the sprite for later reference
    sprite.setData('entityId', entityId); // Store the entityId in sprite data


    this.world.addComponent<GameObjectComponent>(entityId, 'gameObject', gameObject);
    this.world.addComponent<Position>(entityId, 'position', position);
    this.world.addComponent<Velocity>(entityId, 'velocity', velocity);

    // Make the sprite interactive
    sprite.setInteractive({ useHandCursor: true });

    // Add to fish group
    fishGroup.add(sprite);

    // Add fishy movement (oscillation and wobble)
    this.addTweensToFish(sprite);

    if (!this.createdFish.has(_animationKey)) {
      // Logic for creating a fish, e.g., adding it to the scene
      console.log(`Creating fish: ${_animationKey}`);
      this.createdFish.add(_animationKey);  // Mark fish as created
    }
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

    for (let i = 0; i < this.difficulty.PLANT_COUNT; i++) {
      let x = 0, y = 0;
      let validPosition = false;

      while (!validPosition) {
        x = Phaser.Math.Between(50, this.scene.scale.width - 50);
        y = Phaser.Math.Between(this.scene.scale.height - PLANTS.GROWING_SAND_HEIGHT, this.scene.scale.height - 50);

        validPosition = positions.every(
          (pos) => Phaser.Math.Distance.Between(x, y, pos.x, pos.y) >= PLANTS.PLANTS_MIN_GROWING_SPACE
        );

        if (validPosition) {
          positions.push({ x, y });
        }
      }

      const type = Phaser.Math.RND.pick(this.plantsTypes); // Random type
      const entityId = this.world.createEntity();
      const sprite = this.scene.add.sprite(x, y, 'sprites').play(type).setDepth(5).setOrigin(0.5, 1);
      const gameObject: GameObjectComponent = { sprite, type: 'plant', grouped: true };
      const position: Position = { x, y };

      // Assign a name to the plant sprite
      sprite.setName(type);
      // Store the entityId in the sprite for later reference
      sprite.setData('entityId', entityId); // Store the entityId in sprite data

      this.world.addComponent(entityId, 'position', position);
      this.world.addComponent(entityId, 'gameObject', gameObject);
      this.world.addComponent(entityId, 'size', { currentSize: PLANTS.PLANTS_SCALE }); // Initial size

      // Make the plant interactive
      sprite.setInteractive({ useHandCursor: true });

      // Add to plant group
      plantGroup.add(sprite);

      this.addPlantSway(sprite);

      if (!this.createdPlants.has(type)) {
        // Logic for creating a plant, e.g., adding it to the scene
        console.log(`Creating plant: ${type}`);
        this.createdPlants.add(type);  // Mark plant as created
      }

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
  // Check if a specific fish has already been created
  hasFish(fishType: string): boolean {
    return this.createdFish.has(fishType);
  }

  // Check if a specific plant has already been created
  hasPlant(plantType: string): boolean {
    return this.createdPlants.has(plantType);
  }
}