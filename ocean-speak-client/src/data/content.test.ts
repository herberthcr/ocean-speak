import { describe, it, expect } from 'vitest';
import { KANA_ITEMS, LEVELS, MAX_LEVEL, poolForLevel, itemByRomaji, VOCAB_ITEMS, wordsForLevel, vocabByRomaji } from './content';

describe('content data', () => {
    it('has the 46 base hiragana', () => {
        expect(KANA_ITEMS.length).toBe(46);
        expect(LEVELS.length).toBe(10);
    });

    it('every item has a hira_ audio key and a glyph', () => {
        for (const item of KANA_ITEMS) {
            expect(item.audio).toMatch(/^hira_/);
            expect(item.prompt.length).toBeGreaterThan(0);
            expect(item.script).toBe('hiragana');
        }
    });

    it('level 1 pool is exactly the five vowels', () => {
        expect(poolForLevel(1).map((i) => i.romaji)).toEqual(['a', 'i', 'u', 'e', 'o']);
    });

    it('pools are cumulative (level 2 = vowels + K row)', () => {
        expect(poolForLevel(2).map((i) => i.romaji)).toEqual(
            ['a', 'i', 'u', 'e', 'o', 'ka', 'ki', 'ku', 'ke', 'ko'],
        );
    });

    it('the last level pool covers all 46 kana', () => {
        expect(poolForLevel(MAX_LEVEL).length).toBe(46);
    });

    it('resolves items by romaji', () => {
        expect(itemByRomaji('shi')?.prompt).toBe('し');
        expect(itemByRomaji('zzz')).toBeUndefined();
    });
});

describe('vocab (modo palabras)', () => {
    it('every word is 2-4 morae, fully decomposable into the 46 base kana, with word_ audio', () => {
        const prompts = new Set(KANA_ITEMS.map((i) => i.prompt));
        expect(VOCAB_ITEMS.length).toBeGreaterThan(50);
        for (const v of VOCAB_ITEMS) {
            expect(v.kana.length).toBeGreaterThanOrEqual(2);
            expect(v.kana.length).toBeLessThanOrEqual(4);
            for (const g of v.kana) expect(prompts.has(g)).toBe(true);
            for (const r of v.kanaRomaji) expect(r).not.toBe('');
            expect(v.audio).toMatch(/^word_/);
        }
    });

    it('wordsForLevel only offers words spellable with the cumulative pool', () => {
        const lvl1 = wordsForLevel(1); // vowels only
        for (const v of lvl1) {
            expect(v.kana.every((g) => 'あいうえお'.includes(g))).toBe(true);
        }
        // the full pool can spell every curated word
        expect(wordsForLevel(MAX_LEVEL).length).toBe(VOCAB_ITEMS.length);
        // pools only grow
        expect(wordsForLevel(3).length).toBeGreaterThanOrEqual(lvl1.length);
    });

    it('resolves vocab by romaji (sushi)', () => {
        const sushi = vocabByRomaji('sushi');
        expect(sushi?.reading).toBe('すし');
        expect(sushi?.kanaRomaji).toEqual(['su', 'shi']);
    });
});
