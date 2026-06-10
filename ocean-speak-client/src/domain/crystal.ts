// Pure crystal-charge model — no Phaser. Mirrors Ocean Speak's plant-scale growth, but
// encodes the Komorebi pedagogy: a correct answer charges the crystal; a practice mistake
// NEVER discharges it (only the Artefacto does, later). See ADR-0006 / pedagogy/principles.

export const CRYSTAL_GROWTH = {
    /** Charge added per correct answer (sprite scale increment). */
    STEP: 0.3,
    /** Initial / minimum scale. */
    MIN: 0.3,
    /** Fully-charged scale. */
    MAX: 3.0,
} as const;

/**
 * Next crystal scale after an answer.
 * - correct → charge up by STEP, capped at MAX.
 * - wrong   → unchanged (practice errors don't punish; the crystal never wilts).
 */
export function nextCrystalScale(current: number, correct: boolean): number {
    if (!correct) return current;
    return Math.min(current + CRYSTAL_GROWTH.STEP, CRYSTAL_GROWTH.MAX);
}

/** True when the crystal is fully charged. */
export function isFullyCharged(scale: number): boolean {
    return scale >= CRYSTAL_GROWTH.MAX;
}
