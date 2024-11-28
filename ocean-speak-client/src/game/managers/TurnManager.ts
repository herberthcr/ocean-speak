

// TurnManager.ts
export class TurnManager {
    private currentTurn: 'teacher' | 'student' = 'teacher';  // Current turn (teacher or student)
    private currentStudentIndex: number = 0;  // Index to keep track of the current student
    private students: string[] = [];  // List of students (can be expanded later)

    constructor() {
        // Initialize with some example students, which could later come from the server
        this.students = ['Student A', 'Student B', 'Student C'];  // Add student names dynamically later
    }

    // Switch between teacher's turn and students' turn
    switchTurn() {
        if (this.currentTurn === 'teacher') {
            this.currentTurn = 'student';
        } else {
            // Move to the next student in the list (round-robin)
            this.currentStudentIndex = (this.currentStudentIndex + 1) % this.students.length;

            // If all students have had their turn, switch back to the teacher
            if (this.currentStudentIndex === 0) {
                this.currentTurn = 'teacher';
            }
        }
    }

    // Get the current turn (teacher or student)
    getCurrentTurn(): 'teacher' | 'student' {
        return this.currentTurn;
    }

    // Get the current student (or undefined if it's not a student's turn)
    getCurrentStudent(): string | undefined {
        if (this.currentTurn === 'student') {
            return this.students[this.currentStudentIndex];
        }
        return undefined;
    }

    // Method to simulate teacher asking the question and students answering
    getQuestionForCurrentTurn(): string {
        if (this.currentTurn === 'teacher') {
            return "Teacher asks: 'What color is the fish?'";  // Example question for teacher
        } else {
            return `${this.getCurrentStudent()} answers the question`;  // Current student answering
        }
    }
}
