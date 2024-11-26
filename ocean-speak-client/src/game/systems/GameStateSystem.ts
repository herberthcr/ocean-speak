export class GameStateSystem {
    private correctAnswers: number = 0;
  
    incrementCorrectAnswers() {
      this.correctAnswers++;
    }
  
    resetCorrectAnswers() {
      this.correctAnswers = 0;
    }
  
    getCorrectAnswers() {
      return this.correctAnswers;
    }
  }