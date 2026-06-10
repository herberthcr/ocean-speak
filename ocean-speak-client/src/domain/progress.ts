// Pure progress model — no Phaser, no localStorage. The runtime store (state/progressStore.ts)
// wraps these transitions with persistence; this layer is unit-tested in isolation.
//
// A kana is "mastered" once tapped correctly `threshold` times; mastering it awards its card
// (a card == a ContentItem, per docs/systems/card-system.md). Practice mistakes never subtract.

export interface ProgressState {
    /** Kana (romaji) already taught — so teach-first never repeats. */
    taught: string[];
    /** romaji → correct-tap count. */
    mastery: Record<string, number>;
    /** romaji of owned cards (mastered kana). */
    collection: string[];
    /** Highest level the player is working on (1-based). */
    currentLevel: number;
}

export function emptyProgress(): ProgressState {
    return { taught: [], mastery: {}, collection: [], currentLevel: 1 };
}

export function masteryOf(s: ProgressState, romaji: string): number {
    return s.mastery[romaji] ?? 0;
}

export function isMastered(s: ProgressState, romaji: string, threshold: number): boolean {
    return masteryOf(s, romaji) >= threshold;
}

export function isOwned(s: ProgressState, romaji: string): boolean {
    return s.collection.includes(romaji);
}

export function isTaught(s: ProgressState, romaji: string): boolean {
    return s.taught.includes(romaji);
}

export function markTaught(s: ProgressState, romaji: string): ProgressState {
    if (s.taught.includes(romaji)) return s;
    return { ...s, taught: [...s.taught, romaji] };
}

/**
 * Register a correct tap of `romaji`. Bumps mastery; when it reaches `threshold` for the first
 * time, the card is awarded (added to the collection). Returns the new state and whether a card
 * was newly awarded (for the "instant pop").
 */
export function recordCorrect(
    s: ProgressState,
    romaji: string,
    threshold: number,
): { state: ProgressState; awarded: boolean } {
    const count = masteryOf(s, romaji) + 1;
    const mastery = { ...s.mastery, [romaji]: count };
    let collection = s.collection;
    let awarded = false;
    if (count >= threshold && !s.collection.includes(romaji)) {
        collection = [...s.collection, romaji];
        awarded = true;
    }
    return { state: { ...s, mastery, collection }, awarded };
}

/** True once every kana in `rowRomaji` is mastered (the level is complete). */
export function levelComplete(s: ProgressState, rowRomaji: string[], threshold: number): boolean {
    return rowRomaji.every((r) => isMastered(s, r, threshold));
}

/**
 * Clear the tap counts for `romaji` (used by "Repetir nivel"). Cards and taught status are
 * kept — replaying is practice, not losing the collection.
 */
export function resetMastery(s: ProgressState, romaji: string[]): ProgressState {
    const mastery = { ...s.mastery };
    for (const r of romaji) delete mastery[r];
    return { ...s, mastery };
}

/**
 * Recognition → recall gradient: after `recallAfter` correct taps the prompt stops showing the
 * glyph and cues by sound/romaji only ("which one sounds 'ka'?").
 */
export function isRecallStage(s: ProgressState, romaji: string, recallAfter: number): boolean {
    return masteryOf(s, romaji) >= recallAfter;
}

/**
 * Interleaved-review pool (SRS-lite): kana from earlier rows (cumulative pool minus the current
 * row) that are already mastered. These get re-asked occasionally to refresh memory.
 */
export function reviewCandidates(
    s: ProgressState,
    poolRomaji: string[],
    rowRomaji: string[],
    threshold: number,
): string[] {
    return poolRomaji.filter((r) => !rowRomaji.includes(r) && isMastered(s, r, threshold));
}
