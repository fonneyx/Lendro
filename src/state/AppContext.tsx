import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AMOUNT_RANGE, clampAmount } from '../lib/finance';
import type { QuizInput, View } from '../lib/types';

interface AppState {
  view: View;
  setView: (view: View) => void;
  input: QuizInput;
  setInput: (patch: Partial<QuizInput>) => void;
}

const DEFAULT_INPUT: QuizInput = {
  state: 'TX',
  goal: 'mortgage',
  amount: AMOUNT_RANGE.mortgage.default,
  tier: 'good',
  bankApr: null,
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('landing');
  const [input, setInputState] = useState<QuizInput>(DEFAULT_INPUT);

  const setInput = useCallback((patch: Partial<QuizInput>) => {
    setInputState((prev) => {
      const next = { ...prev, ...patch };
      if (patch.goal && patch.goal !== prev.goal && patch.amount === undefined) {
        next.amount = AMOUNT_RANGE[patch.goal].default;
      }
      next.amount = clampAmount(next.goal, next.amount);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ view, setView, input, setInput }), [view, input, setInput]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
