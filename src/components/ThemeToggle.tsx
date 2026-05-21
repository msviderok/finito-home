import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

const themeStorageKey = 'finito-theme';
type ThemePreference = 'light' | 'dark';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark';
}

function applyTheme(preference: ThemePreference) {
  const isDark = preference === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  return isDark;
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = localStorage.getItem(themeStorageKey);
    const applySystemTheme = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setIsDark(applyTheme(systemTheme));
    };

    if (isThemePreference(storedTheme)) {
      setIsDark(applyTheme(storedTheme));
    } else {
      applySystemTheme();
    }

    const handleChange = () => {
      if (!isThemePreference(localStorage.getItem(themeStorageKey))) {
        applySystemTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur"
      onClick={() => {
        const nextIsDark = !isDark;
        const nextTheme = nextIsDark ? 'dark' : 'light';
        localStorage.setItem(themeStorageKey, nextTheme);
        setIsDark(applyTheme(nextTheme));
      }}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
