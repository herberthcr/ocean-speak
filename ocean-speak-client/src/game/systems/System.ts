import { World } from 'ecs/world';

export class System {
    // Each system gets a world, and optionally, other resources like a scene.
    constructor(protected world: World, protected scene: Phaser.Scene,) {}
  
    // The update method is called once per frame to process logic.
    update(delta: number): void {
      // Systems will loop over relevant entities and update them
    }
  }