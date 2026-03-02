'use client';

import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:opacity-90"
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4" />
          Dark
        </>
      ) : (
        <>
          <Sun className="w-4 h-4" />
          Light
        </>
      )}
    </button>
  );
}
