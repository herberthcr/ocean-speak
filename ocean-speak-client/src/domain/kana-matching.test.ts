import { describe, it, expect } from 'vitest';
import { matches, normalizeRomaji, variantsFor, type KanaItem } from './kana-matching';

const ka: KanaItem = { prompt: 'か', romaji: 'ka', audio: 'hira_ka', script: 'hiragana' };
const shi: KanaItem = { prompt: 'し', romaji: 'shi', audio: 'hira_shi', script: 'hiragana' };
const tsu: KanaItem = { prompt: 'つ', romaji: 'tsu', audio: 'hira_tsu', script: 'hiragana' };
const a: KanaItem = { prompt: 'あ', romaji: 'a', audio: 'hira_a', script: 'hiragana' };

describe('normalizeRomaji', () => {
    it('lowercases, trims and strips non-letters', () => {
        expect(normalizeRomaji('  Ka! ')).toBe('ka');
        expect(normalizeRomaji('SHI')).toBe('shi');
        expect(normalizeRomaji('')).toBe('');
    });
});

describe('variantsFor', () => {
    it('returns canonical plus lenient variants', () => {
        expect(variantsFor('shi')).toEqual(['shi', 'si']);
        expect(variantsFor('tsu')).toEqual(['tsu', 'tu']);
        expect(variantsFor('ji')).toEqual(['ji', 'zi', 'di']);
    });
    it('returns just the canonical when there is no variant', () => {
        expect(variantsFor('ka')).toEqual(['ka']);
    });
});

describe('matches', () => {
    it('matches canonical romaji, case-insensitive', () => {
        expect(matches('ka', ka)).toBe(true);
        expect(matches('KA', ka)).toBe(true);
        expect(matches(' ka ', ka)).toBe(true);
    });

    it('matches lenient variants (shi/si, tsu/tu)', () => {
        expect(matches('si', shi)).toBe(true);
        expect(matches('shi', shi)).toBe(true);
        expect(matches('tu', tsu)).toBe(true);
        expect(matches('tsu', tsu)).toBe(true);
    });

    it('matches the kana glyph itself (ja-JP voice transcript)', () => {
        expect(matches('か', ka)).toBe(true);
        expect(matches('し', shi)).toBe(true);
    });

    it('matches explicit aliases', () => {
        const item: KanaItem = { ...a, alias: ['ah'] };
        expect(matches('ah', item)).toBe(true);
    });

    it('rejects non-matches and empty input', () => {
        expect(matches('ki', ka)).toBe(false);
        expect(matches('', ka)).toBe(false);
        expect(matches('   ', ka)).toBe(false);
        expect(matches('shi', ka)).toBe(false);
    });
});
