
import Phaser from 'phaser';
import { ECSWorld } from '../ecs/ECSWorld';
import { System } from './System';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { GameObjectComponent } from '../components/GameObjectComponent';
import { UnderWaterScene } from '../scenes/UnderWaterScene';
import { SCREEN } from '../global/Constants';

export class AnimationSystem extends System {
  private elapsedTime: number = 0;

  constructor(scene: Phaser.Scene, world: ECSWorld) {
    super(world, scene);
  }

  update(delta: number): void {
    const entities = this.world.queryEntities(['position', 'velocity', 'gameObject']);
    const bounds = this.scene.sys.game.canvas.getBoundingClientRect();

    for (const entityId of entities) {
      const position = this.world.getComponent<Position>(entityId, 'position');
      const velocity = this.world.getComponent<Velocity>(entityId, 'velocity');
      const gameObject = this.world.getComponent<GameObjectComponent>(entityId, 'gameObject');

      // Handle fish movement (existing logic)
      if (gameObject.type === 'fish' && gameObject.grouped === false) {
        this.updateIndividualFish(gameObject, position, velocity, entityId, bounds, delta);
      }
      // Handle fish movement (existing logic)
      if (gameObject.type === 'fish' && gameObject.grouped) {
        this.updateFishBank(delta);
      }
      // Handle plant swaying
      if (gameObject.type === 'plant') {
        this.updatePlants(gameObject, position);
      }

    }
  }

  updateIndividualFish(
    gameObject: GameObjectComponent,
    position: Position,
    velocity: Velocity,
    entityId: any,
    bounds: DOMRect,
    delta: number
  ) {
    // Skip collision logic if disabled
    if (velocity.disabled) {
      position.x += velocity.vx * delta * 0.001;
      position.y += velocity.vy * delta * 0.001;

      gameObject.sprite.setPosition(position.x, position.y);
      this.updateRotation(gameObject.sprite, velocity); // No collision recovery needed
      return;
    }

    // Move the fish based on velocity and speed (constant speed)
    position.x += velocity.vx * delta / 100 * velocity.speed * 0.001;
    position.y += velocity.vy * delta / 100 * velocity.speed * 0.001;

    // Always update rotation based on the current velocity
    this.updateRotation(gameObject.sprite, velocity);

    // Check screen bounds and reverse velocity if necessary
    if (position.x <= -75 || position.x >= bounds.width+100) {
      velocity.vx *= -1; // Reverse direction horizontally
    }

    if (position.y <= -100 || position.y >= SCREEN.WATERHEIGHT) {
      velocity.vy *= -0.8; // Reverse direction vertically
    }

    // Update the sprite's position
    gameObject.sprite.setPosition(position.x, position.y);

    // Avoid collisions by adjusting velocity gently
    const nearbyFish = this.world.queryEntities(['position', 'velocity', 'gameObject']);
    const MIN_DISTANCE = 30;
    let avoidanceForceX = 0;
    let avoidanceForceY = 0;
    let avoidanceCount = 0;

    for (const otherEntityId of nearbyFish) {
      if (entityId !== otherEntityId) {
        const otherPosition = this.world.getComponent<Position>(otherEntityId, 'position');
        const distance = Phaser.Math.Distance.Between(position.x, position.y, otherPosition.x, otherPosition.y);

        if (distance < MIN_DISTANCE) {
          const angleToOtherFish = Math.atan2(otherPosition.y - position.y, otherPosition.x - position.x);
          const avoidanceStrength = Math.max(0, 1 - distance / MIN_DISTANCE); // Force reduces with distance

          // Apply gradual avoidance force
          avoidanceForceX += Math.cos(angleToOtherFish) * avoidanceStrength;
          avoidanceForceY += Math.sin(angleToOtherFish) * avoidanceStrength;
          avoidanceCount++;
        }
      }
    }

    if (avoidanceCount > 0) {
      // Average the avoidance force to prevent collision from many fish
      avoidanceForceX /= avoidanceCount;
      avoidanceForceY /= avoidanceCount;

      // Apply the avoidance force
      velocity.vx += avoidanceForceX * 4; // Scaling factor for avoidance
      velocity.vy += avoidanceForceY * 4;

      // Normalize velocity to maintain constant speed and avoid excessive acceleration
      const magnitude = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
      if (magnitude > 0) {
        // Normalize and apply the fish's constant speed
        velocity.vx = (velocity.vx / magnitude) * velocity.speed;
        velocity.vy = (velocity.vy / magnitude) * velocity.speed;
      }

      // Update rotation after avoidance
      this.updateRotation(gameObject.sprite, velocity);
    }
  }

  // Helper function to update the rotation of the sprite based on velocity
  updateRotation(sprite: Phaser.GameObjects.Sprite, velocity: Velocity): void {
    // Calculate angle based on velocity vector
    const angle = Math.atan2(velocity.vy, velocity.vx);

    // Apply the calculated angle to the sprite's rotation (in radians)
    sprite.rotation = angle;

    // Correctly flip the sprite based on movement direction
    if (velocity.vx < 0) {
      // Moving left: flip both X and Y to ensure the fish faces the correct direction
      sprite.setFlipX(false);
      sprite.setFlipY(true);
    } else {
      // Moving right: reset flipping
      sprite.setFlipX(false);
      sprite.setFlipY(false);
    }
  }

  updateFishBank(delta: number) {
    this.elapsedTime += delta;

    // Handle fish banks
    (this.scene as UnderWaterScene).fishBankGroups.forEach((bankGroup) => {
      const bounds = this.scene.sys.game.canvas.getBoundingClientRect();
      let bankDirectionChanged = false;
      let newDirectionX = 0; // Shared X-direction for the bank
      let newDirectionY = 0; // Shared Y-direction for the bank

      bankGroup.getChildren().forEach((fish) => {
        const sprite = fish as Phaser.GameObjects.Sprite;

        // Find corresponding ECS entity
        const entityId = this.findEntityBySprite(sprite);
        if (entityId === null) return;

        const position = this.world.getComponent<Position>(entityId, 'position');
        const velocity = this.world.getComponent<Velocity>(entityId, 'velocity');

        // Move the fish in the bank
        position.x += velocity.vx * delta / 600 * velocity.speed * 0.001;
        position.y += velocity.vy * delta / 600 * velocity.speed * 0.001;

        // Update sprite position
        sprite.setPosition(position.x, position.y);

        // Check for boundary collision (only for the first detected collision)
        if (!bankDirectionChanged && (position.x <= -135 || position.x >= bounds.width+135)) {
          newDirectionX = velocity.vx * -1; // Reverse X direction
          bankDirectionChanged = true; // Mark that the bank's direction has changed
        }
      });

      // Apply the new direction to the entire bank
      if (bankDirectionChanged) {
        bankGroup.getChildren().forEach((fish) => {
          const sprite = fish as Phaser.GameObjects.Sprite;
          const entityId = this.findEntityBySprite(sprite);
          if (entityId !== null) {
            const velocity = this.world.getComponent<Velocity>(entityId, 'velocity');
            velocity.vx = newDirectionX; // Apply the new X direction
            velocity.vy = newDirectionY; // Apply the new Y direction
          }
        });
      }

      // Rotate and flip all fish in the bank to face the new direction
      bankGroup.getChildren().forEach((fish) => {
        const sprite = fish as Phaser.GameObjects.Sprite;
        const entityId = this.findEntityBySprite(sprite);
        if (entityId !== null) {
          const velocity = this.world.getComponent<Velocity>(entityId, 'velocity');

          // Calculate rotation angle
          const angle = Math.atan2(velocity.vy, velocity.vx);
          sprite.rotation = angle; // Rotate the fish to face its movement direction

          // Correctly flip the sprite based on movement direction
          if (velocity.vx < 0) {
            // Moving left: ensure proper flipping
            sprite.setFlipX(false);
            sprite.setFlipY(true);
          } else {
            // Moving right: reset flipping
            sprite.setFlipX(false);
            sprite.setFlipY(false);
          }
        }
      });
    });
  }


  findEntityBySprite(sprite: Phaser.GameObjects.Sprite): number | null {
    const entities = this.world.queryEntities(['gameObject']);
    for (const entityId of entities) {
      const gameObject = this.world.getComponent<GameObjectComponent>(entityId, 'gameObject');
      if (gameObject.sprite === sprite) return entityId;
    }
    return null;
  }

  updatePlants(gameObject: GameObjectComponent, position: Position) {
    const swayAmount = Math.sin(this.elapsedTime * 0.002) * 5; // Gentle swaying
    gameObject.sprite.setX(position.x + swayAmount);
  }


}