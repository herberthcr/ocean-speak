import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { ECSWorld } from '../ecs/ECSWorld';
import { InputSystem } from '../systems/InputSystem';
import { DEFAULT_DIFFICULTY, IMAGES, BACKGROUNDS, SHADERS, SCENES, SOUNDS } from '../global/Constants';

export class SplashScene extends Scene {
    private logo: any;
    private world: ECSWorld;
    private particles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
    private backgroundMusic!: Phaser.Sound.BaseSound;
    private sunlight: Phaser.GameObjects.Light;

    constructor() {
        super('SplashScene');
        this.logo = null;
    }

    create() {
        this.cameras.main.fadeIn(1000, 0, 150, 200);
        this.add.image(0, 0, BACKGROUNDS.OCEAN_COMPLETE).setOrigin(0).setPipeline('Light2D');;
        this.sunlight = this.lights.addLight(this.cameras.main.centerX / 2.5, 80, 100).setIntensity(3);
        this.lights.enable().setAmbientColor(0xF4E99B);

        // Create a tween for the light that moves from bottom to top (simulating sunrise)
        this.tweens.add({
            targets: this.sunlight,
            y: this.cameras.main.height / 2, 
            intensity: 1, 
            duration: 12000, 
            ease: 'Sine.inOut', 
            onComplete: () => {
                this.sunset(); 
            },
        });

        this.logo = this.add.image(512, 350, 'logo').setDepth(100).setScale(0.80);
        this.add.shader(SHADERS.TUNNEL_SHADER, 0, 0, this.scale.width, this.scale.height).setOrigin(0);
        // Play the background music
        if (!this.sound.get(SOUNDS.OCEAN_WAVES)) {
            this.backgroundMusic = this.sound.add(SOUNDS.OCEAN_WAVES, { loop: true });
            //this.backgroundMusic.volume= .5;
            this.backgroundMusic.play();
        }

        const fx = this.logo.postFX.addShine(0.3, .2, 1);
        this.add.tween({
            targets: this.logo,
            scaleX: 0.81,
            scaleY: 0.81,
            ease: "Elastic",
            duration: Phaser.Math.Between(10000, 16000),
            repeat: -1, // -1: infinity
            yoyo: false
        });

        EventBus.emit('current-scene-ready', this);

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Disable input
            this.input.enabled = false;

            this.particles = this.add.particles(100, 568, IMAGES.BUBBLES, {
                x: { min: 0, max: this.scale.width },
                y: { min: 0, max: this.scale.height },
                speed: 200,
                lifespan: 2000,
                scale: { start: 0.5, end: 0 },
                quantity: 50,
            }).setAlpha(0.6);

            this.cameras.main.fadeOut(2500, 0, 150, 200); // Fade to black over 1 second
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.particles.destroy();
                this.scene.start(SCENES.MENU); // Switch to the main game scene
            });
        });
    }

    // Simulate sunset by moving the light back down and lowering intensity
    sunset(): void {
        this.tweens.add({
            targets: this.sunlight,
            y: this.cameras.main.height + 100, // Move light below the screen (simulating sunset)
            intensity: 0.1, 
            duration: 8000, 
            ease: 'Sine.inOut', 
            onComplete: () => {
                this.sunrise(); // After sunset, initiate sunrise again
            },
        });
    }
    // Reset the sunlight position to the bottom and intensity to low (for sunrise)
    sunrise(): void {
        this.sunlight.y = this.cameras.main.height + 100; 
        this.sunlight.setIntensity(0.5); 
        this.tweens.add({
            targets: this.sunlight,
            y: this.cameras.main.height / 8, 
            intensity: 2, 
            duration: 20000,
            ease: 'Sine.inOut',
            onComplete: () => {
                this.sunset(); // Start sunset after reaching midday
            },
        });
    }

    playGame() {
        this.scene.start(SCENES.MENU);
    }
}
