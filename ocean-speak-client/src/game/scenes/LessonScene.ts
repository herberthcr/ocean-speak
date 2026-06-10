import { Scene } from 'phaser';
import { SCENES, CARD, KANA } from '../global/Constants';
import type { KanaItem } from '../../domain/kana-matching';
import { t } from '../../i18n/strings';

/**
 * Level intro — the "lesson" (ADR-0006 teach-first, row-at-once per ADR-0018). Presents the
 * level's new row before play: each kana as a card (glyph + romaji), auto-played once in
 * sequence and tappable to re-hear. "¡A pescar!" closes it and emits `lesson-done`; the pond
 * keeps animating behind the dim overlay (it is not paused, only its input is disabled).
 */
export class LessonScene extends Scene {
    constructor() {
        super(SCENES.LESSON);
    }

    create(data: { level: number; label: string; items: KanaItem[] }): void {
        const { width, height } = this.scale;
        const cx = width / 2;

        const root = this.add.container(0, 0).setAlpha(0);
        root.add(this.add.rectangle(0, 0, width, height, 0x05131f, 0.86).setOrigin(0));

        root.add(this.add.text(cx, 96, `${t('level')} ${data.level} · ${data.label}`, {
            fontFamily: 'Arial', fontSize: '42px', fontStyle: 'bold', color: '#ffd479',
        }).setOrigin(0.5));
        root.add(this.add.text(cx, 150, t('lessonNewKana'), {
            fontFamily: 'Arial', fontSize: '20px', color: '#9fe7ec',
        }).setOrigin(0.5));

        // New-row cards, centered. Each pulses + plays once, in sequence, when audio is allowed.
        const gap = 24;
        const n = data.items.length;
        const total = n * CARD.WIDTH + (n - 1) * gap;
        let x = cx - total / 2 + CARD.WIDTH / 2;
        const y = height / 2 + 10;
        const cards: Phaser.GameObjects.Container[] = [];
        for (const item of data.items) {
            const card = this.buildCard(x, y, item);
            cards.push(card);
            root.add(card);
            x += CARD.WIDTH + gap;
        }

        const playSequence = () => data.items.forEach((item, i) =>
            this.time.delayedCall(400 + i * 800, () => this.pulseAndPlay(cards[i], item)));
        if (this.sound.locked) {
            this.sound.once('unlocked', playSequence); // browser audio unlocks on first gesture
        } else {
            playSequence();
        }

        const btn = this.add.text(cx, height - 84, t('lessonGo'), {
            fontFamily: 'Arial', fontSize: '30px', color: '#052233',
            backgroundColor: '#39c0c8', padding: { x: 22, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        root.add(btn);

        btn.on('pointerdown', () => {
            this.scene.get(SCENES.UNDERWATER_SCENE).events.emit('lesson-done');
            this.scene.stop();
        });

        this.tweens.add({ targets: root, alpha: 1, duration: 250 });
    }

    private buildCard(x: number, y: number, item: KanaItem): Phaser.GameObjects.Container {
        const card = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, CARD.WIDTH, CARD.HEIGHT, CARD.BG).setStrokeStyle(3, 0x39c0c8);
        const glyph = this.add.text(0, -28, item.prompt, {
            fontFamily: KANA.FONT_FAMILY, fontSize: CARD.GLYPH_SIZE, color: '#ffffff',
            stroke: KANA.STROKE, strokeThickness: 4,
        }).setOrigin(0.5);
        const romaji = this.add.text(0, 52, item.romaji, {
            fontFamily: 'Arial', fontSize: '30px', color: '#ffd479',
        }).setOrigin(0.5);
        card.add([bg, glyph, romaji]);

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this.pulseAndPlay(card, item));
        return card;
    }

    private pulseAndPlay(card: Phaser.GameObjects.Container, item: KanaItem): void {
        if (this.cache.audio.exists(item.audio)) this.sound.play(item.audio);
        this.tweens.add({ targets: card, scale: 1.08, duration: 140, yoyo: true, ease: 'Sine.easeInOut' });
    }
}
