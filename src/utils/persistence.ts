import { Settings, Statistics, Achievement, Difficulty, GameState, CellValue } from '../types';

const SETTINGS_KEY = 'kurosu6_settings_v1';
const STATS_KEY = 'kurosu6_stats_v1';
const ACHIEVEMENTS_KEY = 'kurosu6_achievements_v1';

export const DEFAULT_SETTINGS: Settings = {
  darkMode: false,
  soundEffects: true,
  hapticFeedback: true,
  autoErrorChecking: false,
  showRuleViolations: true,
  leftHandedLayout: false,
  symbolSize: 'medium',
};

export const DEFAULT_STATS: Statistics = {
  totalPlayed: 0,
  totalSolved: 0,
  averageSolveTime: { easy: 0, medium: 0, hard: 0, expert: 0 },
  bestTimes: { easy: null, medium: null, hard: null, expert: null },
  currentStreak: 0,
  longestStreak: 0,
  hintsUsedTotal: 0,
  totalPlayTime: 0,
  lastPlayedDate: null,
  completedDates: [],
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-victory', title: 'First Victory', description: 'Solve your very first Kurosu 6 puzzle.', unlocked: false, unlockedAt: null },
  { id: 'solve-10', title: '10 Puzzles Solved', description: 'Complete a total of 10 Kurosu 6 puzzles.', unlocked: false, unlockedAt: null },
  { id: 'solve-100', title: '100 Puzzles Solved', description: 'Complete 100 logic puzzles. A true titan of deduction!', unlocked: false, unlockedAt: null },
  { id: 'no-hints', title: 'No Hints Used', description: 'Perfect intellectual execution - solve a puzzle without revealing any elements.', unlocked: false, unlockedAt: null },
  { id: 'perfect-puzzle', title: 'Perfect Puzzle', description: 'Solve a puzzle with absolutely zero mistakes or misplaced entries.', unlocked: false, unlockedAt: null },
  { id: 'streak-7', title: '7-Day Streak', description: 'Solve the Daily Challenge for 7 consecutive days.', unlocked: false, unlockedAt: null },
  { id: 'streak-30', title: '30-Day Streak', description: 'Solve the Daily Challenge for 30 consecutive days.', unlocked: false, unlockedAt: null },
  { id: 'expert-master', title: 'Expert Master', description: 'Successfully complete an Expert difficulty puzzle.', unlocked: false, unlockedAt: null },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Settings Persistence
export function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Fallback defaults for safety
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

// Statistics Persistence
export function loadStats(): Statistics {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_STATS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading stats', e);
  }
  return DEFAULT_STATS;
}

export function saveStats(stats: Statistics): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving stats', e);
  }
}

// Achievements Persistence
export function loadAchievements(): Achievement[] {
  try {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Achievement[];
      // Sync names/descriptions in case we updated them in code, only load "unlocked" states
      return INITIAL_ACHIEVEMENTS.map(initial => {
        const found = parsed.find(p => p.id === initial.id);
        if (found) {
          return {
            ...initial,
            unlocked: found.unlocked,
            unlockedAt: found.unlockedAt
          };
        }
        return initial;
      });
    }
  } catch (e) {
    console.error('Error loading achievements', e);
  }
  return INITIAL_ACHIEVEMENTS;
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (e) {
    console.error('Error saving achievements', e);
  }
}

// Compute active daily streak
export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  
  const sortedDates = [...new Set(completedDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  // If the last completed date is not today AND not yesterday, the streak is broken
  const lastCompleted = sortedDates[0];
  if (lastCompleted !== todayStr && lastCompleted !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(lastCompleted);

  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (completedDates.includes(checkStr)) {
      streak++;
      // Go to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Core Game completion handler
export interface CompletionOutcome {
  unlockedAchievements: string[];
  newStreak: number;
  isNewBestTime: boolean;
}

export function recordGameCompletion(
  difficulty: Difficulty,
  timeElapsed: number,
  mistakesMade: number,
  hintsUsed: number,
  isDaily: boolean
): CompletionOutcome {
  const stats = loadStats();
  const achievements = loadAchievements();
  const todayStr = getTodayDateString();

  // 1. Play updates
  stats.totalPlayed++;
  stats.totalSolved++;
  stats.totalPlayTime += timeElapsed;
  stats.hintsUsedTotal += hintsUsed;

  // 2. Best Records (Strict Minimum Positive comparison)
  const previousBest = stats.bestTimes[difficulty];
  let isNewBestTime = false;
  if (previousBest === null || timeElapsed < previousBest) {
    stats.bestTimes[difficulty] = timeElapsed;
    isNewBestTime = true;
  }

  // 3. Average solve times mapping
  const currentAvg = stats.averageSolveTime[difficulty] || 0;
  // Weight averages
  if (currentAvg === 0) {
    stats.averageSolveTime[difficulty] = timeElapsed;
  } else {
    stats.averageSolveTime[difficulty] = Math.round((currentAvg * 4 + timeElapsed) / 5);
  }

  // 4. Daily Challenge unique streak
  if (isDaily) {
    if (!stats.completedDates.includes(todayStr)) {
      stats.completedDates.push(todayStr);
    }
  }

  // Calculate new streak
  const newStreak = calculateStreak(stats.completedDates);
  stats.currentStreak = newStreak;
  if (newStreak > stats.longestStreak) {
    stats.longestStreak = newStreak;
  }

  stats.lastPlayedDate = todayStr;
  saveStats(stats);

  // 5. Unlock Achievements Deductions
  const unlockedIDs: string[] = [];
  const nowStr = new Date().toISOString();

  const handleUnlock = (id: string) => {
    const achObj = achievements.find(a => a.id === id);
    if (achObj && !achObj.unlocked) {
      achObj.unlocked = true;
      achObj.unlockedAt = nowStr;
      unlockedIDs.push(achObj.title);
    }
  };

  // Check First Victory
  if (stats.totalSolved >= 1) {
    handleUnlock('first-victory');
  }

  // Check Solve Total limits
  if (stats.totalSolved >= 10) {
    handleUnlock('solve-10');
  }
  if (stats.totalSolved >= 100) {
    handleUnlock('solve-100');
  }

  // Check no hints
  if (hintsUsed === 0) {
    handleUnlock('no-hints');
  }

  // Check perfect puzzle
  if (mistakesMade === 0) {
    handleUnlock('perfect-puzzle');
  }

  // Check Streaks
  if (newStreak >= 7) {
    handleUnlock('streak-7');
  }
  if (newStreak >= 30) {
    handleUnlock('streak-30');
  }

  // Check Expert Master
  if (difficulty === 'expert') {
    handleUnlock('expert-master');
  }

  saveAchievements(achievements);

  return {
    unlockedAchievements: unlockedIDs,
    newStreak,
    isNewBestTime,
  };
}

// Daily Puzzle Persistence & Locking
export interface StoredDailyPuzzle {
  date: string;
  difficulty: Difficulty;
  clues: CellValue[];
  solution: CellValue[];
  board: CellValue[];
  timer: number;
  mistakes: number;
  hintsUsed: number;
  isCompleted: boolean;
  completedAt?: string;
  starRating?: number;
}

const DAILY_PUZZLE_KEY = 'kurosu6_daily_state_v1';

export function loadDailyPuzzleState(): StoredDailyPuzzle | null {
  try {
    const saved = localStorage.getItem(DAILY_PUZZLE_KEY);
    if (saved) {
      return JSON.parse(saved) as StoredDailyPuzzle;
    }
  } catch (e) {
    console.error('Error loading daily puzzle state', e);
  }
  return null;
}

export function saveDailyPuzzleState(state: StoredDailyPuzzle): void {
  try {
    localStorage.setItem(DAILY_PUZZLE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving daily puzzle state', e);
  }
}

export function isDailyCompletedToday(): boolean {
  const todayStr = getTodayDateString();
  const stats = loadStats();
  if (stats.completedDates && stats.completedDates.includes(todayStr)) {
    return true;
  }
  const daily = loadDailyPuzzleState();
  if (daily && daily.date === todayStr && daily.isCompleted) {
    return true;
  }
  return false;
}

export function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  if (diffMs <= 0) return '00:00:00';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

