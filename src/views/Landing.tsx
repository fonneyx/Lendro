import { ArrowRight, FileSearch, Landmark, PhoneOff } from 'lucide-react';
import { useMemo } from 'react';
import { computeAudit } from '../lib/finance';
import { formatPct, formatUSD } from '../lib/format';
import { loadSaved, planSteps } from '../lib/plan';
import type { QuizInput } from '../lib/types';
import { GOAL_LABELS, STATE_NAMES } from '../lib/types';
import { useApp } from '../state/AppContext';

const SAMPLE: QuizInput = { state: 'TX', goal: 'mortgage', amount: 350_000, tier: 'good', bankApr: 7.1 };

const VALUE_CARDS = [
  { icon: Landmark, title: '100+ Credit Unions & Lenders Scanned', text: 'Your bank is compared with credit unions and online lenders in your state.' },
  { icon: PhoneOff, title: 'Zero Spam Calls or Hard Pulls', text: 'No phone number, no SSN, no credit check. Nobody calls you.' },
  { icon: FileSearch, title: 'Junk Fee & Loan Estimate Scanner', text: 'Upload your Loan Estimate and see which fees to remove before you sign.' },
];

export default function Landing() {
  const { setView, setInput, setTab } = useApp();
  const saved = useMemo(() => loadSaved(), []);
  const sample = useMemo(() => computeAudit(SAMPLE), []);

  const continuePlan = () => {
    if (!saved) return;
    setInput(saved.input);
    setTab('plan');
    setView('dashboard');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      {saved && (
        <div className="mb-8 flex flex-col gap-3 rounded-xl border border-save/30 bg-save-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            <span className="font-semibold">Welcome back — continue your plan.</span>{' '}
            Your {formatUSD(saved.input.amount)} {GOAL_LABELS[saved.input.goal].toLowerCase()} plan in{' '}
            {STATE_NAMES[saved.input.state]}: {saved.completedSteps.length} of {planSteps(saved.input.goal).length} steps done.
          </p>
          <button
            type="button"
            onClick={continuePlan}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-save px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Open my plan <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
        <section>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-[40px] sm:leading-[48px]">
            One bank only cares about its own profit. Let AI check 100+ US loan programs for you in 60 seconds
          </h1>
          <p className="mt-5 text-base leading-7 text-ink-soft sm:text-lg">
            80% of buyers overpay by $4,800+ simply by accepting the first offer from their primary bank.
          </p>
          <button
            type="button"
            onClick={() => setView('quiz')}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-6 text-base font-medium text-white hover:bg-ink-soft sm:w-auto"
          >
            Run Free AI Rate Check →
          </button>
          <p className="mt-3 text-sm text-muted">Mortgages, auto loans and installment plans in TX, CA, NY, FL and IL.</p>
        </section>

        <aside className="rounded-xl border border-line bg-surface p-5 sm:p-6" aria-label="Sample audit">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Example audit</p>
            <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-muted">Sample data</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatUSD(SAMPLE.amount)} mortgage in Texas, 680–739 credit, bank offer {formatPct(SAMPLE.bankApr ?? 0)}
          </p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Bank offer</dt>
              <dd className="font-medium tabular-nums text-warn">{formatPct(sample.bankApr)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Best matched lender</dt>
              <dd className="font-medium tabular-nums text-save">{formatPct(sample.best.apr)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Lower monthly payment</dt>
              <dd className="font-medium tabular-nums">{formatUSD(sample.monthlyDiff)}/mo</dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs uppercase tracking-wide text-muted">Saved over the life of the loan</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-save">{formatUSD(sample.lifetimeSavings)}</p>
          </div>
        </aside>
      </div>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {VALUE_CARDS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-line bg-surface p-5">
            <Icon className="h-5 w-5 text-ink" aria-hidden />
            <h2 className="mt-3 text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-ink-soft">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
