import { ECSWorld } from '../ecs/ECSWorld';
import Phaser from 'phaser';
import { System } from './System';

export class InputSystem extends System {
  constructor(private scene: Phaser.Scene, private world: ECSWorld) {
    super(world, scene);

    // Set up global input listener
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const x = pointer.x;
    const y = pointer.y;

    // Query all entities with the required components
    this.world.entities.forEach(entity => {
      const spriteComponent = entity.getComponent('sprite');
      const typeComponent = entity.getComponent('type');

      // Check if the entity is a fish and if the click is within the sprite's bounds
      if (spriteComponent && typeComponent?.value === 'fish') {
        const sprite = spriteComponent.sprite;
        const bounds = sprite.getBounds();

        if (bounds.contains(x, y)) {
          // Change the fish's animation or frame
          const currentAnimation = sprite.anims.getName();
          const newAnimation = currentAnimation === 'swimBlue' ? 'swimRed' : 'swimBlue';
          sprite.play(newAnimation);

          // Optional: Update the entity's `type` or other components
          typeComponent.value = newAnimation;

          // Optional: Add a visual feedback effect
          this.scene.tweens.add({
            targets: sprite,
            scale: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Power1',
          });
        }
      }
    });
  }

  update(): void {
    // No per-frame logic is needed in this system for now
  }
}
