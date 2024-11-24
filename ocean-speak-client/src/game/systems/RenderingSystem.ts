import { ECSWorld } from '../ecs/ECSWorld';
import Phaser from 'phaser';
import { System } from './System';


export class RenderingSystem extends System {
  private tilemap!: Phaser.Tilemaps.Tilemap;
 // private tilemap?: Phaser.Tilemaps.Tilemap;
  private layers: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
  private tileset!: Phaser.Tilemaps.Tileset;

  constructor(scene: Phaser.Scene, world: ECSWorld) {
    super(world, scene);
  }

  setupTilemap(mapKey: string, tilesetKey: string, layerNames: string[]): void {
    // create the Tilemap
    this.tilemap = this.scene.make.tilemap({ key: mapKey });
    // add the tileset image we are using
    this.tileset = this.tilemap.addTilesetImage(tilesetKey, tilesetKey);

    // Create each layer
    layerNames.forEach((layerName, index) => {
      const layer = this.tilemap?.createLayer(layerName, this.tileset, 0, 0);
      if (layer) {
        layer.setDepth(index+1);
        this.layers.set(layerName, layer);
      }
    });
  }
}