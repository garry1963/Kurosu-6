import { Check, X, Info } from 'lucide-react';

interface HowToPlayProps {
  onClose?: () => void;
  inline?: boolean;
}

export default function HowToPlay({ onClose, inline = false }: HowToPlayProps) {
  return (
    <div className={`p-6 max-h-[85vh] overflow-y-auto ${!inline ? 'bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800' : ''}`}>
      {!inline && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-sans text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Info className="w-6 h-6 text-indigo-500" />
            How to Play Kurosu 6
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Close
            </button>
          )}
        </div>
      )}

      <div className="space-y-8 font-sans">
        {/* Intro */}
        <div>
          <p className="text-zinc-605 text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm md:text-base">
            Kurosu 6 is a logical deduction puzzle played on a <strong>6×6</strong> grid. Your objective is to fill the entire grid with Crosses (<span className="text-rose-500 font-bold">X</span>) and Noughts (<span className="text-cyan-500 font-bold">O</span>) by using logic alone. There is exactly one unique solution.
          </p>
        </div>

        {/* Rule 1 */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xs font-bold">1</span>
            No Three Consecutive Symbols
          </h3>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-4 leading-relaxed">
            You cannot place three identical symbols adjacent to each other in any row or column.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex flex-col items-center">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Valid
              </span>
              <div className="flex gap-1">
                <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-sm font-bold text-rose-500 bg-rose-50/20">X</div>
                <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-sm font-bold text-rose-500 bg-rose-50/20">X</div>
                <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-sm font-bold text-cyan-500 bg-cyan-50/20">O</div>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex flex-col items-center">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Invalid
              </span>
              <div className="flex gap-1">
                <div className="w-8 h-8 rounded border border-rose-300 bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-sm font-bold text-rose-500">X</div>
                <div className="w-8 h-8 rounded border border-rose-300 bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-sm font-bold text-rose-500">X</div>
                <div className="w-8 h-8 rounded border border-rose-300 bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-sm font-bold text-rose-500">X</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rule 2 */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-xs font-bold">2</span>
            Equal Number of Symbols
          </h3>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-4 leading-relaxed">
            Every row and every column of the 6×6 grid must contain exactly <strong>3 Xs</strong> and <strong>3 Os</strong> when complete.
          </p>
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-100 dark:border-zinc-700">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 block text-center">
              Example of a fully valid completed row
            </span>
            <div className="flex justify-center gap-1.5">
              <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center font-bold text-rose-500 bg-rose-50/20">X</div>
              <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center font-bold text-cyan-500 bg-cyan-50/20">O</div>
              <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center font-bold text-rose-500 bg-rose-50/20">X</div>
              <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center font-bold text-cyan-505 text-cyan-500 bg-cyan-50/20">O</div>
              <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center font-bold text-cyan-505 text-cyan-500 bg-cyan-50/20">O</div>
              <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-600 flex items-center justify-center font-bold text-rose-500 bg-rose-50/20">X</div>
            </div>
            <div className="mt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" /> 3 Crosses & 3 Noughts
            </div>
          </div>
        </div>

        {/* Deductive Tips */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Deductive Tips</h3>
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed">
            <li>
              <strong>Look for Pairs:</strong> If you see two identical symbols adjacent to each other (e.g. <span className="font-bold text-rose-500">XX</span>), the cells on either side must contain the opposite symbol (<span className="font-bold text-cyan-500">O</span>) so you don't build a sequence of three.
            </li>
            <li>
              <strong>Look for Gaps:</strong> If you see a gap between two identical symbols (e.g. <span className="font-bold text-rose-500">X_X</span>), the middle cell must contain the opposite symbol (<span className="font-bold text-cyan-500">O</span>) to prevent three consecutive.
            </li>
            <li>
              <strong>Count Remaining:</strong> If a row or column already contains three of one symbol (e.g., three <span className="font-bold text-rose-500">X</span>s), you can confidently fill all remaining empty cells in that row/column with the other symbol (<span className="font-bold text-cyan-500">O</span>).
            </li>
            <li>
              <strong>Avoid Guessing:</strong> Kurosu 6 is designed to be solved 100% logically. If you get stuck, use a <strong>Logic Hint</strong> which explains structural rules you can apply on your current board.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
