import { World } from 'ecs/world';

export class System {
    // Each system gets a world and scene.
    constructor(protected world: World, protected scene: Phaser.Scene,) {}
  
    update(delta: number): void { }
  }