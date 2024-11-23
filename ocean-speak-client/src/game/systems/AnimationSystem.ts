
import Phaser from 'phaser';
//import { Entity } from '../ecs/ECSWorld';
import { ECSWorld } from '../ecs/ECSWorld';
import { System } from './System';

export class AnimationSystem extends System {

  constructor(scene: Phaser.Scene, world: ECSWorld) {
    super(world, scene);
  }

  update(delta: number): void {

    this.world.entities.forEach(entity => {
      const position = entity.getComponent('position');
      const velocity = entity.getComponent('velocity');
      const sprite = entity.getComponent('sprite');

      if (position && velocity && sprite) {
        // Update position based on velocity
        position.x += velocity.vx * delta * 0.001;
        position.y += velocity.vy * delta * 0.001;

        // Wrap fish around screen bounds
        const width = 1000;//this.scene.scale.width;
        const height = 600;//this.scene.scale.height;

        if (position.x > width) position.x = 0;
        if (position.x < 0) position.x = width;
        if (position.y > height) position.y = 0;
        if (position.y < 0) position.y = height;

        // Update sprite position
        sprite.sprite.setPosition(position.x, position.y);

        // Optional: Rotate fish to face movement direction
        const angle = Phaser.Math.RadToDeg(Math.atan2(velocity.vy, velocity.vx));
        sprite.sprite.setAngle(angle);
      }
    });
  }
 /* update(entities: Entity[]): void {
    entities.forEach((entity) => {
      const position = entity.getComponent<{ x: number; y: number }>('position');
      const animation = entity.getComponent<{ animationKey: string }>('animation');
     // const sprite = entity.getComponent<{ animationKey: string }>('sprite');

      if (position && animation) {
        let sprite = entity.getData('sprite'); // Check if entity already has a sprite
        if (!sprite) {
          sprite = this.scene.add.sprite(position.x, position.y, 'fishSprites');
          sprite.play(animation.animationKey);
          entity.setData('sprite', sprite);
        }

        sprite.x = position.x;
        sprite.y = position.y;
      }
    });
  }*/
}