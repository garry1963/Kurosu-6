import { CellValue, Settings, RuleViolation } from '../types';
import { Lock, AlertCircle, RefreshCw, Sparkle } from 'lucide-react';

interface GameBoardProps {
  board: CellValue[];
  clues: CellValue[];
  solution: CellValue[];
  selectedCell: number | null;
  onSelectCell: (index: number | null) => void;
  onCellValueSet: (index: number, val: CellValue) => void;
  settings: Settings;
  violations: RuleViolation[];
  isLocked?: boolean;
}

export default function GameBoard({
  board,
  clues,
  solution,
  selectedCell,
  onSelectCell,
  onCellValueSet,
  settings,
  violations,
  isLocked = false,
}: GameBoardProps) {

  // Check if a cell has a rule violation
  const getViolationType = (index: number): 'three-consecutive' | 'too-many-symbols' | null => {
    if (!settings.showRuleViolations || isLocked) return null;
    const block = violations.find(v => v.index === index);
    return block ? block.type : null;
  };

  // Check if cell is incorrect against the unique solution
  const isIncorrectEntry = (index: number): boolean => {
    if (!settings.autoErrorChecking || isLocked) return false;
    const currentVal = board[index];
    const isClue = clues[index] !== null;
    if (!isClue && currentVal !== null) {
      return currentVal !== solution[index];
    }
    return false;
  };

  const handleCellClick = (index: number) => {
    if (isLocked) return;
    const isClue = clues[index] !== null;
    if (isClue) return;

    // Set selected cell first
    onSelectCell(index);
  };

  const handleKeypadPress = (val: CellValue) => {
    if (isLocked) return;
    if (selectedCell !== null && clues[selectedCell] === null) {
      onCellValueSet(selectedCell, val);
    }
  };

  // Helper styles for cells
  const getCellClassName = (index: number) => {
    const isClue = clues[index] !== null;
    const isSelected = !isLocked && selectedCell === index;
    const val = board[index];
    const violation = getViolationType(index);
    const incorrect = isIncorrectEntry(index);

    const sizeClasses = {
      small: "text-xl md:text-2xl",
      medium: "text-3xl md:text-4xl",
      large: "text-5xl md:text-6xl",
    };
    const textSizeClass = settings.symbolSize ? sizeClasses[settings.symbolSize] : sizeClasses['medium'];

    let base = `aspect-square relative flex items-center justify-center transition-all duration-150 ${textSizeClass} select-none ${isLocked ? 'cursor-default' : 'cursor-pointer'} `;

    // Background color, border, text styles to perfectly match target High Density Theme
    if (incorrect) {
      // Error style matched
      base += "bg-[#FEE2E2] text-[#DC2626] dark:bg-rose-950/80 dark:text-rose-200 font-extrabold anim-shake ";
    } else if (violation === 'three-consecutive') {
      base += "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold ";
    } else if (violation === 'too-many-symbols') {
      base += "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold ";
    } else if (isClue) {
      // Clue (locked default cell)
      base += "bg-white dark:bg-zinc-900 text-[#141414] dark:text-zinc-50 font-[900] cursor-not-allowed ";
    } else if (isSelected) {
      // Selected Cell
      base += "bg-blue-50/80 dark:bg-zinc-800/80 text-[#141414] dark:text-zinc-50 font-semibold ring-2 ring-[#2563EB]/40 ring-inset ";
    } else {
      // Normal user cell or empty
      base += `bg-white dark:bg-zinc-900 text-[#141414] dark:text-zinc-50 ${isLocked ? '' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/80'} font-semibold `;
    }

    return base;
  };

  const keypadContent = (
    <div className="flex flex-row sm:flex-col gap-3 justify-center w-full min-w-[120px]">
      <button
        onClick={() => handleKeypadPress('X')}
        disabled={selectedCell === null}
        className={`flex-1 py-4 sm:py-5 px-6 rounded-2xl font-bold text-2xl transition-all cursor-pointer shadow-sm border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-450 active:scale-95 flex items-center justify-center gap-1.5 min-h-[56px] ${selectedCell === null ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className="text-3xl line-height-0">X</span>
        <span className="text-xs uppercase font-medium tracking-wider hidden sm:block">Cross</span>
      </button>

      <button
        onClick={() => handleKeypadPress('O')}
        disabled={selectedCell === null}
        className={`flex-1 py-4 sm:py-5 px-6 rounded-2xl font-bold text-2xl transition-all cursor-pointer shadow-sm border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/30 hover:bg-cyan-50 dark:bg-cyan-950/10 dark:hover:bg-cyan-930/20 text-cyan-600 dark:text-cyan-455 active:scale-95 flex items-center justify-center gap-1.5 min-h-[56px] ${selectedCell === null ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className="text-3xl line-height-0">O</span>
        <span className="text-xs uppercase font-medium tracking-wider hidden sm:block">Nought</span>
      </button>

      <button
        onClick={() => handleKeypadPress(null)}
        disabled={selectedCell === null}
        className={`flex-1 py-4 sm:py-5 px-6 rounded-2xl font-semibold text-sm transition-all cursor-pointer shadow-sm bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 active:scale-95 flex items-center justify-center gap-1.5 min-h-[56px] ${selectedCell === null ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className="text-sm uppercase font-semibold tracking-wider">Erase</span>
      </button>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row gap-6 md:gap-8 items-center ${settings.leftHandedLayout ? 'md:flex-row-reverse' : ''} w-full`}>
      {/* 6x6 Grid Container */}
      <div className="flex-grow w-full max-w-[460px] aspect-square bg-[#141414] dark:bg-zinc-800 p-1.5 rounded-2xl border-4 border-[#141414] dark:border-zinc-800 shadow-custom overflow-hidden">
        <div id="kurosu-grid" className="grid grid-cols-6 grid-rows-6 gap-[2px] w-full h-full bg-[#141414] dark:bg-zinc-800">
          {board.map((val, idx) => {
            const isClue = clues[idx] !== null;
            const violationType = getViolationType(idx);
            const incorrect = isIncorrectEntry(idx);

            return (
              <button
                key={idx}
                id={`cell-${idx}`}
                onClick={() => handleCellClick(idx)}
                className={getCellClassName(idx)}
              >
                {/* Content */}
                <span className="transform transition-transform active:scale-90 font-sans tracking-wide">
                  {val}
                </span>

                {/* Left side corner small indicators */}
                {isClue && (
                  <span className="absolute top-1 right-1 text-[8px] text-zinc-400 dark:text-zinc-500">
                    <Lock className="w-1.5 h-1.5 opacity-60" />
                  </span>
                )}

                {/* Highlight dot for general violations */}
                {violationType && !incorrect && (
                  <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${violationType === 'three-consecutive' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                )}

                {/* Incorrect highlighting badge or warning mark */}
                {incorrect && (
                  <span className="absolute bottom-1 right-1">
                    <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Symbol Pad Keypad (Accessible side controls) */}
      <div className="w-full md:w-auto md:flex-shrink-0">
        <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-3xl border border-zinc-200/55 dark:border-zinc-800 shadow-md">
          {isLocked ? (
            <div className="flex flex-col items-center justify-center py-4 px-2 space-y-2 text-center max-w-[180px]">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Puzzle Locked
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight font-medium">
                Completed & locked until tomorrow's puzzle.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold mb-3 text-center">
                {selectedCell === null ? 'Select a cell above' : 'Choose Symbol'}
              </p>
              {keypadContent}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
