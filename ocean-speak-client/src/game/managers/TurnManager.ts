export class TurnManager {
    private currentTurn: 'Teacher' | 'Student' = 'Teacher';
  
    getTurn(): 'Teacher' | 'Student' {
      return this.currentTurn;
    }
  
    switchTurn() {
      this.currentTurn = this.currentTurn === 'Teacher' ? 'Student' : 'Teacher';
    }

    
  }