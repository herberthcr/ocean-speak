import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { SCENES, BACKGROUNDS, IMAGES, SOUNDS, KANA } from '../global/Constants';
import { progressStore } from '../../state/progressStore';
import { levelConfig, levelLabel, KANA_ITEMS } from '../../data/content';
import { splitCollection } from '../../domain/progress';
import { t, currentLang, setLang, type Lang } from '../../i18n/strings';

type PondMode = 'relax' | 'time' | 'free' | 'words';

interface ModeOption {
    mode: PondMode;
    /** Kanji icon (rendered in Noto on a tinted plate — crisp on every OS, unlike emoji). */
    kanji: string;
    color: number;
    title: string;
    desc: string;
}

/**
 * Mode select — the simplified Komorebi replacement for Ocean Speak's MenuScene (which handled
 * names, teacher/online and difficulty we don't use). Reuses its look: blue background, tunnel
 * shader, bubbles and hover/click sounds. Routes into the koi pond with the chosen pondMode.
 * Hosts the ES/EN language toggle; scenes read the language when they are created.
 */
export class ModeSelectScene extends Scene {
    constructor() {
        super(SCENES.MODE_SELECT);
    }

    create(): void {
        const cx = this.scale.width / 2;
        const lang = currentLang();
        this.cameras.main.fadeIn(600, 0, 20, 35);

        // Komorebi menu: the pond itself, dimmed, with light shafts — no arcade tunnel shader.
        this.add.image(0, 0, BACKGROUNDS.OCEAN_COMPLETE).setOrigin(0);
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x05131f, 0.55).setOrigin(0);
        [{ x: 240, rot: -0.16, a: 0.12 }, { x: 700, rot: -0.22, a: 0.09 }].forEach((s, i) => {
            const shaft = this.add.image(s.x, -30, 'lightShaft')
                .setOrigin(0.5, 0).setRotation(s.rot).setAlpha(s.a)
                .setTint(0xfff2c9).setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
                targets: shaft, alpha: s.a * 0.5, duration: 3000 + i * 800,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        });
        this.add.particles(0, 0, IMAGES.BUBBLES, {
            x: { min: 0, max: this.scale.width },
            y: { min: 0, max: this.scale.height },
            speed: 50,
            lifespan: 2000,
            scale: { start: 0.5, end: 0 },
            quantity: 50,
        }).setAlpha(0.2);

        // Bilingual title: the hiragana wordmark with its romaji reading underneath.
        this.add.text(cx, 92, 'こもれび', {
            fontFamily: KANA.FONT_FAMILY, fontSize: '60px', fontStyle: 'bold',
            color: '#ffffff', stroke: KANA.STROKE, strokeThickness: 8,
        }).setOrigin(0.5);
        const romajiTitle = this.add.text(cx, 144, 'K O M O R E B I', {
            fontFamily: 'Arial', fontSize: '21px', fontStyle: 'bold', color: '#ffd479',
        }).setOrigin(0.5).setAlpha(0.95);
        romajiTitle.setShadow(0, 2, '#05131f', 4, true, true);
        this.add.text(cx, 180, t('pondTitle'), {
            fontFamily: 'Arial', fontSize: '21px', color: '#9fe7ec',
        }).setOrigin(0.5);

        const level = progressStore.currentLevel;
        const cfg = levelConfig(level);
        const { kana, words } = splitCollection(progressStore.collection());
        const cardsLine = `${t('level')} ${cfg.level} · ${levelLabel(cfg, lang)}    ·    ${t('cards')}: ${kana.length}/${KANA_ITEMS.length}`
            + (words.length > 0 ? `    ·    ${t('words')}: ${words.length}` : '');
        this.add.text(cx, 215, cardsLine, {
            fontFamily: 'Arial', fontSize: '18px', color: '#eaf6f8',
        }).setOrigin(0.5);

        // Icons are kanji on tinted plates: 禅 zen · 時 time · 語 word · 魚 fish.
        const options: ModeOption[] = [
            { mode: 'relax', kanji: '禅', color: 0x7ee8f0, title: t('modeRelax'), desc: t('modeRelaxDesc') },
            { mode: 'time', kanji: '時', color: 0xffd479, title: t('modeTime'), desc: t('modeTimeDesc') },
            { mode: 'words', kanji: '語', color: 0xff8e7a, title: t('modeWords'), desc: t('modeWordsDesc') },
            { mode: 'free', kanji: '魚', color: 0x9ecbff, title: t('modeFree'), desc: t('modeFreeDesc') },
        ];
        options.forEach((o, i) => this.makeButton(cx, 298 + i * 112, o));

        this.makeLangToggle(lang);

        // Clear the side panel while in the menu.
        EventBus.emit('kana-target', null);
        EventBus.emit('word-target', null);
        EventBus.emit('row-progress', null);
        EventBus.emit('current-scene-ready', this);
    }

    // ES | EN switch (top-right). Persists and re-renders the menu in place.
    private makeLangToggle(lang: Lang): void {
        const make = (x: number, code: Lang, label: string) => {
            const txt = this.add.text(x, 36, label, {
                fontFamily: 'Arial', fontSize: '20px', fontStyle: lang === code ? 'bold' : 'normal',
                color: lang === code ? '#ffd479' : '#9fe7ec',
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            txt.on('pointerdown', () => {
                if (currentLang() !== code) {
                    this.sound.play(SOUNDS.MOUSE_CLICK_SOUND);
                    setLang(code);
                    this.scene.restart();
                }
            });
            return txt;
        };
        make(this.scale.width - 96, 'es', 'ES');
        this.add.text(this.scale.width - 72, 36, '|', {
            fontFamily: 'Arial', fontSize: '18px', color: '#5a7d8c',
        }).setOrigin(0.5);
        make(this.scale.width - 48, 'en', 'EN');
    }

    private makeButton(x: number, y: number, o: ModeOption): void {
        const c = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 470, 96, 0x0d2a3f, 0.92).setStrokeStyle(3, 0x39c0c8);
        const plate = this.add.circle(-195, 0, 28, o.color, 0.16).setStrokeStyle(2, o.color, 0.9);
        const icon = this.add.text(-195, 0, o.kanji, {
            fontFamily: KANA.FONT_FAMILY, fontSize: '32px', fontStyle: 'bold',
            color: '#ffffff', stroke: KANA.STROKE, strokeThickness: 3,
        }).setOrigin(0.5);
        const title = this.add.text(-148, -17, o.title, {
            fontFamily: 'Arial', fontSize: '30px', fontStyle: 'bold', color: '#ffd479',
        }).setOrigin(0, 0.5);
        const desc = this.add.text(-148, 21, o.desc, {
            fontFamily: 'Arial', fontSize: '17px', color: '#9fe7ec',
        }).setOrigin(0, 0.5);
        c.add([bg, plate, icon, title, desc]);

        if (o.mode === 'time') {
            const stars = progressStore.starsFor(progressStore.currentLevel);
            if (stars > 0) {
                c.add(this.add.text(160, 0, '⭐'.repeat(stars), { fontSize: '22px' }).setOrigin(0.5));
            }
        }

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
            this.sound.play(SOUNDS.MOUSE_OVER_SOUND);
            bg.setStrokeStyle(3, 0xffd479);
            this.tweens.add({ targets: c, scale: 1.04, duration: 150, ease: 'Sine.easeOut' });
        });
        bg.on('pointerout', () => {
            bg.setStrokeStyle(3, 0x39c0c8);
            this.tweens.add({ targets: c, scale: 1, duration: 150, ease: 'Sine.easeOut' });
        });
        bg.on('pointerdown', () => this.launch(o.mode));
    }

    private launch(mode: PondMode): void {
        this.sound.play(SOUNDS.MOUSE_CLICK_SOUND);
        // First user gesture: safe spot to start the ambient loop (browser audio unlocked).
        if (!this.sound.get(SOUNDS.OCEAN_WAVES)) {
            this.sound.add(SOUNDS.OCEAN_WAVES, { loop: true }).play();
        }
        this.cameras.main.fadeOut(400, 0, 20, 35);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENES.UNDERWATER_SCENE, {
                playerName: 'Aprendiz',
                isTeacher: false,
                mode: 'solo',
                difficulty: 'easy',
                teacherName: '',
                speechRecognitionOn: 'off',
                pondMode: mode,
            });
        });
    }
}
