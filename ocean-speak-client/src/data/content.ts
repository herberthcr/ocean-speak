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
