import { ECSWorld } from '../ecs/ECSWorld';
import Phaser from 'phaser';
import { System } from './System';
import { Size } from '../components/Size';

export class InputSystem extends System {

  constructor(scene: Phaser.Scene, world: ECSWorld) {
    super(world, scene);

    // Set up global input listener
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.keyboard.on('keydown-ENTER', this.handlePointerDown, this);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const x = pointer.x;
    const y = pointer.y;

    // Query for the State component
    const stateEntity = this.world.queryEntities(['state'])[0];
    const state = this.world.getComponent(stateEntity, 'state');
    
    if (state.phase === 'intro') {
      // Transition to the gameplay phase
      state.phase = 'gameplay';
      this.scene.scene.start('UnderWaterScene'); // Switch to the main game scene
    }

    if (state.phase === 'gameplay') {
        const entities = this.world.queryEntities(['gameObject']);
        

        for (const entityId of entities) {
          const gameObject = this.world.getComponent(entityId, 'gameObject');
          const size = this.world.getComponent<Size>(entityId, 'size');

          if (gameObject.type === 'fish') {
            const sprite = gameObject.sprite;
            const bounds = sprite.getBounds();

            if (bounds.contains(x, y)) {
              const currentAnim = sprite.anims.getName();
              const newAnim = currentAnim === 'swimBlue' ? 'swimRed' : 'swimBlue';
              sprite.play(newAnim);

              // Visual feedback
              this.scene.tweens.add({
                targets: sprite,
                scale: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Power1',
              });
            }
          }
        

          if (gameObject.type === 'plant') {
            const bounds = gameObject.sprite.getBounds();

            // Check if the click/tap is on the plant
            if (bounds.contains(x, y)) {
              // Grow the plant
              size.currentSize += 0.2; // Increment size
              gameObject.sprite.setScale(size.currentSize); // Apply new size visually
            }
          }
        }
  }
  }
  update(): void { }
}
