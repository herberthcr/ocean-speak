
import Phaser from 'phaser';
import { ECSWorld } from '../ecs/ECSWorld';
import { System } from './System';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Size } from '../components/Size';
import { GameObjectComponent } from '../components/GameObjectComponent';

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
      if (gameObject.type === 'fish') {

        // Move the fish based on velocity and speed (constant speed)
        position.x += velocity.vx * delta/100 * velocity.speed * 0.001;
        position.y += velocity.vy * delta/100 * velocity.speed * 0.001;

        // Always update rotation based on the current velocity
        this.updateRotation(gameObject.sprite, velocity);

        
        // Check screen bounds and reverse velocity if necessary
        if (position.x <= 0 || position.x >= bounds.width) {
          velocity.vx *= -1; // Reverse direction horizontally
        }

        if (position.y <= 0 || position.y >=  this.scene.waterHeight) {
          velocity.vy *= -1; // Reverse direction vertically
        }

        // Update the sprite's position
        gameObject.sprite.setPosition(position.x, position.y);

        // Avoid collisions by adjusting velocity gently
        const nearbyFish = this.world.queryEntities(['position', 'velocity', 'gameObject']);
        const MIN_DISTANCE = 30;
        let avoidanceForceX = 0;
        let avoidanceForceY = 0;
        let avoidanceCount = 0;

        // Loop through nearby fishes for avoidance
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
      // Handle plant swaying
      if (gameObject.type === 'plant') {
        const swayAmount = Math.sin(this.elapsedTime * 0.002) * 5; // Gentle swaying
        gameObject.sprite.setX(position.x + swayAmount);
      }
    }
  }

  // Helper function to update the rotation of the sprite based on velocity
  updateRotation(sprite: Phaser.GameObjects.Sprite, velocity: Velocity): void {
    // Calculate angle based on velocity vector
    const angle = Math.atan2(velocity.vy, velocity.vx);

    // Apply the calculated angle to the sprite's rotation (in radians)
    sprite.rotation = angle;
  }
}