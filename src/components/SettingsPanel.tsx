import { Settings } from '../types';
import { Volume2, VolumeX, Smartphone, Eye, Sparkles, CheckSquare, Sparkle, ToggleLeft, Moon, Sun, Type } from 'lucide-react';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClose?: () => void;
}

export default function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
  const toggle = (key: keyof Settings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  const setSymbolSize = (size: 'small' | 'medium' | 'large') => {
    onSettingsChange({
      ...settings,
      symbolSize: size
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-custom border border-zinc-200 dark:border-zinc-800 font-sans max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-[900] dark:text-zinc-50 flex items-center gap-2 uppercase tracking-tight">
          <Sparkles className="w-5 h-5 text-[#2563EB]" />
          Game Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-550 dark:text-zinc-350 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all font-bold text-xs uppercase tracking-wider border-2 border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Theme Settings */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border-2 border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              {settings.darkMode ? <Moon className="w-4 h-4 text-[#2563EB]" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <p className="font-bold text-zinc-850 dark:text-zinc-100 text-sm">Dark Mode</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Toggle dark visual mode</p>
            </div>
          </div>
          <button
            onClick={() => toggle('darkMode')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB] ${settings.darkMode ? 'bg-[#2563EB]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Sound Effects */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border-2 border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              {settings.soundEffects ? <Volume2 className="w-4 h-4 text-[#2563EB]" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
            </div>
            <div>
              <p className="font-bold text-zinc-850 dark:text-zinc-100 text-sm">Sound Effects</p>
              <p className="text-xs text-zinc-550 dark:text-zinc-400">Play synthesizer audio effects</p>
            </div>
          </div>
          <button
            onClick={() => toggle('soundEffects')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB] ${settings.soundEffects ? 'bg-[#2563EB]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.soundEffects ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Haptic Feedback */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border-2 border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Smartphone className="w-4 h-4 text-pink-500" />
            </div>
            <div>
              <p className="font-bold text-zinc-850 dark:text-zinc-100 text-sm">Haptic Feedback</p>
              <p className="text-xs text-zinc-550 dark:text-zinc-400">Vibrate tablet/device on taps</p>
            </div>
          </div>
          <button
            onClick={() => toggle('hapticFeedback')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB] ${settings.hapticFeedback ? 'bg-[#2563EB]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.hapticFeedback ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Auto Error Checking */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border-2 border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              <CheckSquare className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-bold text-zinc-850 dark:text-zinc-100 text-sm">Auto Error Checking</p>
              <p className="text-xs text-zinc-550 dark:text-zinc-400">Highlight player errors in red instantly</p>
            </div>
          </div>
          <button
            onClick={() => toggle('autoErrorChecking')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none focus:ring-[#2563EB] focus:ring-2 focus:ring-[#2563EB] ${settings.autoErrorChecking ? 'bg-[#2563EB]' : 'bg-zinc-300 dark:bg-zinc-705'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoErrorChecking ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Show Rule Violations */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border-2 border-zinc-100 dark:border-zinc-855">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Eye className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-bold text-zinc-855 dark:text-zinc-100 text-sm">Show Rule Violations</p>
              <p className="text-xs text-zinc-550 dark:text-zinc-400">Highlight 3-consecutive elements or count limits</p>
            </div>
          </div>
          <button
            onClick={() => toggle('showRuleViolations')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB] ${settings.showRuleViolations ? 'bg-[#2563EB]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showRuleViolations ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Left-Handed Layout */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border-2 border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-707 dark:text-zinc-300">
              <ToggleLeft className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-bold text-zinc-855 dark:text-zinc-100 text-sm">Left-Handed Layout</p>
              <p className="text-xs text-zinc-550 dark:text-zinc-400">Position keypad on the left for easy left-thumb play</p>
            </div>
          </div>
          <button
            onClick={() => toggle('leftHandedLayout')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB] ${settings.leftHandedLayout ? 'bg-[#2563EB]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.leftHandedLayout ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Symbol Size */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border-2 border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-707 dark:text-zinc-300">
              <Type className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-bold text-zinc-855 dark:text-zinc-100 text-sm">Symbol Size</p>
              <p className="text-xs text-zinc-550 dark:text-zinc-400">Adjust the size of X and O characters</p>
            </div>
          </div>
          <div className="flex bg-zinc-200/50 dark:bg-zinc-800 rounded-lg p-1">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setSymbolSize(size)}
                className={`px-3 py-1 text-xs font-bold capitalize rounded-md transition-all cursor-pointer ${
                  settings.symbolSize === size
                    ? 'bg-white dark:bg-zinc-600 text-[#2563EB] dark:text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
