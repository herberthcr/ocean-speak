import {GAME_RULES } from '../global/Constants';

export class GameStateSystem {
    public interactionPoints: number = 0;
    public speechPoints: number = 0;
    private streak: number = 0;
  
    incrementInteractionPoints() {
      this.interactionPoints++;
      this.streak++;
    }
  
    incrementSpeechPoints() {
      this.speechPoints++;
      this.streak++;
    }
  
    resetStreak() {
      this.streak = 0;
    }
  
    getStreak(): number {
      return this.streak;
    }
  
    resetScores() {
      this.interactionPoints = 0;
      this.speechPoints = 0;
      this.streak = 0;
    }
  
    hasWon(): boolean {
        debugger
      return this.interactionPoints >= GAME_RULES.MAX_SCORE && this.speechPoints >= GAME_RULES.MAX_SPEECH_SCORE;
    }
  }