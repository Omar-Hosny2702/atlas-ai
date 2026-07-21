import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '@/context/ThemeContext';

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Theme</h3>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { value: 'light' as const, label: 'Light', Icon: Sun },
            { value: 'dark' as const, label: 'Dark', Icon: Moon },
          ]
        ).map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={clsx(
              'flex flex-col items-center gap-2 rounded-xl border px-4 py-5 transition-colors',
              theme === value
                ? 'border-accent-500 dark:border-accent-dark bg-accent-50 dark:bg-ink-raised'
                : 'border-border-light dark:border-border-dark hover:bg-paper-alt dark:hover:bg-ink-raised'
            )}
          >
            <Icon size={20} />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-light dark:text-muted-dark">
        Atlas AI follows your system theme the first time you open it, then remembers your choice.
      </p>
    </div>
  );
}
