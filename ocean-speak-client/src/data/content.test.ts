import { describe, it, expect } from 'vitest';
import { KANA_ITEMS, LEVELS, MAX_LEVEL, poolForLevel, itemByRomaji } from './content';

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
