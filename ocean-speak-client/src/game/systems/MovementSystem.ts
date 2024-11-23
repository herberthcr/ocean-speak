import { Entity } from '../ecs/ECSWorld';

export class MovementSystem {
  update(entities: Entity[], delta: number): void {
    entities.forEach((entity) => {
      const position = entity.getComponent<{ x: number; y: number }>('position');
      const velocity = entity.getComponent<{ vx: number; vy: number }>('velocity');

      if (position && velocity) {
        position.x += velocity.vx * delta;
        position.y += velocity.vy * delta;
      }
    });
  }
}