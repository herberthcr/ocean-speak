import { Scene } from 'phaser';
import { SCENES, KANA } from '../global/Constants';
import type { KanaItem } from '../../domain/kana-matching';
import { t } from '../../i18n/strings';

/**
 * Teach-first overlay (ADR-0006): shown before a kana is ever evaluated. Presents the glyph,
 * its pronunciation (audio + romaji) and a mnemonic placeholder. The koi pond is paused behind
 * it; on "Continuar" we resume the pond and emit `teach-done` so it can pose the challenge.
 */
export class TeachScene extends Scene {
    constructor() {
        super(SCENES.TEACH);
    }

    create(data: { item: KanaItem }): void {
        const item = data.item;
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Dim the pond behind the card.
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x05131f, 0.82)
            .setOrigin(0);
        this.add.rectangle(cx, cy, 540, 440, 0x0d2a3f, 0.97).setStrokeStyle(4, 0x39c0c8);

        this.add.text(cx, cy - 175, t('teachNewKana'), {
            fontFamily: KANA.FONT_FAMILY, fontSize: '24px', color: '#9fe7ec',
        }).setOrigin(0.5);

        // Big glyph.
        this.add.text(cx, cy - 50, item.prompt, {
            fontFamily: KANA.FONT_FAMILY, fontSize: '150px', color: KANA.COLOR,
            stroke: KANA.STROKE, strokeThickness: 8,
        }).setOrigin(0.5);

        // Romaji + tap-to-hear speaker.
        this.add.text(cx - 30, cy + 70, item.romaji, {
            fontFamily: 'Arial', fontSize: '48px', color: '#ffd479',
        }).setOrigin(0.5);

        const speaker = this.add.text(cx + 80, cy + 70, '🔊', { fontSize: '40px' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        const play = () => {
            if (this.cache.audio.exists(item.audio)) this.sound.play(item.audio);
        };
        speaker.on('pointerdown', play);
        play(); // best-effort autoplay; first tap on the card unlocks audio if blocked

        this.add.text(cx, cy + 120, t('teachMnemonic'), {
            fontFamily: 'Arial', fontSize: '16px', color: '#6f97a8',
        }).setOrigin(0.5);

        const cont = this.add.text(cx, cy + 180, t('teachContinue'), {
            fontFamily: 'Arial', fontSize: '28px', color: '#ffffff',
            backgroundColor: '#1f6f78', padding: { x: 18, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        cont.on('pointerdown', () => {
            this.scene.resume(SCENES.UNDERWATER_SCENE);
            this.scene.get(SCENES.UNDERWATER_SCENE).events.emit('teach-done', item);
            this.scene.stop();
        });
    }
}
