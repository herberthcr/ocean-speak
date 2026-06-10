// Pure hiragana matching — no Phaser, no DOM. Used by InputSystem (click now, voice in M1b)
// and unit-tested in isolation (see kana-matching.test.ts).

/** A single kana to recognize. Subset of the mini-game contract's ContentItem. */
export interface KanaItem {
    /** Glyph shown on the koi and teach card, e.g. "か". */
    prompt: string;
    /** Canonical Hepburn romaji, e.g. "ka", "shi". */
    romaji: string;
    /** Audio asset key (no extension), e.g. "hira_ka". */
    audio: string;
    script?: 'hiragana' | 'katakana';
    /** Extra accepted spellings, merged with the built-in lenient variants. */
    alias?: string[];
}

/**
 * Lenient romaji variants for beginners: Hepburn ↔ Kunrei/wāpuro spellings.
 * Keyed by canonical Hepburn. Voice/typing of either side is accepted.
 */
const ROMAJI_VARIANTS: Record<string, string[]> = {
    shi: ['si'],
    chi: ['ti'],
    tsu: ['tu'],
    fu: ['hu'],
    ji: ['zi', 'di'],
    zu: ['du'],
};

/** Lowercase, trim, drop everything but a–z (so "Ka!", " ka " → "ka"). */
export function normalizeRomaji(input: string): string {
    return input.trim().toLowerCase().replace(/[^a-z]/g, '');
}

/** All accepted romaji spellings for a canonical romaji (itself + lenient variants). */
export function variantsFor(romaji: string): string[] {
    const key = normalizeRomaji(romaji);
    return [key, ...(ROMAJI_VARIANTS[key] ?? [])];
}

/**
 * True when `input` names `item`. Accepts the canonical romaji, its lenient
 * variants, any explicit `alias`, or the kana glyph itself (for ja-JP voice in M1b).
 * Case- and whitespace-insensitive.
 */
export function matches(input: string, item: KanaItem): boolean {
    if (input.trim() === item.prompt) return true; // kana glyph (e.g. ja-JP transcript)
    const got = normalizeRomaji(input);
    if (!got) return false;
    const accepted = new Set<string>([
        ...variantsFor(item.romaji),
        ...(item.alias ?? []).map(normalizeRomaji),
    ]);
    return accepted.has(got);
}
