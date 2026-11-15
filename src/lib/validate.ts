import { clampAmount } from './finance.js';
import type { FeeFlag, QuizInput, ScannedFee } from './types.js';
import { CREDIT_TIERS, GOALS, MARKET_LIST } from './types.js';
import type { Market } from './types.js';

// Saves made before Europe was added stored a US state code in `state`.
const LEGACY_STATES: Record<string, Market> = { TX: 'us-tx', CA: 'us-ca', NY: 'us-ny', FL: 'us-fl', IL: 'us-il' };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function parseQuizInput(raw: unknown): QuizInput | null {
  if (!isObject(raw)) return null;
  const { goal, amount, tier, bankApr } = raw;
  const market = typeof raw.state === 'string' && raw.market === undefined ? LEGACY_STATES[raw.state] : raw.market;
  if (!MARKET_LIST.includes(market as Market)) return null;
  if (!GOALS.includes(goal as QuizInput['goal'])) return null;
  if (!CREDIT_TIERS.includes(tier as QuizInput['tier'])) return null;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
  if (bankApr !== null && (typeof bankApr !== 'number' || !Number.isFinite(bankApr) || bankApr < 0 || bankApr > 60)) {
    return null;
  }
  const g = goal as QuizInput['goal'];
  return {
    market: market as Market,
    goal: g,
    tier: tier as QuizInput['tier'],
    amount: clampAmount(g, amount),
    bankApr: bankApr as number | null,
  };
}

const FLAGS: FeeFlag[] = ['junk', 'negotiable', 'standard'];

export function parseScannedFees(raw: unknown): ScannedFee[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObject)
    .map((f) => ({
      name: typeof f.name === 'string' ? f.name.slice(0, 80) : '',
      amount: typeof f.amount === 'number' && Number.isFinite(f.amount) ? Math.max(0, Math.round(f.amount)) : -1,
      flag: FLAGS.includes(f.flag as FeeFlag) ? (f.flag as FeeFlag) : 'standard',
      note: typeof f.note === 'string' ? f.note.slice(0, 240) : '',
    }))
    .filter((f) => f.name && f.amount >= 0)
    .slice(0, 20);
}
