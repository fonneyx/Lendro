import { Car, ChevronLeft, House, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AMOUNT_RANGE } from '../lib/finance';
import { formatUSD } from '../lib/format';
import type { Goal } from '../lib/types';
import { CREDIT_TIERS, GOAL_LABELS, STATE_NAMES, TIER_LABELS, US_STATES } from '../lib/types';
import { useApp } from '../state/AppContext';

const GOAL_ICONS: Record<Goal, typeof House> = { mortgage: House, auto: Car, bnpl: ShoppingBag };
const SCAN_MS = 1500;

const choice = (selected: boolean) =>
  `rounded-xl border bg-surface text-left transition-colors ${
    selected ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-ink-soft'
  }`;

export default function Quiz() {
  const { input, setInput, setView } = useApp();
  const [step, setStep] = useState(1);
  const [hasOffer, setHasOffer] = useState(input.bankApr !== null);
  const [aprText, setAprText] = useState(input.bankApr !== null ? String(input.bankApr) : '');
  const [amountText, setAmountText] = useState(String(input.amount));
  const [scanning, setScanning] = useState(false);
  const range = AMOUNT_RANGE[input.goal];

  useEffect(() => setAmountText(String(input.amount)), [input.amount]);

  const aprValue = Number(aprText);
  const aprValid = aprText.trim() !== '' && Number.isFinite(aprValue) && aprValue > 0 && aprValue <= 40;
  const canContinue = step !== 4 || !hasOffer || aprValid;

  const next = () => {
    if (step < 4) return setStep(step + 1);
    setInput({ bankApr: hasOffer ? Math.round(aprValue * 100) / 100 : null });
    setScanning(true);
    window.setTimeout(() => setView('preview'), SCAN_MS);
  };

  if (scanning) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6" role="status">
        <p className="text-lg font-semibold">
          Scanning 114 US lenders in {STATE_NAMES[input.state]} for a {formatUSD(input.amount)} {GOAL_LABELS[input.goal]}...
        </p>
        <div className="mt-6 h-2 w-full max-w-sm overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-save" style={{ animation: `fill ${SCAN_MS}ms linear forwards` }} />
        </div>
        <style>{'@keyframes fill { from { width: 0 } to { width: 100% } }'}</style>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(step - 1) : setView('landing'))}
          className="inline-flex items-center gap-1 text-ink-soft hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        <span className="text-muted">Step {step} of 4</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-line">
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${step * 25}%` }} />
      </div>

      <div className="mt-8">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Where are you borrowing, and for what?</h1>
            <label className="mt-6 block text-sm font-medium" htmlFor="state">State</label>
            <select
              id="state"
              value={input.state}
              onChange={(e) => setInput({ state: e.target.value as typeof input.state })}
              className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3"
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>{STATE_NAMES[s]}</option>
              ))}
            </select>
            <p className="mt-6 text-sm font-medium">Loan goal</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => {
                const Icon = GOAL_ICONS[g];
                return (
                  <button key={g} type="button" onClick={() => setInput({ goal: g })} className={`${choice(input.goal === g)} p-4`} aria-pressed={input.goal === g}>
                    <Icon className="h-5 w-5" aria-hidden />
                    <span className="mt-3 block font-medium">{GOAL_LABELS[g]}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">How much do you need?</h1>
            <p className="mt-1 text-sm text-muted">{GOAL_LABELS[input.goal]}: {formatUSD(range.min)} to {formatUSD(range.max)}</p>
            <div className="mt-6 flex items-center rounded-lg border border-line bg-surface px-3 focus-within:ring-1 focus-within:ring-ink">
              <span className="text-muted">$</span>
              <input
                inputMode="numeric"
                aria-label="Loan amount in dollars"
                value={amountText ? Number(amountText).toLocaleString('en-US') : ''}
                onChange={(e) => setAmountText(e.target.value.replace(/[^\d]/g, ''))}
                onBlur={() => setInput({ amount: Number(amountText) || range.default })}
                onKeyDown={(e) => e.key === 'Enter' && setInput({ amount: Number(amountText) || range.default })}
                className="min-h-12 w-full bg-transparent px-2 text-2xl font-semibold tabular-nums outline-none"
              />
            </div>
            <input
              type="range"
              aria-label="Loan amount slider"
              min={range.min}
              max={range.max}
              step={range.step}
              value={input.amount}
              onChange={(e) => setInput({ amount: Number(e.target.value) })}
              className="mt-6 w-full accent-ink"
            />
            <div className="mt-1 flex justify-between text-xs text-muted tabular-nums">
              <span>{formatUSD(range.min)}</span>
              <span>{formatUSD(range.max)}</span>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">What is your credit score range?</h1>
            <p className="mt-1 text-sm text-muted">An estimate is fine. We never run a credit check.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {CREDIT_TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInput({ tier: t })}
                  aria-pressed={input.tier === t}
                  className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
                    input.tier === t ? 'border-ink bg-ink text-white' : 'border-line bg-surface hover:border-ink-soft'
                  }`}
                >
                  {TIER_LABELS[t]}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Do you already have an offer from a single bank?</h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setHasOffer(true)} className={`${choice(hasOffer)} p-4`} aria-pressed={hasOffer}>
                <span className="font-medium">Yes, I have an offer</span>
                <span className="mt-1 block text-sm text-muted">Compare it with the market</span>
              </button>
              <button type="button" onClick={() => setHasOffer(false)} className={`${choice(!hasOffer)} p-4`} aria-pressed={!hasOffer}>
                <span className="font-medium">No, just exploring</span>
                <span className="mt-1 block text-sm text-muted">Use the {STATE_NAMES[input.state]} baseline</span>
              </button>
            </div>
            {hasOffer && (
              <div className="mt-6">
                <label htmlFor="apr" className="block text-sm font-medium">Offered APR</label>
                <div className="mt-2 flex items-center rounded-lg border border-line bg-surface px-3 focus-within:ring-1 focus-within:ring-ink">
                  <input
                    id="apr"
                    inputMode="decimal"
                    placeholder="e.g. 6.85"
                    value={aprText}
                    onChange={(e) => setAprText(e.target.value.replace(/[^\d.]/g, ''))}
                    className="min-h-12 w-full bg-transparent text-xl font-semibold tabular-nums outline-none"
                  />
                  <span className="text-muted">%</span>
                </div>
                {aprText !== '' && !aprValid && <p className="mt-2 text-sm text-risk">Enter an APR between 0.01 and 40.</p>}
              </div>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={next}
        className="mt-10 min-h-12 w-full rounded-lg bg-ink font-medium text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        {step < 4 ? 'Continue' : 'Run my rate check'}
      </button>
    </div>
  );
}
