import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'lendro:theme';
const SWITCH_MS = 500;
const listeners = new Set<() => void>();
let switchTimer = 0;

// index.html sets the class before first paint; this reads it back so React agrees with the page.
const current = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.classList.toggle('dark', theme === 'dark');
  window.clearTimeout(switchTimer);
  switchTimer = window.setTimeout(() => root.classList.remove('theme-switching'), SWITCH_MS);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // The choice still applies for this visit when storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, current);
  return [theme, () => setTheme(theme === 'dark' ? 'light' : 'dark')];
}
