// Pure word-spelling chain (modo palabras / catálogo de mini-juegos): tap kana in order to
// form a word (す → し → すし). No Phaser. The combat phase (ADR-0012) builds on this gradient.

export interface SpellState {
    /** Target glyphs in order, e.g. ['す','し']. */
    target: string[];
    /** How many glyphs are correctly chained so far. */
    index: number;
}

export type TapResult = 'progress' | 'complete' | 'break';

export function startWord(target: string[]): SpellState {
    return { target, index: 0 };
}

/**
 * Tap a glyph. The correct next glyph advances the chain ('complete' when the word is formed).
 * A wrong tap breaks the chain without punishment — it resets, crediting the tap when it matches
 * the word's first kana so starting over feels fair.
 */
export function tapKana(s: SpellState, glyph: string): { state: SpellState; result: TapResult } {
    if (glyph === s.target[s.index]) {
        const index = s.index + 1;
        return {
            state: { ...s, index },
            result: index >= s.target.length ? 'complete' : 'progress',
        };
    }
    return { state: { ...s, index: glyph === s.target[0] ? 1 : 0 }, result: 'break' };
}

/** Slots line for display: tapped glyphs revealed, the rest as placeholders (す ＿). */
export function slotsFor(s: SpellState, placeholder: string = '＿'): string[] {
    return s.target.map((g, i) => (i < s.index ? g : placeholder));
}
