import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { clampAmount } from '../lib/finance';
import { defaultAmount, detectMarket, regionOf } from '../lib/market';
import { loadSaved } from '../lib/plan';
import type { QuizInput, View } from '../lib/types';

export type DashboardPane = 'analyst' | 'plan' | 'rates';

interface AppState {
  view: View;
  setView: (view: View) => void;
  input: QuizInput;
  setInput: (patch: Partial<QuizInput>) => void;
  // Which dashboard section phones and tablets show first.
  pane: DashboardPane;
  setPane: (pane: DashboardPane) => void;
}

function initialInput(): QuizInput {
  // A returning visitor keeps the market of their saved plan; a new one gets a guess from the browser.
  const saved = loadSaved();
  if (saved) return saved.input;
  const market = detectMarket(typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language]);
  return { market, goal: 'mortgage', amount: defaultAmount('mortgage', market), tier: 'good', bankApr: null };
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('landing');
  const [input, setInputState] = useState<QuizInput>(initialInput);
  const [pane, setPane] = useState<DashboardPane>('analyst');

  const setInput = useCallback((patch: Partial<QuizInput>) => {
    setInputState((prev) => {
      const next = { ...prev, ...patch };
      const goalChanged = patch.goal !== undefined && patch.goal !== prev.goal;
      const regionChanged = patch.market !== undefined && regionOf(patch.market) !== regionOf(prev.market);
      if ((goalChanged || regionChanged) && patch.amount === undefined) {
        next.amount = defaultAmount(next.goal, next.market);
      }
      next.amount = clampAmount(next.goal, next.amount);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ view, setView, input, setInput, pane, setPane }),
    [view, input, setInput, pane],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
