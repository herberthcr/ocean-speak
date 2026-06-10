// Runtime progress store: single source of truth for player progress (docs/architecture/
// state-and-progress.md). Wraps the pure transitions in src/domain/progress.ts with localStorage
// persistence and broadcasts changes on the EventBus so React (the Codex) can react.
import { EventBus } from '../game/EventBus';
import {
    emptyProgress,
    recordCorrect,
    markTaught,
    isTaught,
    isOwned,
    masteryOf,
    levelComplete,
    resetMastery,
    isRecallStage,
    reviewCandidates,
    setLevelStars,
    starsFor,
    awardWordCard,
    type ProgressState,
} from '../domain/progress';

const STORAGE_KEY = 'komorebi.progress.v1';

/** Snapshot broadcast to React listeners (no methods, just data). */
export interface ProgressSnapshot {
    collection: string[];
    currentLevel: number;
}

function load(): ProgressState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...emptyProgress(), ...JSON.parse(raw) };
    } catch {
        /* corrupt or unavailable storage — start fresh */
    }
    return emptyProgress();
}

class ProgressStore {
    private state: ProgressState = load();

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch {
            /* storage unavailable — keep going in-memory */
        }
        EventBus.emit('progress-changed', this.snapshot());
    }

    snapshot(): ProgressSnapshot {
        return { collection: [...this.state.collection], currentLevel: this.state.currentLevel };
    }

    get currentLevel(): number {
        return this.state.currentLevel;
    }

    setLevel(level: number): void {
        this.state = { ...this.state, currentLevel: level };
        this.persist();
    }

    isTaught(romaji: string): boolean {
        return isTaught(this.state, romaji);
    }

    markTaught(romaji: string): void {
        this.state = markTaught(this.state, romaji);
        this.persist();
    }

    masteryOf(romaji: string): number {
        return masteryOf(this.state, romaji);
    }

    isOwned(romaji: string): boolean {
        return isOwned(this.state, romaji);
    }

    collection(): string[] {
        return [...this.state.collection];
    }

    /** Record a correct tap; returns true if a new card was awarded. */
    recordCorrect(romaji: string, threshold: number): boolean {
        const { state, awarded } = recordCorrect(this.state, romaji, threshold);
        this.state = state;
        this.persist();
        return awarded;
    }

    levelComplete(rowRomaji: string[], threshold: number): boolean {
        return levelComplete(this.state, rowRomaji, threshold);
    }

    /** Clear tap counts for a row ("Repetir nivel"); cards and taught status persist. */
    resetMasteryFor(romaji: string[]): void {
        this.state = resetMastery(this.state, romaji);
        this.persist();
    }

    /** True when this kana's prompt should hide the glyph (recall stage). */
    isRecallStage(romaji: string, recallAfter: number): boolean {
        return isRecallStage(this.state, romaji, recallAfter);
    }

    /** Mastered kana from earlier rows, eligible for interleaved review. */
    reviewCandidates(poolRomaji: string[], rowRomaji: string[], threshold: number): string[] {
        return reviewCandidates(this.state, poolRomaji, rowRomaji, threshold);
    }

    /** Award a vocabulary card for a completed word; true if newly earned. */
    awardWordCard(wordRomaji: string): boolean {
        const { state, awarded } = awardWordCard(this.state, wordRomaji);
        this.state = state;
        this.persist();
        return awarded;
    }

    /** Record Time-mode stars for a level (best result kept). */
    setLevelStars(level: number, stars: number): void {
        this.state = setLevelStars(this.state, level, stars);
        this.persist();
    }

    starsFor(level: number): number {
        return starsFor(this.state, level);
    }

    /** Reset all progress (for the Codex "reiniciar" affordance / fresh demos). */
    reset(): void {
        this.state = emptyProgress();
        this.persist();
    }
}

export const progressStore = new ProgressStore();
