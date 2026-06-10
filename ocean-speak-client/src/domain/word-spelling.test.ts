import { describe, it, expect } from 'vitest';
import { startWord, tapKana, slotsFor } from './word-spelling';

const sushi = () => startWord(['す', 'し']);

describe('tapKana', () => {
    it('advances on the correct next kana and completes the word', () => {
        const s = sushi();
        let r = tapKana(s, 'す');
        expect(r.result).toBe('progress');
        expect(r.state.index).toBe(1);
        r = tapKana(r.state, 'し');
        expect(r.result).toBe('complete');
        expect(r.state.index).toBe(2);
    });

    it('breaks the chain on a wrong kana without punishment', () => {
        let s = sushi();
        ({ state: s } = tapKana(s, 'す'));
        const r = tapKana(s, 'か'); // wrong
        expect(r.result).toBe('break');
        expect(r.state.index).toBe(0); // start over
    });

    it('credits the restart when the wrong tap is the first kana', () => {
        let s = startWord(['か', 'き']);
        ({ state: s } = tapKana(s, 'か'));
        const r = tapKana(s, 'か'); // wrong (expected き) but it IS the first kana
        expect(r.result).toBe('break');
        expect(r.state.index).toBe(1); // chain restarts already holding か
    });

    it('handles repeated kana (なな)', () => {
        const s = startWord(['な', 'な']);
        let r = tapKana(s, 'な');
        expect(r.result).toBe('progress');
        r = tapKana(r.state, 'な');
        expect(r.result).toBe('complete');
    });
});

describe('slotsFor', () => {
    it('reveals tapped glyphs and masks the rest', () => {
        let s = sushi();
        expect(slotsFor(s)).toEqual(['＿', '＿']);
        ({ state: s } = tapKana(s, 'す'));
        expect(slotsFor(s)).toEqual(['す', '＿']);
    });
});
