export type CellValue = 'X' | 'O' | null;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Puzzle {
  id: string;
  clues: CellValue[];      // 36 elements, null for empty
  solution: CellValue[];   // 36 elements, fully solved
  difficulty: Difficulty;
  isDaily?: boolean;
  dateString?: string;
}

export interface GameState {
  board: CellValue[];
  clues: CellValue[];
  solution: CellValue[];
  difficulty: Difficulty;
  timer: number;
  mistakes: number;
  hintsUsed: number;
  isCompleted: boolean;
  isPaused: boolean;
  starRating: number;
  isDaily: boolean;
  dateString?: string;
  history: CellValue[][];
  historyIndex: number;
}

export interface Settings {
  darkMode: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoErrorChecking: boolean;
  showRuleViolations: boolean;
  leftHandedLayout: boolean;
}

export interface Statistics {
  totalPlayed: number;
  totalSolved: number;
  averageSolveTime: Record<Difficulty, number>; // in seconds
  bestTimes: Record<Difficulty, number | null>; // in seconds
  currentStreak: number;
  longestStreak: number;
  hintsUsedTotal: number;
  totalPlayTime: number; // in seconds
  lastPlayedDate: string | null; // YYYY-MM-DD
  completedDates: string[]; // YYYY-MM-DD for streak verification
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
  metric?: string;
}

export interface RuleViolation {
  index: number;
  type: 'three-consecutive' | 'too-many-symbols';
  symbol: 'X' | 'O';
  direction: 'row' | 'col';
}
