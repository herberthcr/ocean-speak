import { ECSWorld } from '../ecs/ECSWorld';
import Phaser from 'phaser';
import { System } from './System';
import { Size } from '../components/Size';
import { UnderWaterScene } from '../scenes/UnderWaterScene';

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
              this.growAllPlants();
            }
          }
        }
    }
  }

    growAllPlants (){
      
     const plantGroup = (this.scene as UnderWaterScene).plantGroup; 
     // If any plant was clicked, grow all plants
     plantGroup.getChildren().forEach((plant) => {
      const plantSprite = plant as Phaser.GameObjects.Sprite;

      // Find the corresponding ECS entity to update its size component
      const entities = this.world.queryEntities(['gameObject', 'size']);
      for (const entityId of entities) {
        const gameObject = this.world.getComponent<GameObjectComponent>(entityId, 'gameObject');
        const size = this.world.getComponent<Size>(entityId, 'size');

        if (gameObject.sprite === plantSprite) {
          size.currentSize += 0.2; // Increment the size
          plantSprite.setScale(size.currentSize); // Apply the new size visually

          this.scene.tweens.add({
            targets: gameObject.sprite,
            scale: size.currentSize + 0.5, // Slightly larger scale for feedback
            duration: 100,
            yoyo: true, // Return to normal size
          });
          break;
        }
      }
    });  
  }

  update(): void { }
}
