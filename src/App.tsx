import { useState, useEffect, useRef } from 'react';
import {
  CellValue,
  Difficulty,
  GameState,
  Settings,
  Statistics,
  Achievement,
  RuleViolation,
} from './types';
import {
  generatePuzzle,
  validateBoard,
  getLogicHint,
  LogicHintResult,
  isLocallyValid,
} from './utils/puzzleGenerator';
import {
  playTapSound,
  playErrorSound,
  playWinSound,
  triggerHaptic,
} from './utils/audio';
import {
  loadSettings,
  saveSettings,
  loadStats,
  saveStats,
  loadAchievements,
  saveAchievements,
  recordGameCompletion,
  getTodayDateString,
  calculateStreak,
  DEFAULT_STATS,
} from './utils/persistence';

import Header from './components/Header';
import GameBoard from './components/GameBoard';
import StatsPanel from './components/StatsPanel';
import AchievementsPanel from './components/AchievementsPanel';
import HowToPlay from './components/HowToPlay';
import SettingsPanel from './components/SettingsPanel';
import { Confetti } from './components/Confetti';

import {
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
  HelpCircle,
  Play,
  Pause,
  AlertCircle,
  X,
  Volume2,
  Calendar,
  Award,
  Flame,
  CheckCircle2,
  Trophy,
  Activity,
  User,
} from 'lucide-react';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'play' | 'daily' | 'stats' | 'achievements' | 'how-to-play' | 'settings'>('play');

  // Load Persisted Data
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [stats, setStats] = useState<Statistics>(() => loadStats());
  const [achievements, setAchievements] = useState<Achievement[]>(() => loadAchievements());

  // Game Settings & Preferences
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium');

  // Active Game State
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [violations, setViolations] = useState<RuleViolation[]>([]);
  
  // Popups/Modals
  const [activeHintTypeModel, setActiveHintTypeModel] = useState<boolean>(false);
  const [unlockedNotifs, setUnlockedNotifs] = useState<string[]>([]);
  const [showWinDetails, setShowWinDetails] = useState<boolean>(false);

  // Active Logic Hint Explanation State
  const [logicHintResult, setLogicHintResult] = useState<LogicHintResult | null>(null);
  const [errorCheckResult, setErrorCheckResult] = useState<{ index: number; expected: string; actual: string } | null>(null);

  // Confetti State
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply Dark Mode Class to HTML Node
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Load or generate initial game board
  useEffect(() => {
    startNewGame(currentDifficulty, false);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update Violations when board state changes
  useEffect(() => {
    if (gameState) {
      const activeViolations = validateBoard(gameState.board);
      setViolations(activeViolations);
    }
  }, [gameState?.board]);

  // Handle active game Timer loop
  useEffect(() => {
    if (gameState && !gameState.isCompleted && !gameState.isPaused && (activeTab === 'play' || activeTab === 'daily')) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            timer: prev.timer + 1,
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState?.isCompleted, gameState?.isPaused, activeTab]);

  // Start classic game
  const startNewGame = (diff: Difficulty, isRestart: boolean = false) => {
    // Save current play selection
    setCurrentDifficulty(diff);

    // Track statistics for uncompleted abandoned games
    if (gameState && !gameState.isCompleted && !isRestart) {
      setStats(prev => {
        const nextStats = { ...prev, totalPlayed: prev.totalPlayed + 1 };
        saveStats(nextStats);
        return nextStats;
      });
    }

    const puzzle = generatePuzzle(diff);
    const initialBoard = [...puzzle.clues];

    setGameState({
      board: initialBoard,
      clues: puzzle.clues,
      solution: puzzle.solution,
      difficulty: diff,
      timer: 0,
      mistakes: 0,
      hintsUsed: 0,
      isCompleted: false,
      isPaused: false,
      starRating: 0,
      isDaily: false,
      history: [initialBoard],
      historyIndex: 0,
    });

    setSelectedCell(null);
    setLogicHintResult(null);
    setErrorCheckResult(null);
    setShowWinDetails(false);
    setActiveHintTypeModel(false);
    setShowConfetti(false);
  };

  // Convert Date seed to deterministic daily seed
  const getDailySeedForDate = (dateStr: string): number => {
    const rawNum = parseInt(dateStr.replace(/-/g, ''), 10);
    return rawNum;
  };

  // Start daily challenge
  const startDailyChallenge = () => {
    const dateStr = getTodayDateString();
    const isCompletedAlready = stats.completedDates.includes(dateStr);

    // Tracking for statistics
    if (gameState && !gameState.isCompleted) {
      setStats(prev => {
        const nextStats = { ...prev, totalPlayed: prev.totalPlayed + 1 };
        saveStats(nextStats);
        return nextStats;
      });
    }

    // Daily Challenge difficulty is hardcoded deterministically to keep it standard
    // E.g. Date ends in odd is 'medium', even is 'hard'
    const seed = getDailySeedForDate(dateStr);
    const dailyDiffs: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
    // Let's cycle difficulties: [Sunday=easy, Monday=medium, Tuesday=hard, Wednesday=expert...]
    const dayOfWeek = new Date().getDay(); // 0 to 6
    const dailyDiff = dailyDiffs[dayOfWeek % 4];

    const puzzle = generatePuzzle(dailyDiff, seed);
    const initialBoard = [...puzzle.clues];

    setGameState({
      board: initialBoard,
      clues: puzzle.clues,
      solution: puzzle.solution,
      difficulty: dailyDiff,
      timer: 0,
      mistakes: 0,
      hintsUsed: 0,
      isCompleted: false,
      isPaused: false,
      starRating: 0,
      isDaily: true,
      dateString: dateStr,
      history: [initialBoard],
      historyIndex: 0,
    });

    setSelectedCell(null);
    setLogicHintResult(null);
    setErrorCheckResult(null);
    setShowWinDetails(false);
    setActiveHintTypeModel(false);
    setShowConfetti(false);
    setActiveTab('daily');
  };

  // Handle setting/erasing cell value
  const handleCellValueSet = (index: number, val: CellValue) => {
    if (!gameState || gameState.isCompleted || gameState.isPaused) return;

    // Check if cell is a clue (locked)
    if (gameState.clues[index] !== null) return;

    const currentVal = gameState.board[index];
    if (currentVal === val) return; // No change

    // Play tactile feedback
    playTapSound(settings.soundEffects);
    triggerHaptic(settings.hapticFeedback);

    // Build next board status
    const nextBoard = [...gameState.board];
    nextBoard[index] = val;

    // Direct Mismatch validation check (mistakes counter)
    let isMistake = false;
    let newMistakeCount = gameState.mistakes;

    if (val !== null && val !== gameState.solution[index]) {
      isMistake = true;
      newMistakeCount += 1;
      // Play brief warning if sound enabled
      playErrorSound(settings.soundEffects);
    }

    // Push into Undo/Redo stack history
    const nextHistory = gameState.history.slice(0, gameState.historyIndex + 1);
    nextHistory.push(nextBoard);
    const nextIndex = nextHistory.length - 1;

    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        board: nextBoard,
        mistakes: newMistakeCount,
        history: nextHistory,
        historyIndex: nextIndex,
      };
    });

    // Reset error warning highlight if set
    if (errorCheckResult?.index === index) {
      setErrorCheckResult(null);
    }
    setLogicHintResult(null);

    // Auto game completion trigger
    checkCompletion(nextBoard, newMistakeCount);
  };

  // Check board matches requirements
  const checkCompletion = (currentBoard: CellValue[], mistakeCount: number) => {
    if (!gameState) return;

    // A board is solved if every element matches the unique solution
    const allFilled = currentBoard.every((cell) => cell !== null);
    if (!allFilled) return;

    const matchedSolution = currentBoard.every((cell, idx) => cell === gameState.solution[idx]);
    if (matchedSolution) {
      // Board successfully completed!
      handleVictory(mistakeCount);
    }
  };

  // Calculate star rating on victory
  const calculateStarsNum = (time: number, hintsUsed: number, mistakes: number): number => {
    let stars = 3;
    // Speed checks
    if (time > 180) stars--; // Greater than 3 minutes
    if (time > 420) stars--; // Greater than 7 minutes

    // Hints used checks
    if (hintsUsed >= 2 && stars > 1) stars--;
    if (hintsUsed >= 4 && stars > 1) stars--;

    return Math.max(1, stars);
  };

  // Victory Routine
  const handleVictory = (finalMistakes: number) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, isCompleted: true };
    });

    // Play arpeggio
    playWinSound(settings.soundEffects);

    const time = gameState.timer;
    const starRatingNum = calculateStarsNum(time, gameState.hintsUsed, finalMistakes);

    // Commit metrics to LocalStorage persistence
    const outcome = recordGameCompletion(
      gameState.difficulty,
      time,
      finalMistakes,
      gameState.hintsUsed,
      gameState.isDaily
    );

    // Refresh memory states
    setStats(loadStats());
    setAchievements(loadAchievements());

    // Highlight victory card details overlay
    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        starRating: starRatingNum,
      };
    });

    if (starRatingNum === 3) {
      setShowConfetti(true);
    }

    if (outcome.unlockedAchievements.length > 0) {
      setUnlockedNotifs(outcome.unlockedAchievements);
    }
    setShowWinDetails(true);
  };

  // Check Game board manually request
  const handleManualCheck = () => {
    if (!gameState) return;
    
    // Find any incorrect user values compared to solver solutions list
    let incorrectCount = 0;
    gameState.board.forEach((val, idx) => {
      if (val !== null && gameState.clues[idx] === null && val !== gameState.solution[idx]) {
        incorrectCount++;
      }
    });

    if (incorrectCount === 0) {
      // All correct so far!
      alert("Excellent progress! Everything you have filled in so far is 100% correct and logically sound. Keep going!");
    } else {
      alert(`Correction Assist: Found ${incorrectCount} incorrect symbol${incorrectCount > 1 ? 's' : ''} in your grid. Try erasing them or updating your choices!`);
    }
  };

  // Undo execution
  const handleUndo = () => {
    if (!gameState || gameState.historyIndex <= 0) return;

    const nextIdx = gameState.historyIndex - 1;
    const nextBoard = gameState.history[nextIdx];

    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        board: nextBoard,
        historyIndex: nextIdx,
      };
    });

    playTapSound(settings.soundEffects);
  };

  // Redo execution
  const handleRedo = () => {
    if (!gameState || gameState.historyIndex >= gameState.history.length - 1) return;

    const nextIdx = gameState.historyIndex + 1;
    const nextBoard = gameState.history[nextIdx];

    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        board: nextBoard,
        historyIndex: nextIdx,
      };
    });

    playTapSound(settings.soundEffects);
  };

  // Restart Active Puzzle Board
  const handleRestart = () => {
    if (!gameState) return;
    if (confirm('Are you sure you want to restart this puzzle? Your elapsed timer and current progress will reset.')) {
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          board: [...prev.clues],
          timer: 0,
          mistakes: 0,
          hintsUsed: 0,
          isCompleted: false,
          history: [[...prev.clues]],
          historyIndex: 0,
        };
      });
      setSelectedCell(null);
      setLogicHintResult(null);
      setErrorCheckResult(null);
      setShowConfetti(false);
    }
  };

  // Single Cell Hint: Reveals one correct symbol
  const triggerSingleCellHint = () => {
    if (!gameState) return;

    // Use selected cell if empty, or find a random empty cell
    let targetIdx = selectedCell;
    if (targetIdx === null || gameState.board[targetIdx] !== null) {
      // Choose random empty cell
      const emptyIdxs = gameState.board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIdxs.length === 0) {
        alert('The board is already completely filled!');
        return;
      }
      const randomArrIdx = Math.floor(Math.random() * emptyIdxs.length);
      targetIdx = emptyIdxs[randomArrIdx];
    }

    const correctValue = gameState.solution[targetIdx];
    
    // Fill the correct cell
    const nextBoard = [...gameState.board];
    nextBoard[targetIdx] = correctValue;

    // Push into Undo history stack
    const nextHistory = gameState.history.slice(0, gameState.historyIndex + 1);
    nextHistory.push(nextBoard);

    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        board: nextBoard,
        hintsUsed: prev.hintsUsed + 1,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      };
    });

    setSelectedCell(targetIdx);
    setActiveHintTypeModel(false);
    playTapSound(settings.soundEffects);
    
    // Auto complete check
    checkCompletion(nextBoard, gameState.mistakes);
  };

  // Detailed logical hint scanner
  const triggerLogicHint = () => {
    if (!gameState) return;

    const result = getLogicHint(gameState.board, gameState.clues, gameState.solution);
    if (result) {
      setLogicHintResult(result);
      setSelectedCell(result.cellIndex);

      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          hintsUsed: prev.hintsUsed + 1,
        };
      });
    } else {
      alert('Congratulations! No logical hint needed - you have filled the board. Please click on "Check Puzzle" or fill missing cells to complete.');
    }
    setActiveHintTypeModel(false);
  };

  // Error Check Hint: Highlights one incorrect cell
  const triggerErrorCheckHint = () => {
    if (!gameState) return;

    // Find any incorrect user cell entries
    const wrongIdxs = gameState.board
      .map((val, idx) => {
        if (val !== null && gameState.clues[idx] === null && val !== gameState.solution[idx]) {
          return idx;
        }
        return null;
      })
      .filter((val): val is number => val !== null);

    if (wrongIdxs.length === 0) {
      alert("No errors found! Every element you have filled in so far is 100% correct.");
    } else {
      // Highlight the first incorrect cell
      const targetIdx = wrongIdxs[0];
      const actualVal = gameState.board[targetIdx] as string;
      const expectedVal = gameState.solution[targetIdx] as string;

      setErrorCheckResult({
        index: targetIdx,
        actual: actualVal,
        expected: expectedVal
      });
      setSelectedCell(targetIdx);

      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          hintsUsed: prev.hintsUsed + 1,
        };
      });
    }
    setActiveHintTypeModel(false);
  };

  const clearStatsAndAchievements = () => {
    localStorage.removeItem('kurosu6_stats_v1');
    localStorage.removeItem('kurosu6_achievements_v1');
    setStats(DEFAULT_STATS);
    setAchievements(loadAchievements());
    alert('All gameplay statistics and achievements have been reset successfully!');
  };

  // Helper formatting for seconds to MM:SS
  const formatTimerString = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Local Leaderboard generation deterministically for the day
  const getDeterministicLeaderboard = () => {
    const todayStr = getTodayDateString();
    const seed = getDailySeedForDate(todayStr);
    
    // Deterministic times
    const playerTimes = [
      { name: 'Oliver S.', timeText: '1m 45s', stars: 3, rawSecs: 105 },
      { name: 'Amelia W.', timeText: '2m 55s', stars: 3, rawSecs: 175 },
      { name: 'George T.', timeText: '4m 32s', stars: 2, rawSecs: 272 },
      { name: 'Sophia L.', timeText: '6m 12s', stars: 1, rawSecs: 372 },
    ];

    // Seed adjustments to randomize times slightly per day
    const adjusted = playerTimes.map((item, idx) => {
      const variation = ((seed + idx) % 40) - 20; // -20s to +20s variation
      const finalSecs = item.rawSecs + variation;
      const mins = Math.floor(finalSecs / 60);
      const secs = finalSecs % 60;
      return {
        ...item,
        timeField: `${mins}m ${secs}s`,
        rawSecs: finalSecs
      };
    });

    return adjusted.sort((a,b) => a.rawSecs - b.rawSecs);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-16 ${settings.darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Header section with tab coordination */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Pause game when leaving board tabs
          if (gameState && tab !== 'play' && tab !== 'daily') {
            setGameState((prev) => prev ? { ...prev, isPaused: true } : null);
          }
        }}
        streak={stats.currentStreak}
        settings={settings}
        onThemeToggle={() => {
          const nextSettings = { ...settings, darkMode: !settings.darkMode };
          setSettings(nextSettings);
          saveSettings(nextSettings);
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-12 mt-6 md:mt-10 font-sans">
        
        {/* Achievements unlocks banners */}
        {unlockedNotifs.length > 0 && (
          <div className="mb-6 max-w-xl mx-auto bg-gradient-to-r from-amber-500 to-yellow-400 p-1.5 rounded-2xl shadow-md text-zinc-950 flex justify-between items-center px-4 animate-bounce">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <p className="text-sm font-bold">
                Achievement Unlocked: <span className="font-extrabold underline">{unlockedNotifs[0]}</span>!
              </p>
            </div>
            <button
              onClick={() => setUnlockedNotifs(prev => prev.slice(1))}
              className="p-1 rounded-full hover:bg-black/10 text-zinc-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Tab Renderer */}
        {activeTab === 'play' && gameState && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Title Difficulty controls card */}
            <div className="lg:col-span-4 bg-white dark:bg-zinc-900 shadow-custom border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-2xl space-y-5">
              <div>
                <h2 className="text-xl font-black tracking-tight text-[#141414] dark:text-zinc-100 uppercase">Classic Kurosu 6</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold select-none uppercase tracking-wider">
                  Choose difficulty and start solving
                </p>
              </div>

              {/* Difficulty selector buttons */}
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map((diff) => {
                  const isActive = currentDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => startNewGame(diff)}
                      className={`py-2 p-3 text-xs uppercase tracking-wider font-extrabold rounded-lg transition-all capitalize border cursor-pointer ${
                        isActive
                          ? 'bg-[#141414] border-[#141414] text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-950 shadow-sm'
                          : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>

              {/* Action utilities bar */}
              <div className="pt-4 border-t border-zinc-205 dark:border-zinc-800 space-y-3">
                <button
                  onClick={() => startNewGame(currentDifficulty)}
                  className="w-full py-3 px-4 bg-[#2563EB] hover:bg-blue-700 font-extrabold text-center text-xs uppercase tracking-wider rounded-lg text-white shadow-custom active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate New Puzzle
                </button>

                <button
                  onClick={startDailyChallenge}
                  className="w-full py-3 px-4 border-2 border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[#2563EB] dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 font-extrabold text-center text-xs uppercase tracking-wider rounded-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-[#2563EB]" />
                  Try Daily Challenge
                </button>
              </div>
            </div>

            {/* Core game board workspace */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Board Header metrics bar */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-2xl flex items-center justify-between shadow-custom select-none">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <span className="text-xs uppercase font-[900] px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded tracking-widest text-[9px]">
                    {gameState.difficulty}
                  </span>
                  {gameState.isCompleted && (
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1 tracking-wider text-[10px]">
                      <CheckCircle2 className="w-4 h-4 fill-current text-emerald-500" /> Complete
                    </span>
                  )}
                </div>

                {/* Clock timer */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-base md:text-lg bg-zinc-50 dark:bg-zinc-800/40 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-inner">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-sans font-extrabold pr-1">Timer</span>
                    {formatTimerString(gameState.timer)}
                  </div>

                  {/* Pause / Play Trigger */}
                  {!gameState.isCompleted && (
                    <button
                      onClick={() => setGameState((prev) => prev ? { ...prev, isPaused: !prev.isPaused } : null)}
                      className="p-2.5 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-[#141414] dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
                      title={gameState.isPaused ? 'Resume Puzzle' : 'Pause Puzzle'}
                    >
                      {gameState.isPaused ? <Play className="w-4 h-4 fill-current text-[#2563EB]" /> : <Pause className="w-4 h-4 fill-current" />}
                    </button>
                  )}
                </div>
              </div>

              {gameState.isPaused ? (
                /* Paused Backdrop */
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-12 text-center rounded-2xl max-w-[500px] mx-auto shadow-custom space-y-4">
                  <Pause className="w-12 h-12 text-[#2563EB] mx-auto animate-pulse" />
                  <h3 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Game Paused</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Take a deep breath. Your timer was suspended! Return anytime to continue solving.
                  </p>
                  <button
                    onClick={() => setGameState((prev) => prev ? { ...prev, isPaused: false } : null)}
                    className="py-2.5 px-6 font-extrabold bg-[#2563EB] text-white hover:bg-blue-700 rounded-lg cursor-pointer shadow-custom text-xs uppercase tracking-wider active:scale-95 transition-all inline-block"
                  >
                    Resume Solving
                  </button>
                </div>
              ) : (
                /* Active Play elements */
                <div className="space-y-5">
                  {/* Game controls toolbar (Undo/Redo/Hint/Check) */}
                  <div className="flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-850 shadow-custom">
                    <button
                      onClick={handleUndo}
                      disabled={gameState.historyIndex <= 0}
                      className="p-2 px-3 bg-zinc-50 dark:bg-zinc-805 disabled:opacity-40 rounded-lg border border-zinc-250 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-[#141414] hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 flex items-center gap-1.5 select-none active:scale-95 transition-all cursor-pointer"
                      title="Undo last move"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Undo
                    </button>

                    <button
                      onClick={handleRedo}
                      disabled={gameState.historyIndex >= gameState.history.length - 1}
                      className="p-2 px-3 bg-zinc-50 dark:bg-zinc-805 disabled:opacity-40 rounded-lg border border-zinc-250 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-[#141414] hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 flex items-center gap-1.5 select-none active:scale-95 transition-all cursor-pointer"
                      title="Redo move"
                    >
                      <Redo2 className="w-3.5 h-3.5" /> Redo
                    </button>

                    <button
                      onClick={handleRestart}
                      className="p-2 px-3 bg-zinc-50 dark:bg-zinc-805 rounded-lg border border-zinc-250 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500/20 dark:hover:text-rose-400 flex items-center gap-1.5 select-none active:scale-95 transition-all cursor-pointer"
                      title="Erase all player changes"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restart
                    </button>

                    <div className="h-6 w-[1px] bg-zinc-250 dark:bg-zinc-750 mx-1 hidden sm:block" />

                    <button
                      onClick={() => setActiveHintTypeModel(true)}
                      className="p-2 px-4 bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-blue-100 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Hints Center
                    </button>

                    <button
                      onClick={handleManualCheck}
                      className="p-2 px-4 bg-white dark:bg-zinc-800 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-emerald-50/20 flex items-center gap-1.2 active:scale-95 transition-all cursor-pointer ml-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Check Grid
                    </button>
                  </div>

                  {/* Mistakes Counter indicator */}
                  {gameState.mistakes > 0 && (
                    <div className="bg-rose-50/20 border border-rose-200 dark:border-rose-900/30 p-3 rounded-2xl px-5 text-sm flex items-center justify-between text-rose-620 dark:text-rose-400">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">Mistakes Indicator Checked</span>
                      </div>
                      <span className="font-mono font-black border border-rose-200 bg-rose-50 text-rose-700 dark:text-rose-300 dark:bg-rose-955 px-2 py-0.5 rounded-lg text-xs">
                        {gameState.mistakes} Mistake{gameState.mistakes > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Logic Hint Explanation layout */}
                  {logicHintResult && (
                    <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-200/50 dark:border-indigo-900/30 p-4 rounded-2xl flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Logic Tip Provided (+1 Hint tally)</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">{logicHintResult.reason}</p>
                        <p className="text-[10px] text-zinc-400 mt-2 font-medium">Cell at Row {Math.floor(logicHintResult.cellIndex/6)+1}, Column {(logicHintResult.cellIndex%6)+1} was formatted.</p>
                      </div>
                    </div>
                  )}

                  {/* Error Check Result Explanation */}
                  {errorCheckResult && (
                    <div className="bg-amber-50/30 dark:bg-amber-955/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">Correction Assist Checkup</h4>
                        <p className="text-sm text-zinc-650 dark:text-zinc-300 mt-1 leading-relaxed">
                          Your placed symbol at Row {Math.floor(errorCheckResult.index/6)+1}, Col {(errorCheckResult.index%6)+1} does not match the solution. It is currently <span className="font-bold text-rose-500">{errorCheckResult.actual}</span>, but should contain <span className="font-bold text-indigo-500">{errorCheckResult.expected}</span>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Interactive Board Layout */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex justify-center shadow-md">
                    <GameBoard
                      board={gameState.board}
                      clues={gameState.clues}
                      solution={gameState.solution}
                      selectedCell={selectedCell}
                      onSelectCell={setSelectedCell}
                      onCellValueSet={handleCellValueSet}
                      settings={settings}
                      violations={violations}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily Challenge Screen */}
        {activeTab === 'daily' && gameState && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column info scorecard */}
            <div className="lg:col-span-4 bg-white dark:bg-zinc-900 shadow-custom border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-2xl space-y-5 select-none">
              <div>
                <span className="text-[9px] bg-blue-50 dark:bg-zinc-800 text-[#2563EB] dark:text-blue-300 px-2.5 py-1 rounded font-black uppercase tracking-widest border border-blue-100/40 dark:border-zinc-700">
                  TODAY'S SELECTION
                </span>
                <h2 className="text-xl font-[900] text-zinc-900 dark:text-zinc-100 mt-3.5 flex items-center gap-1.5 leading-tight uppercase tracking-tight">
                  <Calendar className="w-5 h-5 text-[#2563EB]" />
                  Daily Challenge
                </h2>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-550 font-mono mt-1 uppercase tracking-wider font-semibold">
                  ID: {gameState.dateString} (Daily Series)
                </p>
              </div>

              {/* Streaks scorecard */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                  <Flame className="w-5 h-5 text-orange-500 fill-current mb-1" />
                  <p className="text-[10px] text-zinc-550 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Current Streak</p>
                  <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{stats.currentStreak} Days</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                  <Award className="w-5 h-5 text-amber-500 mb-1" />
                  <p className="text-[10px] text-zinc-550 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Longest Streak</p>
                  <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{stats.longestStreak} Days</p>
                </div>
              </div>

              {/* Deterministic daily leaderboard */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-450 font-black mb-3.5 flex items-center gap-1.5 label-title">
                  <Activity className="w-3.5 h-3.5 text-[#2563EB]" /> Daily Leaderboard
                </h4>
                
                <div className="space-y-2">
                  {getDeterministicLeaderboard().map((user, index) => (
                    <div key={index} className="flex justify-between items-center text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/10 border border-zinc-150 dark:border-zinc-800/30">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                        <span className="font-extrabold text-zinc-400 w-4">{index + 1}.</span>
                        <span>{user.name}</span>
                      </div>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{user.timeField}</span>
                    </div>
                  ))}
                  {/* Complete Daily Challenge to join board */}
                  {!gameState.isCompleted && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center italic pt-1 font-medium">
                      Complete daily challenge to see where you rank!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column workspace */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Daily state banner */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-2xl flex items-center justify-between shadow-custom select-none">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <span className="text-xs uppercase font-black px-2.5 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded tracking-widest text-[9px] border border-amber-200/40">
                    {gameState.difficulty} Daily
                  </span>
                  {stats.completedDates.includes(gameState.dateString || '') && (
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1 tracking-wider text-[10px]">
                      <CheckCircle2 className="w-4 h-4 fill-current text-emerald-500" /> Solved Today
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-base md:text-lg bg-zinc-50 dark:bg-zinc-800/40 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-inner">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-sans font-extrabold pr-1">Timer</span>
                    {formatTimerString(gameState.timer)}
                  </div>

                  {!gameState.isCompleted && (
                    <button
                      onClick={() => setGameState((prev) => prev ? { ...prev, isPaused: !prev.isPaused } : null)}
                      className="p-2.5 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:text-[#141414] dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {gameState.isPaused ? <Play className="w-4 h-4 fill-current text-[#2563EB]" /> : <Pause className="w-4 h-4 fill-current" />}
                    </button>
                  )}
                </div>
              </div>

              {gameState.isPaused ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-12 text-center rounded-2xl max-w-[500px] mx-auto shadow-custom space-y-4">
                  <Pause className="w-12 h-12 text-[#2563EB] mx-auto animate-pulse" />
                  <h3 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Challenge Paused</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Timer paused. No pressure! Take your time to calculate the elements logically before resuming.
                  </p>
                  <button
                    onClick={() => setGameState((prev) => prev ? { ...prev, isPaused: false } : null)}
                    className="py-2.5 px-6 font-extrabold bg-[#2563EB] text-white hover:bg-blue-700 rounded-lg cursor-pointer shadow-custom text-xs uppercase tracking-wider active:scale-95 transition-all inline-block"
                  >
                    Resume Solving
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Game controls toolbar */}
                  <div className="flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-850 shadow-custom">
                    <button
                      onClick={handleUndo}
                      disabled={gameState.historyIndex <= 0}
                      className="p-2 px-3 bg-zinc-50 dark:bg-zinc-805 disabled:opacity-40 rounded-lg border border-zinc-250 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-[#141414] hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 flex items-center gap-1.5 select-none active:scale-95 transition-all cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Undo
                    </button>

                    <button
                      onClick={handleRedo}
                      disabled={gameState.historyIndex >= gameState.history.length - 1}
                      className="p-2 px-3 bg-zinc-50 dark:bg-zinc-805 disabled:opacity-40 rounded-lg border border-zinc-250 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-[#141414] hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 flex items-center gap-1.5 select-none active:scale-95 transition-all cursor-pointer"
                    >
                      <Redo2 className="w-3.5 h-3.5" /> Redo
                    </button>

                    <button
                      onClick={handleRestart}
                      className="p-2 px-3 bg-zinc-50 dark:bg-zinc-805 rounded-lg border border-zinc-250 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500/20 dark:hover:text-rose-400 flex items-center gap-1.5 select-none active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restart
                    </button>

                    <div className="h-6 w-[1px] bg-zinc-250 dark:bg-zinc-750 mx-1 hidden sm:block" />

                    <button
                      onClick={() => setActiveHintTypeModel(true)}
                      className="p-2 px-4 bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-blue-100 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Hints Center
                    </button>

                    <button
                      onClick={handleManualCheck}
                      className="p-2 px-4 bg-white dark:bg-zinc-800 border bg-zinc-50 dark:bg-zinc-805 border-zinc-250 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wide hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-1.2 active:scale-95 transition-all cursor-pointer ml-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Check Grid
                    </button>
                  </div>

                  {/* Mistakes Counter */}
                  {gameState.mistakes > 0 && (
                    <div className="bg-rose-50/20 border border-rose-200 dark:border-rose-900/30 p-3 rounded-2xl px-5 text-sm flex items-center justify-between text-rose-620 dark:text-rose-400">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">Mistakes Indicator Checked</span>
                      </div>
                      <span className="font-mono font-black border border-rose-200 bg-rose-50 text-rose-700 dark:text-rose-300 dark:bg-rose-955 px-2 py-0.5 rounded-lg text-xs">
                        {gameState.mistakes} Mistake{gameState.mistakes > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Logic Hint Explanation */}
                  {logicHintResult && (
                    <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-200/50 dark:border-indigo-900/30 p-4 rounded-2xl flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Logic Tip Provided</h4>
                        <p className="text-sm text-zinc-650 dark:text-zinc-300 mt-1">{logicHintResult.reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Error Check Result Explanation */}
                  {errorCheckResult && (
                    <div className="bg-amber-50/30 dark:bg-amber-955/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">Correction Assist Checkup</h4>
                        <p className="text-sm text-zinc-650 dark:text-zinc-300 mt-1 leading-relaxed border-amber-200">
                          Your placed symbol at Row {Math.floor(errorCheckResult.index/6)+1}, Col {(errorCheckResult.index%6)+1} does not match the solution. It is currently <span className="font-bold text-rose-500">{errorCheckResult.actual}</span>, but should contain <span className="font-bold text-indigo-500">{errorCheckResult.expected}</span>.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex justify-center shadow-md">
                    <GameBoard
                      board={gameState.board}
                      clues={gameState.clues}
                      solution={gameState.solution}
                      selectedCell={selectedCell}
                      onSelectCell={setSelectedCell}
                      onCellValueSet={handleCellValueSet}
                      settings={settings}
                      violations={violations}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics View */}
        {activeTab === 'stats' && (
          <div className="max-w-3xl mx-auto">
            <StatsPanel
              stats={stats}
              onClose={() => setActiveTab('play')}
              onClearStats={clearStatsAndAchievements}
            />
          </div>
        )}

        {/* Achievements View */}
        {activeTab === 'achievements' && (
          <div className="max-w-4xl mx-auto">
            <AchievementsPanel
              achievements={achievements}
              onClose={() => setActiveTab('play')}
            />
          </div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <SettingsPanel
              settings={settings}
              onSettingsChange={(nextSettings) => {
                setSettings(nextSettings);
                saveSettings(nextSettings);
              }}
              onClose={() => setActiveTab('play')}
            />
          </div>
        )}

        {/* Tutorial Guide View */}
        {activeTab === 'how-to-play' && (
          <div className="max-w-3xl mx-auto">
            <HowToPlay onClose={() => setActiveTab('play')} />
          </div>
        )}

      </main>

      {/* Selector popup modal for hint options */}
      {activeHintTypeModel && gameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/90 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-800 rounded-2xl shadow-custom overflow-hidden p-6 relative">
            <button
              onClick={() => setActiveHintTypeModel(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-[900] uppercase tracking-tight text-zinc-900 dark:text-zinc-50 mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-5 h-5 text-[#2563EB]" />
              Select Assist Action
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6 font-bold">
              Revealing tips tracks towards current hint metrics tally
            </p>

            <div className="space-y-3">
              
              {/* Option 1: Single Cell Hint */}
              <button
                onClick={triggerSingleCellHint}
                className="w-full text-left p-3.5 rounded-lg hover:border-[#2563EB] bg-zinc-50 dark:bg-zinc-805 border-2 border-zinc-100 dark:border-zinc-800 flex items-start gap-3.5 transition-all text-xs cursor-pointer group active:scale-98"
              >
                <div className="p-2 px-3 rounded bg-blue-100 dark:bg-blue-900/40 text-[#2563EB] dark:text-blue-405 font-black text-sm">
                  1
                </div>
                <div className="flex-grow">
                  <p className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 group-hover:text-[#2563EB] transition-colors">Single Cell Hint</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-350 mt-1 leading-relaxed">
                    Directly reveals the correct symbol for your selected cell or a random empty cell.
                  </p>
                </div>
              </button>

              {/* Option 2: Logic Hint */}
              <button
                onClick={triggerLogicHint}
                className="w-full text-left p-3.5 rounded-lg hover:border-emerald-600 bg-zinc-50 dark:bg-zinc-805 border-2 border-zinc-100 dark:border-zinc-800 flex items-start gap-3.5 transition-all text-xs cursor-pointer group active:scale-98"
              >
                <div className="p-2 px-3 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-605 dark:text-emerald-400 font-black text-sm">
                  2
                </div>
                <div className="flex-grow">
                  <p className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">Logic Hint</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-355 mt-1 leading-relaxed">
                    Scans the current board state and explains a specific Kurosu deductive rule you can apply next.
                  </p>
                </div>
              </button>

              {/* Option 3: Error Check Hint */}
              <button
                onClick={triggerErrorCheckHint}
                className="w-full text-left p-3.5 rounded-lg hover:border-rose-500 bg-zinc-50 dark:bg-zinc-805 border-2 border-zinc-100 dark:border-zinc-800 flex items-start gap-3.5 transition-all text-xs cursor-pointer group active:scale-98"
              >
                <div className="p-2 px-3 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black text-sm">
                  3
                </div>
                <div className="flex-grow">
                  <p className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 transition-colors">Error Check Hint</p>
                  <p className="text-[11px] text-zinc-650 dark:text-zinc-350 mt-1 leading-relaxed">
                    Scans your filled entries, and points out the exact coordinates of one incorrect cell in red.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebratory Victory overlay summary */}
      {showWinDetails && gameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 dark:bg-zinc-950/90 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 text-center space-y-6 relative overflow-hidden">
            
            {/* Visual background lights decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Victory Title */}
            <div className="space-y-2 select-none">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center text-amber-500 mx-auto border border-amber-200 text-3xl">
                🏆
              </div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Kurosu Grid Solved!</h2>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
                {gameState.isDaily ? "Daily Challenge successfully recorded." : "Classic puzzle solved beautifully."}
              </p>
            </div>

            {/* Stars Rating Visual representation */}
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: 3 }).map((_, idx) => {
                const filled = idx < gameState.starRating;
                return (
                  <span
                    key={idx}
                    className={`text-4xl transform transition-transform duration-500 ${filled ? 'text-amber-500 scale-110 drop-shadow-md' : 'text-zinc-200 dark:text-zinc-800'}`}
                  >
                    ★
                  </span>
                );
              })}
            </div>

            {/* Statistics details cards */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Solve Duration</p>
                <p className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-100 mt-1">
                  {formatTimerString(gameState.timer)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Difficulty Played</p>
                <p className="text-xl font-bold capitalize text-zinc-800 dark:text-zinc-100 mt-1">
                  {gameState.difficulty}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Mistakes Registered</p>
                <p className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-100 mt-1">
                  {gameState.mistakes}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-400 dark:text-zinc-505 font-medium uppercase tracking-wider">Hints Requested</p>
                <p className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-100 mt-1">
                  {gameState.hintsUsed}
                </p>
              </div>
            </div>

            {/* Victory navigation triggers */}
            <div className="pt-6 border-t border-zinc-150 dark:border-zinc-800/80 flex justify-center gap-3 select-none">
              <button
                onClick={() => {
                  setShowWinDetails(false);
                  setActiveTab('stats');
                }}
                className="py-2.5 px-5 select-none bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-sm rounded-xl transition-all cursor-pointer border border-zinc-200 dark:border-zinc-700 block text-center flex-1 max-w-[150px]"
              >
                Show Stats
              </button>

              <button
                onClick={() => {
                  setShowWinDetails(false);
                  startNewGame(gameState.difficulty, true);
                }}
                className="py-2.5 px-6 select-none bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-md block text-center flex-1 max-w-[180px] hover:scale-102 active:scale-98"
              >
                Play Next Puzzle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
