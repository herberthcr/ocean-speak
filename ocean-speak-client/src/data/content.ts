// Typed accessors over the curated Komorebi content (komorebi_content.json).
// Keeps "content as data" (no hardcoded kana) and is unit-testable in isolation.
import type { KanaItem } from '../domain/kana-matching';
import raw from './komorebi_content.json';

export interface Level {
    level: number;
    label: string;
    /** Romaji introduced at this level (the new "row"). */
    adds: string[];
    /** Correct taps required per kana to master it (and earn its card) this level. */
    correctPerKana: number;
    /** Per-question time limit in ms for Time mode; 0 = no timer. */
    timeLimitMs: number;
}

export const KANA_ITEMS: KanaItem[] = raw.items.map((i) => ({
    prompt: i.prompt,
    romaji: i.romaji,
    audio: i.audio,
    script: i.script as 'hiragana' | 'katakana',
}));

export const LEVELS: Level[] = raw.levels.map((l) => ({
    level: l.level,
    label: l.label,
    adds: l.adds,
    correctPerKana: l.correctPerKana,
    timeLimitMs: l.timeLimitMs,
}));

export const MAX_LEVEL = LEVELS.length;

const BY_ROMAJI = new Map<string, KanaItem>(KANA_ITEMS.map((i) => [i.romaji, i]));
const BY_PROMPT = new Map<string, KanaItem>(KANA_ITEMS.map((i) => [i.prompt, i]));

/** A spellable word (modo palabras): curated so its reading uses only the 46 base kana. */
export interface VocabItem {
    word: string;
    reading: string;
    romaji: string;
    meaning: string;
    /** Audio asset key (word_*). */
    audio: string;
    /** Reading decomposed into glyphs, e.g. ['す','し']. */
    kana: string[];
    /** Same glyphs as kana romaji keys (pond sprites are named by romaji). */
    kanaRomaji: string[];
}

export const VOCAB_ITEMS: VocabItem[] = raw.vocab.map((v) => {
    const kana = v.reading.split('');
    return {
        word: v.word,
        reading: v.reading,
        romaji: v.romaji,
        meaning: v.es,
        audio: v.audio,
        kana,
        kanaRomaji: kana.map((g) => BY_PROMPT.get(g)?.romaji ?? ''),
    };
});

const VOCAB_BY_ROMAJI = new Map<string, VocabItem>(VOCAB_ITEMS.map((v) => [v.romaji, v]));

export function vocabByRomaji(romaji: string): VocabItem | undefined {
    return VOCAB_BY_ROMAJI.get(romaji);
}

/** Words fully spellable with the cumulative kana pool at `level`. */
export function wordsForLevel(level: number): VocabItem[] {
    const pool = new Set(poolForLevel(level).map((i) => i.prompt));
    return VOCAB_ITEMS.filter((v) => v.kana.every((g) => pool.has(g)));
}

export function itemByRomaji(romaji: string): KanaItem | undefined {
    return BY_ROMAJI.get(romaji);
}

/** Cumulative pool available at `level`: this level's rows plus every earlier level. */
export function poolForLevel(level: number): KanaItem[] {
    const romaji: string[] = [];
    for (const lvl of LEVELS) {
        if (lvl.level > level) break;
        romaji.push(...lvl.adds);
    }
    return romaji.map((r) => BY_ROMAJI.get(r)).filter((i): i is KanaItem => Boolean(i));
}

/** Level config by number (defaults to level 1 if out of range). */
export function levelConfig(level: number): Level {
    return LEVELS.find((l) => l.level === level) ?? LEVELS[0];
}
