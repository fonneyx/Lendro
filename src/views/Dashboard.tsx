import { useEffect, useMemo, useState } from 'react';
import EmailCard from '../components/EmailCard';
import LoanPlan from '../components/LoanPlan';
import PdfScanner from '../components/PdfScanner';
import { AMOUNT_RANGE, computeAudit } from '../lib/finance';
import { formatPct, formatUSD } from '../lib/format';
import type { SavedAudit } from '../lib/plan';
import { loadSaved, newSavedAudit, saveAudit } from '../lib/plan';
import { GOAL_LABELS, STATE_NAMES } from '../lib/types';
import { useApp, type DashboardTab } from '../state/AppContext';

const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'compare', label: 'AI Comparator & PDF Scanner' },
  { id: 'emails', label: 'Automated Day-2 Retention Emails Preview' },
  { id: 'plan', label: 'My Loan Plan' },
];

const DAY = 24 * 60 * 60 * 1000;
const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function Dashboard() {
  const { input, setInput, setView, tab, setTab } = useApp();
  const [saved, setSaved] = useState<SavedAudit>(() => {
    const prev = loadSaved();
    return prev && prev.input.goal === input.goal ? { ...prev, input } : newSavedAudit(input);
  });
  const [amountText, setAmountText] = useState(String(input.amount));
  const [aprText, setAprText] = useState(input.bankApr === null ? '' : String(input.bankApr));

  useEffect(() => {
    setSaved((prev) => (prev.input.goal === input.goal ? { ...prev, input } : newSavedAudit(input)));
    setAmountText(String(input.amount));
  }, [input]);
  useEffect(() => saveAudit(saved), [saved]);

  const audit = useMemo(() => computeAudit(input), [input]);
  const dropped = useMemo(() => computeAudit(input, { rateShift: -0.25 }), [input]);
  const range = AMOUNT_RANGE[input.goal];
  const stateName = STATE_NAMES[input.state];
  const cuBefore = audit.tableLenders.find((l) => l.kind === 'credit_union') ?? audit.best;
  const cuAfter = dropped.tableLenders.find((l) => l.id === cuBefore.id) ?? dropped.best;
  const trialEnd = new Date(new Date(saved.createdAt).getTime() + 3 * DAY);

  const commitApr = (text: string) => {
    const v = Number(text);
    if (text.trim() === '') setInput({ bankApr: null });
    else if (Number.isFinite(v) && v > 0 && v <= 40) setInput({ bankApr: Math.round(v * 100) / 100 });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your loan dashboard</h1>
          <p className="text-sm text-muted">
            {GOAL_LABELS[input.goal]} in {stateName} · trial active until {fmtDate(trialEnd)}
          </p>
        </div>
        <button type="button" onClick={() => setView('quiz')} className="self-start text-sm text-ink-soft underline underline-offset-4 hover:text-ink sm:self-auto">
          Start a new audit
        </button>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            ref={(el) => {
              if (el && tab === t.id) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${tab === t.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'compare' && (
          <div className="space-y-6">
            <section className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 sm:p-6">
              <label className="block">
                <span className="text-sm font-medium">Loan amount</span>
                <div className="mt-2 flex items-center rounded-lg border border-line px-3 focus-within:ring-1 focus-within:ring-ink">
                  <span className="text-muted">$</span>
                  <input
                    inputMode="numeric"
                    value={amountText ? Number(amountText).toLocaleString('en-US') : ''}
                    onChange={(e) => setAmountText(e.target.value.replace(/[^\d]/g, ''))}
                    onBlur={() => setInput({ amount: Number(amountText) || range.default })}
                    onKeyDown={(e) => e.key === 'Enter' && setInput({ amount: Number(amountText) || range.default })}
                    className="min-h-11 w-full bg-transparent px-2 font-semibold tabular-nums outline-none"
                  />
                </div>
                <span className="mt-1 block text-xs text-muted">{formatUSD(range.min)} to {formatUSD(range.max)}</span>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Your bank's APR</span>
                <div className="mt-2 flex items-center rounded-lg border border-line px-3 focus-within:ring-1 focus-within:ring-ink">
                  <input
                    inputMode="decimal"
                    placeholder={`${audit.bankApr.toFixed(2)} (${stateName} baseline)`}
                    value={aprText}
                    onChange={(e) => setAprText(e.target.value.replace(/[^\d.]/g, ''))}
                    onBlur={() => commitApr(aprText)}
                    onKeyDown={(e) => e.key === 'Enter' && commitApr(aprText)}
                    className="min-h-11 w-full bg-transparent font-semibold tabular-nums outline-none placeholder:font-normal"
                  />
                  <span className="text-muted">%</span>
                </div>
                <span className="mt-1 block text-xs text-muted">Leave empty to use the {stateName} baseline</span>
              </label>
            </section>

            <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">Your Primary Bank vs. Top 5 Alternatives</h2>
                <p className="text-sm">
                  {audit.alreadyCompetitive ? (
                    <span className="font-medium text-save">You already have a competitive rate</span>
                  ) : (
                    <>Best option saves <span className="font-semibold tabular-nums text-save">{formatUSD(audit.lifetimeSavings)}</span></>
                  )}
                </p>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3 font-medium">Lender</th>
                      <th className="py-2 pr-3 text-right font-medium">APR</th>
                      <th className="py-2 pr-3 text-right font-medium">Origination fee</th>
                      <th className="py-2 pr-3 text-right font-medium">Monthly payment</th>
                      <th className="py-2 text-right font-medium">Lifetime interest saved</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr className="border-b border-line bg-warn-soft/60">
                      <td className="py-3 pr-3 font-medium">{audit.bankLabel}</td>
                      <td className="py-3 pr-3 text-right text-warn">{formatPct(audit.bankApr)}</td>
                      <td className="py-3 pr-3 text-right">{formatUSD(audit.bankFee)}</td>
                      <td className="py-3 pr-3 text-right">{formatUSD(audit.bankMonthly)}</td>
                      <td className="py-3 text-right text-muted">—</td>
                    </tr>
                    {audit.tableLenders.map((l, i) => (
                      <tr key={l.id} className={`border-b border-line last:border-0 ${i === 0 ? 'bg-save-soft' : ''}`}>
                        <td className="py-3 pr-3">
                          <span className="font-medium">{l.name}</span>
                          <span className="block text-xs text-muted">{l.kind === 'credit_union' ? 'Credit union' : 'Online lender'}</span>
                        </td>
                        <td className="py-3 pr-3 text-right">{formatPct(l.apr)}</td>
                        <td className="py-3 pr-3 text-right">{formatUSD(l.originationFee)}</td>
                        <td className="py-3 pr-3 text-right">{formatUSD(l.monthly)}</td>
                        <td className={`py-3 text-right font-semibold ${l.lifetimeSavings > 0 ? 'text-save' : 'text-muted'}`}>{formatUSD(l.lifetimeSavings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">Sample lender profiles. Savings include interest and origination fees.</p>
            </section>

            <PdfScanner input={input} />
          </div>
        )}

        {tab === 'emails' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <EmailCard
              label="Value alert"
              subject={`Rate Drop Alert: One of your matched credit unions in ${stateName} just cut APR by 0.25%`}
              sentAt={fmtDate(new Date(new Date(saved.createdAt).getTime() + 2 * DAY))}
            >
              <p>Good news on your {formatUSD(input.amount)} {GOAL_LABELS[input.goal].toLowerCase()}.</p>
              <p>
                {cuBefore.name} lowered its rate from <span className="font-semibold text-ink tabular-nums">{formatPct(cuBefore.apr)}</span> to{' '}
                <span className="font-semibold text-save tabular-nums">{formatPct(cuAfter.apr)}</span>. Your monthly payment with them would be{' '}
                <span className="font-semibold text-ink tabular-nums">{formatUSD(cuAfter.monthly)}</span>, and your lifetime savings against {audit.bankLabel.toLowerCase() === 'your bank' ? 'your bank' : `the ${stateName} baseline`} grow to{' '}
                <span className="font-semibold text-save tabular-nums">{formatUSD(cuAfter.lifetimeSavings)}</span>.
              </p>
              <p>Your negotiation email has been updated with the new rate. Open your plan to send it.</p>
            </EmailCard>
            <EmailCard
              label="Transparency email"
              subject="Heads up: Your Lendro 3-day free trial ends tomorrow"
              sentAt={fmtDate(new Date(trialEnd.getTime() - DAY))}
            >
              <p>Your free trial ends on {fmtDate(trialEnd)}. On that day your plan renews at $29/month unless you cancel.</p>
              <p>
                So far Lendro found <span className="font-semibold text-save tabular-nums">{formatUSD(audit.lifetimeSavings)}</span> in possible savings and{' '}
                <span className="font-semibold text-ink tabular-nums">{formatUSD(audit.bankFeesFlaggedEstimate)}</span> in fees worth questioning.
              </p>
              <p>
                Not for you? <span className="font-medium text-ink underline underline-offset-4">Cancel in 1 click</span>. No calls, no forms.
              </p>
            </EmailCard>
            <p className="text-xs text-muted lg:col-span-2">Previews of the emails sent during the trial. Figures update with your inputs.</p>
          </div>
        )}

        {tab === 'plan' && <LoanPlan saved={saved} onChange={setSaved} />}
      </div>
    </div>
  );
}
