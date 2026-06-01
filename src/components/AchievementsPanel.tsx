import { Achievement } from '../types';
import { Trophy, Star, Zap, Flame, Award, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface AchievementsPanelProps {
  achievements: Achievement[];
  onClose?: () => void;
}

const getIcon = (id: string, unlocked: boolean) => {
  const color = unlocked ? 'text-amber-500' : 'text-zinc-400';
  switch (id) {
    case 'first-victory':
      return <Award className={`w-8 h-8 ${color}`} />;
    case 'solve-10':
      return <Trophy className={`w-8 h-8 ${color}`} />;
    case 'solve-100':
      return <Sparkles className={`w-8 h-8 ${color}`} />;
    case 'no-hints':
      return <Zap className={`w-8 h-8 ${color}`} />;
    case 'perfect-puzzle':
      return <Star className={`w-8 h-8 ${color}`} />;
    case 'streak-7':
      return <Flame className={`w-8 h-8 ${color}`} />;
    case 'streak-30':
      return <Flame className={`w-8 h-8 ${color}`} />;
    case 'expert-master':
      return <CheckCircle2 className={`w-8 h-8 ${color}`} />;
    default:
      return <Trophy className={`w-8 h-8 ${color}`} />;
  }
};

export default function AchievementsPanel({ achievements, onClose }: AchievementsPanelProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-custom border border-zinc-200 dark:border-zinc-800 font-sans max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-[900] dark:text-zinc-50 flex items-center gap-2 uppercase tracking-tight">
            <Trophy className="w-5 h-5 text-amber-500" />
            Game Milestones
          </h2>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 uppercase font-bold tracking-widest">
            Unlocked {unlockedCount} of {achievements.length} badges
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-555 dark:text-zinc-355 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all font-bold text-xs uppercase tracking-wider border-2 border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg h-3 border border-zinc-200 dark:border-zinc-755 overflow-hidden p-[2px]">
        <div
          className="bg-amber-500 h-full rounded-md transition-all duration-500"
          style={{ width: `${Math.min(100, Math.round((unlockedCount / achievements.length) * 100))}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 rounded-xl border-2 flex gap-4 items-start transition-all shadow-sm ${
              achievement.unlocked
                ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-305 dark:border-amber-900/60'
                : 'bg-zinc-50/50 dark:bg-zinc-800/20 border-zinc-105 dark:border-zinc-800/80'
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {getIcon(achievement.id, achievement.unlocked)}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center gap-1.5">
                <h3 className={`font-black uppercase tracking-tight text-xs md:text-sm ${achievement.unlocked ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  {achievement.title}
                </h3>
                {achievement.unlocked && (
                  <span className="text-[9px] bg-amber-100 dark:bg-amber-955 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 uppercase font-extrabold tracking-wider whitespace-nowrap">
                    REACHED
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                {achievement.description}
              </p>
              {achievement.unlocked && achievement.unlockedAt && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-mono">
                  Achieved: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
