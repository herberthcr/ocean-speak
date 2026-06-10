import { Scene } from 'phaser';
import { SCENES, SOUNDS, KANA } from '../global/Constants';
import { t } from '../../i18n/strings';

/**
 * Time mode fail state: the level budget hit zero. Gentle in tone but a real loss — the run
 * ends here. "Reintentar" replays the level (the pond resets the row's mastery; cards and
 * taught status are kept), "Menú" leaves. Emits `timeup-done` with `{ retry }`.
 */
export class TimeUpScene extends Scene {
    constructor() {
        super(SCENES.TIME_UP);
    }

    create(): void {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        const root = this.add.container(0, 0).setAlpha(0);
        root.add(this.add.rectangle(0, 0, width, height, 0x05131f, 0.88).setOrigin(0));

        // 時 on a red plate — same icon language as the menu.
        root.add(this.add.circle(cx, cy - 116, 42, 0xff6b6b, 0.16).setStrokeStyle(2, 0xff6b6b, 0.9));
        root.add(this.add.text(cx, cy - 116, '時', {
            fontFamily: KANA.FONT_FAMILY, fontSize: '46px', fontStyle: 'bold',
            color: '#ffffff', stroke: KANA.STROKE, strokeThickness: 3,
        }).setOrigin(0.5));

        root.add(this.add.text(cx, cy - 34, t('timeUp'), {
            fontFamily: 'Arial', fontSize: '46px', fontStyle: 'bold', color: '#ff8e7a',
        }).setOrigin(0.5));
        root.add(this.add.text(cx, cy + 12, t('timeUpHint'), {
            fontFamily: 'Arial', fontSize: '18px', color: '#9fe7ec',
        }).setOrigin(0.5));

        const menuBtn = this.add.text(cx - 16, cy + 92, t('toMenu'), {
            fontFamily: 'Arial', fontSize: '24px', color: '#eaf6f8',
            backgroundColor: '#14485c', padding: { x: 18, y: 10 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        const retryBtn = this.add.text(cx + 16, cy + 92, t('retry'), {
            fontFamily: 'Arial', fontSize: '24px', color: '#052233',
            backgroundColor: '#39c0c8', padding: { x: 18, y: 10 },
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        root.add([menuBtn, retryBtn]);

        menuBtn.on('pointerdown', () => this.close(false));
        retryBtn.on('pointerdown', () => this.close(true));

        this.sound.play(SOUNDS.INCORRECT_SOUND);
        this.tweens.add({ targets: root, alpha: 1, duration: 250 });
    }

    private close(retry: boolean): void {
        this.scene.resume(SCENES.UNDERWATER_SCENE);
        this.scene.get(SCENES.UNDERWATER_SCENE).events.emit('timeup-done', { retry });
        this.scene.stop();
    }
}
