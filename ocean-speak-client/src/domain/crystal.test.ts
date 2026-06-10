import { describe, it, expect } from 'vitest';
import { nextCrystalScale, isFullyCharged, CRYSTAL_GROWTH } from './crystal';

describe('nextCrystalScale', () => {
    it('charges up by STEP on a correct answer', () => {
        expect(nextCrystalScale(CRYSTAL_GROWTH.MIN, true)).toBeCloseTo(CRYSTAL_GROWTH.MIN + CRYSTAL_GROWTH.STEP);
    });

    it('never exceeds MAX', () => {
        expect(nextCrystalScale(CRYSTAL_GROWTH.MAX, true)).toBe(CRYSTAL_GROWTH.MAX);
        expect(nextCrystalScale(CRYSTAL_GROWTH.MAX - 0.1, true)).toBe(CRYSTAL_GROWTH.MAX);
    });

    it('does NOT discharge on a wrong answer (practice errors are not punished)', () => {
        expect(nextCrystalScale(1.5, false)).toBe(1.5);
        expect(nextCrystalScale(CRYSTAL_GROWTH.MIN, false)).toBe(CRYSTAL_GROWTH.MIN);
    });
});

describe('isFullyCharged', () => {
    it('is true at or above MAX', () => {
        expect(isFullyCharged(CRYSTAL_GROWTH.MAX)).toBe(true);
        expect(isFullyCharged(CRYSTAL_GROWTH.MIN)).toBe(false);
    });
});
