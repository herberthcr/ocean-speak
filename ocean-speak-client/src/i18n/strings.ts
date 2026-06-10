// Minimal UI i18n (ES default, EN). The language is persisted and broadcast on the EventBus;
// React re-renders live, Phaser scenes pick it up on creation (the toggle lives in the menu,
// so every scene is created after a change). Vocabulary meanings come localized from the
// content JSON (es/en fields), not from here.
import { EventBus } from '../game/EventBus';

export type Lang = 'es' | 'en';

const STORAGE_KEY = 'komorebi.lang.v1';

export function currentLang(): Lang {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === 'es' || v === 'en') return v;
    } catch { /* storage unavailable */ }
    return 'es';
}

export function setLang(lang: Lang): void {
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* storage unavailable */ }
    EventBus.emit('lang-changed', lang);
}

const es = {
    pondTitle: 'Estanque de koi',
    level: 'Nivel',
    cards: 'Cartas',
    words: 'Palabras',
    modeRelax: 'Relax',
    modeRelaxDesc: 'Aprende a tu ritmo, sin reloj',
    modeTime: 'Tiempo',
    modeTimeDesc: 'Contra reloj — gana estrellas',
    modeWords: 'Palabras',
    modeWordsDesc: 'Forma palabras tocando los koi en orden',
    modeFree: 'Libre',
    modeFreeDesc: 'Toca cualquier koi y escúchalo',
    lessonNewKana: 'Kana nuevos — toca una carta para escucharla',
    lessonGo: '¡A pescar!  🎣',
    teachNewKana: 'Nuevo kana',
    teachContinue: 'Continuar  ▶',
    teachMnemonic: '(mnemónico próximamente)',
    levelComplete: '¡Nivel completo!',
    tapCardToHear: 'Toca una carta para escucharla',
    repeatLevel: '↺ Repetir nivel',
    nextLevel: 'Siguiente nivel ▶',
    finish: 'Terminar ✔',
    tap: 'Toca',
    whichSoundsA: '¿Cuál suena  "',
    whichSoundsB: '"?',
    freeModeMsg: 'Modo libre — toca y escucha',
    tapAnyKoi: 'Toca cualquier koi  🐟',
    wordsModeMsg: 'Modo palabras — toca los kana en orden',
    hiraganaDone: '¡Completaste el hiragana! 🎉',
    hiraganaCollectionDone: 'Colección de hiragana completa',
    newCard: '¡Carta nueva!',
    newWordCard: '¡Carta de palabra!',
    panelChooseMode: 'Elige un modo para empezar',
    panelTapKana: 'Toca este kana',
    panelWhichSounds: '¿Cuál suena así?',
    panelFreeTitle: '🐟 Modo libre',
    panelTapKoiHint: 'Toca un koi para escucharlo',
    panelWordTitle: '🍣 Forma la palabra',
    listen: '🔊 Escuchar',
    voice: '🎤 Voz',
    review: '✨ Repaso',
    collection: 'Colección',
    reset: '↺ Reiniciar',
    confirmReset: '¿Reiniciar todo el progreso? Se pierden cartas y niveles.',
    notEarnedYet: 'Aún no conseguida',
    flipToHear: 'Voltear / escuchar',
    voiceTooltip: 'Di el kana en voz alta — recoge todas las coincidencias',
};

const en: typeof es = {
    pondTitle: 'Koi Pond',
    level: 'Level',
    cards: 'Cards',
    words: 'Words',
    modeRelax: 'Relax',
    modeRelaxDesc: 'Learn at your own pace, no clock',
    modeTime: 'Time',
    modeTimeDesc: 'Against the clock — earn stars',
    modeWords: 'Words',
    modeWordsDesc: 'Spell words by tapping koi in order',
    modeFree: 'Free',
    modeFreeDesc: 'Tap any koi to hear it',
    lessonNewKana: 'New kana — tap a card to hear it',
    lessonGo: "Let's fish!  🎣",
    teachNewKana: 'New kana',
    teachContinue: 'Continue  ▶',
    teachMnemonic: '(mnemonic coming soon)',
    levelComplete: 'Level complete!',
    tapCardToHear: 'Tap a card to hear it',
    repeatLevel: '↺ Replay level',
    nextLevel: 'Next level ▶',
    finish: 'Finish ✔',
    tap: 'Tap',
    whichSoundsA: 'Which one sounds like  "',
    whichSoundsB: '"?',
    freeModeMsg: 'Free mode — tap and listen',
    tapAnyKoi: 'Tap any koi  🐟',
    wordsModeMsg: 'Words mode — tap the kana in order',
    hiraganaDone: 'You completed hiragana! 🎉',
    hiraganaCollectionDone: 'Hiragana collection complete',
    newCard: 'New card!',
    newWordCard: 'Word card!',
    panelChooseMode: 'Pick a mode to start',
    panelTapKana: 'Tap this kana',
    panelWhichSounds: 'Which one sounds like this?',
    panelFreeTitle: '🐟 Free mode',
    panelTapKoiHint: 'Tap a koi to hear it',
    panelWordTitle: '🍣 Spell the word',
    listen: '🔊 Listen',
    voice: '🎤 Voice',
    review: '✨ Review',
    collection: 'Collection',
    reset: '↺ Reset',
    confirmReset: 'Reset all progress? Cards and levels will be lost.',
    notEarnedYet: 'Not earned yet',
    flipToHear: 'Flip / listen',
    voiceTooltip: 'Say the kana out loud — collects every match',
};

const STRINGS: Record<Lang, typeof es> = { es, en };

export type StringKey = keyof typeof es;

export function t(key: StringKey): string {
    return STRINGS[currentLang()][key];
}
