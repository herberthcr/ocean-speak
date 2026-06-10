import { describe, it, expect } from 'vitest';
import {
    emptyProgress,
    recordCorrect,
    markTaught,
    isMastered,
    isOwned,
    isTaught,
    levelComplete,
    masteryOf,
    resetMastery,
} from './progress';

describe('recordCorrect', () => {
    it('increments mastery and awards the card exactly at the threshold', () => {
        let s = emptyProgress();
        let awarded = false;
        for (let i = 1; i <= 4; i++) {
            ({ state: s, awarded } = recordCorrect(s, 'a', 4));
            expect(masteryOf(s, 'a')).toBe(i);
            expect(awarded).toBe(i === 4); // only awarded on the 4th
        }
        expect(isOwned(s, 'a')).toBe(true);
        expect(isMastered(s, 'a', 4)).toBe(true);
    });

    it('does not re-award after mastery (idempotent collection)', () => {
        let s = emptyProgress();
        for (let i = 0; i < 4; i++) ({ state: s } = recordCorrect(s, 'a', 4));
        const { state, awarded } = recordCorrect(s, 'a', 4);
        expect(awarded).toBe(false);
        expect(state.collection.filter((r) => r === 'a')).toHaveLength(1);
    });

    it('never mutates the input state', () => {
        const s = emptyProgress();
        recordCorrect(s, 'a', 4);
        expect(s.mastery).toEqual({});
        expect(s.collection).toEqual([]);
    });
});

describe('markTaught / isTaught', () => {
    it('marks once and is idempotent', () => {
        let s = emptyProgress();
        expect(isTaught(s, 'a')).toBe(false);
        s = markTaught(s, 'a');
        s = markTaught(s, 'a');
        expect(isTaught(s, 'a')).toBe(true);
        expect(s.taught).toEqual(['a']);
    });
});

describe('resetMastery', () => {
    it('clears tap counts but keeps cards and taught status', () => {
        let s = emptyProgress();
        s = markTaught(s, 'a');
        for (let i = 0; i < 4; i++) ({ state: s } = recordCorrect(s, 'a', 4));
        expect(isOwned(s, 'a')).toBe(true);

        const reset = resetMastery(s, ['a']);
        expect(masteryOf(reset, 'a')).toBe(0);
        expect(isOwned(reset, 'a')).toBe(true);   // card stays
        expect(isTaught(reset, 'a')).toBe(true);  // no re-teach
        expect(levelComplete(reset, ['a'], 4)).toBe(false); // level replayable
    });

    it('only clears the given romaji', () => {
        let s = emptyProgress();
        ({ state: s } = recordCorrect(s, 'a', 4));
        ({ state: s } = recordCorrect(s, 'ka', 4));
        const reset = resetMastery(s, ['a']);
        expect(masteryOf(reset, 'a')).toBe(0);
        expect(masteryOf(reset, 'ka')).toBe(1);
    });
});

describe('levelComplete', () => {
    it('is true only when every row kana is mastered', () => {
        let s = emptyProgress();
        const row = ['a', 'i', 'u'];
        const master = (r: string) => { for (let i = 0; i < 4; i++) ({ state: s } = recordCorrect(s, r, 4)); };
        expect(levelComplete(s, row, 4)).toBe(false);
        master('a'); master('i');
        expect(levelComplete(s, row, 4)).toBe(false);
        master('u');
        expect(levelComplete(s, row, 4)).toBe(true);
    });
});
