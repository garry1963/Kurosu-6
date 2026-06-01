import { Settings } from '../types';
import { Sparkles, Trophy, Settings as SettingsIcon, BarChart3, HelpCircle, Flame, Moon, Sun, Calendar } from 'lucide-react';

interface HeaderProps {
  activeTab: 'play' | 'daily' | 'stats' | 'achievements' | 'how-to-play' | 'settings';
  setActiveTab: (tab: 'play' | 'daily' | 'stats' | 'achievements' | 'how-to-play' | 'settings') => void;
  streak: number;
  settings: Settings;
  onThemeToggle: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  streak,
  settings,
  onThemeToggle,
}: HeaderProps) {
  const tabs = [
    { id: 'play', label: 'Classic Game', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'daily', label: 'Daily Challenge', icon: <Calendar className="w-4 h-4" /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'how-to-play', label: 'How To Play', icon: <HelpCircle className="w-4 h-4" /> },
  ] as const;

  return (
    <header className="w-full bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-850 py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 select-none font-sans sticky top-0 z-50 shadow-sm">
      {/* Brand Logo and Title */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <button
          onClick={() => setActiveTab('play')}
          className="flex items-center gap-3.5 group cursor-pointer text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-[#141414] dark:bg-zinc-800 shadow-custom flex items-center justify-center text-white font-[900] text-xl font-sans group-hover:scale-105 transition-all">
            K
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-[900] text-zinc-900 dark:text-zinc-50 tracking-tighter flex items-center gap-1.5 leading-none uppercase">
              Kurosu <span className="text-[#2563EB] dark:text-blue-400">6</span>
            </h1>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold tracking-widest uppercase block mt-1.5">
              Syndicated Logic Series
            </span>
          </div>
        </button>

        {/* Action icons right (Streak & Theme) on mobile */}
        <div className="flex items-center gap-3 md:hidden">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/10">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-bold font-mono">{streak}d</span>
            </div>
          )}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-630 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {settings.darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2.5 w-full md:w-auto max-w-full overflow-x-auto scrollbar-none py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold rounded-xl cursor-pointer transition-all ${
                isActive
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-905 bg-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action icons right (Streak & Theme) on desktop */}
      <div className="hidden md:flex items-center gap-4">
        {streak > 0 && (
          <div className="flex items-center gap-1 px-3.5 py-1.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-full border border-orange-100 dark:border-orange-900/30 text-xs font-bold leading-none select-none">
            <Flame className="w-4 h-4 fill-current motion-preset-bounce" />
            <span className="font-mono text-sm leading-none">{streak} Day Streak</span>
          </div>
        )}

        <button
          onClick={onThemeToggle}
          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          title={settings.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {settings.darkMode ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>
    </header>
  );
}
