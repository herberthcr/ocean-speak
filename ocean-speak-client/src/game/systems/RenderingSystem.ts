import { ECSWorld } from '../ecs/ECSWorld';
import Phaser from 'phaser';
import { System } from './System';

interface ParallaxLayer {
  imageKey: string;
  sprite: Phaser.GameObjects.TileSprite;
  speed: number; // Parallax speed
}

interface ParallaxSpriteLayer {
  sprites: Phaser.GameObjects.Sprite[]; // Two sprites for seamless scrolling
  speed: number; // Parallax speed
  direction: { x: number; y: number }; // Direction for movement
}



export class RenderingSystem extends System {
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private layers: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
  private tileset!: Phaser.Tilemaps.Tileset;
  private parallaxLayers: ParallaxLayer[] = [];
  private parallaxSprites: ParallaxSpriteLayer[] = [];
  private shaderOverlay?: Phaser.GameObjects.Shader;
  private particleManager!: Phaser.GameObjects.Particles.ParticleEmitterManager;

  constructor(scene: Phaser.Scene, world: ECSWorld) {
    super(world, scene);
  }

  // Add a parallax background layer
  addParallaxLayer(imageKey: string, speed: number, depth: number, scale: number): void {
      const sprite = this.scene.add.tileSprite(0, 0, this.scene.scale.width, this.scene.scale.height, imageKey).setScale(20).setOrigin(0);
      sprite.setDepth(depth); // Set depth for background layers
      this.parallaxLayers.push({ imageKey, speed, sprite });
  }

    // Add a sprite-based parallax layer
    addParallaxSprite(imageKey: string, speed: number, direction: { x: number; y: number } = { x: 1, y: 0 }): void {
      const { width, height } = this.scene.scale;

      // Create two sprites for seamless scrolling
      const sprite1 = this.scene.add.sprite(0, 0, imageKey).setOrigin(0, 0).setAlpha(0.09);
      const sprite2 = this.scene.add.sprite(direction.x ? width : 0, direction.y ? height : 0, imageKey).setOrigin(0, 0).setAlpha(0.09);

      sprite1.setDepth(100); // Background layer depth
      sprite2.setDepth(100); // Background layer depth
      sprite1.setScale(1); // Background depth.
      sprite2.setScale(1); // Background depth.

      this.parallaxSprites.push({ sprites: [sprite1, sprite2], speed, direction });

      this.scene.tweens.add({
        targets: sprite1,
        scaleY: 1.1,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });
      this.scene.tweens.add({
        targets: sprite2,
        scaleY: 1.1,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });

  }

   // Add a bubble emitter
   addBubbleEmitter(): void {
        this.particleManager = this.scene.add.particles(100, 568, 'bubbles', {
          frame: [ 'silverbubble' ],
          scale: { min: 0.05, max: 0.5 },
          rotate: { start: 0, end: 360 },
          speed: { min: 25, max: 50 },
          lifespan: 6000,
          frequency: 600,
          gravityY: -35
      }).setAlpha(0.6);

      this.scene.tweens.add({
        targets: this.particleManager,
        particleX: 700,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inout',
        duration: 1500
  });
}

  
  // Add a shader overlay
  addShader(shaderKey: string): void {
      this.shaderOverlay = this.scene.add.shader(shaderKey, 0, 0, this.scene.scale.width, this.scene.scale.height).setOrigin(0);
      this.shaderOverlay.setDepth(-1); // Ensure it overlays everything
  }

  // Update method to handle parallax and shaders
  update(delta: number): void {
   

    const { width, height } = this.scene.scale;
        // Update tile-based parallax layers only if there is no shader
        if (!this.shaderOverlay) {  
          this.parallaxLayers.forEach((layer) => {
            
                layer.sprite.tilePositionX += layer.speed * delta * 1; // Adjust speed
          });
        }

      // Update sprite-based parallax layers
      this.parallaxSprites.forEach((layer) => {
        const { sprites, speed, direction } = layer;

        sprites.forEach((sprite) => {
            // Move the sprite in the specified direction
            sprite.x -= direction.x * speed * delta * 0.001;
            sprite.y -= direction.y * speed * delta * 0.001;
        });

        // Handle wrapping
        const [sprite1, sprite2] = sprites;
        if (direction.x > 0) {
            // Horizontal scrolling to the left
            if (sprite1.x + width <= 0) {
                sprite1.x = sprite2.x + width;
            }
            if (sprite2.x + width <= 0) {
                sprite2.x = sprite1.x + width;
            }
        }

        if (direction.y > 0) {
            // Vertical scrolling upward
            if (sprite1.y + height <= 0) {
                sprite1.y = sprite2.y + height;
            }
            if (sprite2.y + height <= 0) {
                sprite2.y = sprite1.y + height;
            }
        }
      });
  }


   /* 
      //NEED TO CHECK WHY IS NOT WORKING WITH SHADERS, USING A PARALAX BG FOR NOW
      // Code to Add Rendering System to an Scene
      const renderingSystem = new RenderingSystem(this, this.world);
      this.world.addSystem(renderingSystem);
      renderingSystem.setupTilemap('ocean_tilemap', 'ocean_tiles', ['waterLayer', 'sandLayer' ]); 
  */
  setupTilemap(mapKey: string, tilesetKey: string, layerNames: string[]): void {
    // create the Tilemap
    this.tilemap = this.scene.make.tilemap({ key: mapKey });
    // add the tileset image we are using
    this.tileset = this.tilemap.addTilesetImage(tilesetKey, tilesetKey, 64, 64);

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