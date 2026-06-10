import { Scene } from 'phaser';
import { SCENES, CARD, KANA, SOUNDS, IMAGES } from '../global/Constants';
import { itemByRomaji } from '../../data/content';

/**
 * Level-complete reward (ADR-0011 Phase 1 / ADR-0018): fanfare + the row's cards revealed one by
 * one (tap to hear). "Siguiente nivel" advances; "Repetir nivel" replays the row (the pond resets
 * its mastery). Both resume the pond and emit `reward-done` with `{ repeat }`.
 */
export class RewardScene extends Scene {
    constructor() {
        super(SCENES.REWARD);
    }

    create(data: { level: number; label: string; cards: string[]; isLast: boolean; stars?: number }): void {
        const { width, height } = this.scale;
        const cx = width / 2;

        const root = this.add.container(0, 0).setAlpha(0);
        root.add(this.add.rectangle(0, 0, width, height, 0x05131f, 0.88).setOrigin(0));

        root.add(this.add.text(cx, 80, '¡Nivel completo!', {
            fontFamily: 'Arial', fontSize: '46px', fontStyle: 'bold', color: '#ffd479',
        }).setOrigin(0.5));
        root.add(this.add.text(cx, 132, `Nivel ${data.level} · ${data.label}  —  ${data.cards.length} cartas`, {
            fontFamily: 'Arial', fontSize: '22px', color: '#9fe7ec',
        }).setOrigin(0.5));

        // Time-mode stars (1–3 by speed/timeouts).
        if (data.stars && data.stars > 0) {
            const starsText = this.add.text(cx, 168, '⭐'.repeat(data.stars), { fontSize: '30px' })
                .setOrigin(0.5).setScale(0);
            root.add(starsText);
            this.tweens.add({ targets: starsText, scale: 1, delay: 500, duration: 400, ease: 'Back.easeOut' });
        }

        root.add(this.add.text(cx, data.stars ? 202 : 178, 'Toca una carta para escucharla', {
            fontFamily: 'Arial', fontSize: '17px', color: '#eaf6f8',
        }).setOrigin(0.5));

        // The row's cards, revealed left to right.
        const gap = 24;
        const n = data.cards.length;
        const total = n * CARD.WIDTH + (n - 1) * gap;
        let x = cx - total / 2 + CARD.WIDTH / 2;
        const y = height / 2 + 30;
        data.cards.forEach((romaji, i) => {
            const card = this.buildCard(x, y, romaji);
            if (card) {
                root.add(card);
                this.tweens.add({
                    targets: card, scale: 1, alpha: 1,
                    delay: 350 + i * 250, duration: 320, ease: 'Back.easeOut',
                });
            }
            x += CARD.WIDTH + gap;
        });

        // Celebration: fanfare + bubble burst (same atlas the pond uses).
        this.sound.play(SOUNDS.FANFARE_SOUND);
        this.add.particles(cx, height / 2, IMAGES.BUBBLES, {
            frame: ['bluebubble', 'redbubble', 'greenbubble', 'silverbubble'],
            lifespan: 3500,
            speed: { min: 90, max: 170 },
            scale: { start: 0.5, end: 0 },
            rotate: { start: 0, end: 360 },
            gravityY: 20,
            blendMode: 'ADD',
            emitting: false,
        }).explode(90);

        // Repetir (left) · Siguiente/Terminar (right).
        const repeatBtn = this.add.text(cx - 16, height - 78, '↺ Repetir nivel', {
            fontFamily: 'Arial', fontSize: '24px', color: '#eaf6f8',
            backgroundColor: '#14485c', padding: { x: 18, y: 10 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        const nextBtn = this.add.text(cx + 16, height - 78, data.isLast ? 'Terminar ✔' : 'Siguiente nivel ▶', {
            fontFamily: 'Arial', fontSize: '24px', color: '#052233',
            backgroundColor: '#39c0c8', padding: { x: 18, y: 10 },
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        root.add([repeatBtn, nextBtn]);

        repeatBtn.on('pointerdown', () => this.close(true));
        nextBtn.on('pointerdown', () => this.close(false));

        this.tweens.add({ targets: root, alpha: 1, duration: 250 });
    }

    private close(repeat: boolean): void {
        this.scene.resume(SCENES.UNDERWATER_SCENE);
        this.scene.get(SCENES.UNDERWATER_SCENE).events.emit('reward-done', { repeat });
        this.scene.stop();
    }

    private buildCard(x: number, y: number, romaji: string): Phaser.GameObjects.Container | null {
        const item = itemByRomaji(romaji);
        if (!item) return null;

        const card = this.add.container(x, y).setScale(0.6).setAlpha(0);
        const bg = this.add.rectangle(0, 0, CARD.WIDTH, CARD.HEIGHT, CARD.BG).setStrokeStyle(3, CARD.BORDER);
        const glyph = this.add.text(0, -28, item.prompt, {
            fontFamily: KANA.FONT_FAMILY, fontSize: CARD.GLYPH_SIZE, color: '#ffffff',
            stroke: KANA.STROKE, strokeThickness: 4,
        }).setOrigin(0.5);
        const romajiText = this.add.text(0, 50, item.romaji, {
            fontFamily: 'Arial', fontSize: '30px', color: '#ffd479',
        }).setOrigin(0.5);
        const rarity = this.add.text(0, 84, CARD.RARITY, {
            fontFamily: 'Arial', fontSize: '13px', color: '#8fb3c2',
        }).setOrigin(0.5);
        card.add([bg, glyph, romajiText, rarity]);

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
            if (this.cache.audio.exists(item.audio)) this.sound.play(item.audio);
        });
        return card;
    }
}
