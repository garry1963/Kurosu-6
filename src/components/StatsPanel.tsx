import { Statistics, Difficulty } from '../types';
import { BarChart3, Hourglass, HelpCircle, Gamepad2, Flame, Award, Clock } from 'lucide-react';

interface StatsPanelProps {
  stats: Statistics;
  onClose?: () => void;
  onClearStats?: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatAverageTime(seconds: number): string {
  if (!seconds || seconds === 0 || isNaN(seconds)) return '--';
  return formatTime(seconds);
}

export default function StatsPanel({ stats, onClose, onClearStats }: StatsPanelProps) {
  const solveRate = stats.totalPlayed > 0 
    ? Math.round((stats.totalSolved / stats.totalPlayed) * 100) 
    : 0;

  const cards = [
    {
      title: 'Puzzles Solved',
      value: `${stats.totalSolved} / ${stats.totalPlayed}`,
      icon: <Gamepad2 className="w-5 h-5 text-[#2563EB]" />,
      sub: `Solve Rate: ${solveRate}%`
    },
    {
      title: 'Active Streak',
      value: `${stats.currentStreak} Days`,
      icon: <Flame className="w-5 h-5 text-orange-550 dark:text-orange-450" />,
      sub: `Longest Streak: ${stats.longestStreak} Days`
    },
    {
      title: 'Total Play Time',
      value: formatTime(stats.totalPlayTime),
      icon: <Clock className="w-5 h-5 text-emerald-500" />,
      sub: `Session Average: ${stats.totalSolved > 0 ? formatTime(stats.totalPlayTime / stats.totalPlayed) : '--'}`
    },
    {
      title: 'Hints Used',
      value: `${stats.hintsUsedTotal} hints`,
      icon: <HelpCircle className="w-5 h-5 text-cyan-500" />,
      sub: 'Deductions & Checkups'
    }
  ];

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-custom border border-zinc-200 dark:border-zinc-800 font-sans max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-[900] dark:text-zinc-50 flex items-center gap-2 uppercase tracking-tight">
            <BarChart3 className="w-5 h-5 text-[#2563EB]" />
            Productivity & Stats
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold uppercase tracking-wider">
            Your Kurosu 6 performance overview
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-550 dark:text-zinc-350 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all font-bold text-xs uppercase tracking-wider border-2 border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-800/10 flex items-center gap-4 shadow-sm">
            <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest">{card.title}</p>
              <p className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{card.value}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Difficulty Breakdown */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-250 mb-3.5 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#2563EB]" />
          Records by Difficulty
        </h3>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-205 dark:divide-zinc-800">
          <div className="grid grid-cols-3 bg-zinc-50 dark:bg-zinc-800/40 p-3 text-[10px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
            <div>Difficulty</div>
            <div className="text-center">Best Record</div>
            <div className="text-center">Average Solve</div>
          </div>

          {difficulties.map((diff) => {
            const bestTime = stats.bestTimes[diff];
            const avgTime = stats.averageSolveTime[diff];

            return (
              <div key={diff} className="grid grid-cols-3 p-3.5 text-xs items-center dark:hover:bg-zinc-800/20 hover:bg-zinc-50/20 transition-colors border-zinc-150">
                <div className="capitalize font-bold text-[#141414] dark:text-zinc-250">
                  {diff}
                </div>
                <div className="text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  {bestTime ? formatTime(bestTime) : '--'}
                </div>
                <div className="text-center font-mono text-zinc-600 dark:text-zinc-350 text-xs">
                  {avgTime ? formatAverageTime(avgTime) : '--'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      {onClearStats && (
        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              if (confirm('Are you absolutely sure you want to reset all your statistics and achievements progress? This cannot be undone.')) {
                onClearStats();
              }
            }}
            className="text-xs text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Reset Statistics
          </button>
        </div>
      )}
    </div>
  );
}
