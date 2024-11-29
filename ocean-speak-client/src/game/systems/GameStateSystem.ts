import { GAME_RULES } from '../global/Constants';

export class GameStateSystem {
    public interactionPoints: number = 0;
    public speechPoints: number = 0;
    private interactionStreak: number = 0;
    private speechStreak: number = 0;
    private maxPlantsGrow: number = 0;
    private minPlantsGrow: number = 0;
    private maxInteractionScore: number;
    private minInteractionScore: number;

    constructor(maxInteractionScore: number, minInteractionScore: number) {
        debugger
        this.maxInteractionScore = maxInteractionScore
        this.minInteractionScore = minInteractionScore;
    }

    incrementInteractionPoints() {
        this.interactionPoints++;
        this.interactionStreak++;
    }

    incrementSpeechPoints() {
        this.speechPoints++;
        this.speechStreak++;
    }

    reduceSpeechPoints() {
        if (this.speechPoints > 0) {
            this.speechPoints--;
        }
    }

    reduceInteractionPoints() {
        if (this.interactionPoints > 0) {
            this.interactionPoints--;
        }
    }

    resetInteractionStreak() {
        this.interactionStreak = 0;
    }

    resetSpeechStreak() {
        this.speechStreak = 0;
    }

    getInteractionStreak(): number {
        return this.interactionStreak;
    }

    getSpeechStreak(): number {
        return this.speechStreak;
    }

    getMaxPlantsGrow(): number {
        return this.maxPlantsGrow;
    }

    incrementMaxPlantsGrow(growSize: number) {
        this.maxPlantsGrow = growSize;
    }

    getMinPlants(): number {
        return this.minPlantsGrow;
    }

    incrementMinPlantsGrow(growSize: number) {
        this.minPlantsGrow = growSize;
    }

    resetScores() {
        this.interactionPoints = 0;
        this.speechPoints = 0;
        this.interactionStreak = 0;
        this.speechStreak = 0;
        this.maxPlantsGrow = 0;
        this.minPlantsGrow = 0;
    }

    hasWon(): boolean {
        debugger
        return this.interactionPoints >= this.maxInteractionScore && this.speechPoints >= this.minInteractionScore;
    }
}