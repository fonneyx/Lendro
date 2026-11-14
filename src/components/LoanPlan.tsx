import { BellRing, Check } from 'lucide-react';
import { useMemo } from 'react';
import { computeAudit } from '../lib/finance';
import { formatPct, formatUSD } from '../lib/format';
import type { SavedAudit } from '../lib/plan';
import { planSteps } from '../lib/plan';
import { GOAL_LABELS, STATE_NAMES } from '../lib/types';

interface LoanPlanProps {
  saved: SavedAudit;
  onChange: (next: SavedAudit) => void;
}

const signed = (n: number, fmt: (v: number) => string) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}`;

export default function LoanPlan({ saved, onChange }: LoanPlanProps) {
  const steps = planSteps(saved.input.goal);
  const done = steps.filter((s) => saved.completedSteps.includes(s.id)).length;
  const atSave = useMemo(() => computeAudit(saved.input), [saved.input]);
  const now = useMemo(() => computeAudit(saved.input, { rateShift: saved.rateShift }), [saved.input, saved.rateShift]);
  const since = new Date(saved.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const toggle = (id: string) => {
    const completedSteps = saved.completedSteps.includes(id)
      ? saved.completedSteps.filter((s) => s !== id)
      : [...saved.completedSteps, id];
    onChange({ ...saved, completedSteps });
  };

  const changes = [
    { label: 'Best matched APR', delta: now.best.apr - atSave.best.apr, fmt: formatPct, lowerIsBetter: true, current: formatPct(now.best.apr) },
    { label: 'Best monthly payment', delta: now.best.monthly - atSave.best.monthly, fmt: formatUSD, lowerIsBetter: true, current: formatUSD(now.best.monthly) },
    { label: 'Lifetime savings', delta: now.lifetimeSavings - atSave.lifetimeSavings, fmt: formatUSD, lowerIsBetter: false, current: formatUSD(now.lifetimeSavings) },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold">
          Your {GOAL_LABELS[saved.input.goal].toLowerCase()} plan · {formatUSD(saved.input.amount)} in {STATE_NAMES[saved.input.state]}
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-line">
            <div className="h-full rounded-full bg-save transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          <span className="text-sm tabular-nums text-muted">{done} / {steps.length} done</span>
        </div>
        <ul className="mt-5 divide-y divide-line">
          {steps.map((s) => {
            const checked = saved.completedSteps.includes(s.id);
            return (
              <li key={s.id}>
                <label className="flex cursor-pointer gap-3 py-3">
                  <input type="checkbox" checked={checked} onChange={() => toggle(s.id)} className="peer sr-only" />
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border peer-focus-visible:ring-2 peer-focus-visible:ring-ink ${checked ? 'border-save bg-save text-white' : 'border-line bg-surface'}`}>
                    {checked && <Check className="h-3.5 w-3.5" aria-hidden />}
                  </span>
                  <span>
                    <span className={`block font-medium ${checked ? 'text-muted line-through' : ''}`}>{s.title}</span>
                    <span className="block text-sm text-ink-soft">{s.detail}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">Saved on this device. No account needed.</p>
      </section>

      <section className="h-fit rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <BellRing className="h-5 w-5" aria-hidden /> Rate Watch
        </h2>
        <p className="mt-1 text-sm text-muted">
          Changes since your audit on {since}. Market baseline then: {formatPct(saved.baselineAtSave)}.
        </p>
        <dl className="mt-5 space-y-4">
          {changes.map((c) => (
            <div key={c.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-ink-soft">{c.label}</dt>
              <dd className="text-right">
                <span className="font-semibold tabular-nums">{c.current}</span>
                <span className={`ml-2 text-sm tabular-nums ${Math.abs(c.delta) < 0.005 ? 'text-muted' : (c.delta < 0) === c.lowerIsBetter ? 'text-save' : 'text-warn'}`}>
                  {signed(Math.abs(c.delta) < 0.005 ? 0 : c.delta, c.fmt)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        {saved.rateShift !== 0 && !now.alreadyCompetitive && (
          <p className="mt-5 rounded-lg bg-save-soft p-3 text-sm text-save">
            Rates moved in your favor. Send your bank an updated negotiation email with the new {formatPct(now.best.apr)} offer.
          </p>
        )}
        <div className="mt-6 border-t border-dashed border-line pt-4">
          <button
            type="button"
            onClick={() => onChange({ ...saved, rateShift: saved.rateShift === 0 ? -0.25 : 0 })}
            className="min-h-11 w-full rounded-lg border border-dashed border-ink-soft px-3 text-sm font-medium hover:bg-canvas"
          >
            {saved.rateShift === 0 ? 'Demo: simulate a market rate change' : 'Demo: reset market rates'}
          </button>
          <p className="mt-2 text-xs text-muted">Demo control. Moves matched lender rates by −0.25% and recalculates.</p>
        </div>
      </section>
    </div>
  );
}
