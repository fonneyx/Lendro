import { CircleCheck, Lock } from 'lucide-react';
import { useMemo } from 'react';
import { buildNegotiationEmail, computeAudit, simulatedLoanEstimateFees } from '../lib/finance';
import { formatPct, formatUSD } from '../lib/format';
import { STATE_NAMES } from '../lib/types';
import { useApp } from '../state/AppContext';

export default function Preview() {
  const { input, setView } = useApp();
  const audit = useMemo(() => computeAudit(input), [input]);
  const email = useMemo(() => buildNegotiationEmail(input, audit, simulatedLoanEstimateFees(input)), [input, audit]);
  const feeFree = audit.previewLenders.filter((l) => l.originationFee === 0).length;
  const maxApr = Math.max(audit.bankApr, audit.best.apr) || 1;
  const bankLabel = input.bankApr === null ? `${STATE_NAMES[input.state]} Baseline APR` : 'Your Bank APR';

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-10 sm:px-6">
      {audit.alreadyCompetitive ? (
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Your AI Audit is Ready: <span className="text-save">You already have a competitive rate</span>
        </h1>
      ) : (
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Your AI Audit is Ready: You Could Save <span className="text-save tabular-nums">{formatUSD(audit.lifetimeSavings)}</span>!
        </h1>
      )}

      <section className="mt-8 rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="space-y-5">
          {[
            { label: bankLabel, apr: audit.bankApr, color: 'bg-warn', text: 'text-warn' },
            { label: 'Best Matched Lender APR', apr: audit.best.apr, color: 'bg-save', text: 'text-save' },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">{bar.label}</span>
                <span className={`font-semibold tabular-nums ${bar.text}`}>{formatPct(bar.apr)}</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-canvas">
                <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${(bar.apr / maxApr) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Your monthly payment</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatUSD(audit.bankMonthly)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Best matched payment</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatUSD(audit.best.monthly)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Difference</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-save">{formatUSD(audit.monthlyDiff)}/mo</p>
          </div>
        </div>
      </section>

      <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-save-soft px-3 py-1.5 text-sm font-medium text-save">
        <CircleCheck className="h-4 w-4" aria-hidden />
        {feeFree} programs found where you qualify with zero hidden origination fees
      </p>

      <section className="relative mt-6 overflow-hidden rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="blur-sm select-none" aria-hidden>
          <p className="text-sm font-semibold">Your matched lenders</p>
          <ul className="mt-3 divide-y divide-line">
            {audit.previewLenders.map((l) => (
              <li key={l.id} className="flex justify-between py-3 text-sm">
                <span>{l.name}</span>
                <span className="tabular-nums">{formatPct(l.apr)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            {input.goal === 'mortgage' ? 'Down-payment assistance you may qualify for' : 'Membership and promo bonus'}:{' '}
            <span className="font-semibold">{formatUSD(audit.assistanceEstimate)}</span>
          </p>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-ink-soft">{email.split('\n').slice(0, 8).join('\n')}</pre>
        </div>
        <div className="absolute inset-0 grid place-items-center bg-surface/40">
          <p className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
            <Lock className="h-4 w-4" aria-hidden /> 4 lenders, assistance and negotiation script locked
          </p>
        </div>
      </section>
      <p className="mt-2 text-xs text-muted">Sample lender profiles</p>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 p-4 backdrop-blur">
        <button
          type="button"
          onClick={() => setView('trial')}
          className="mx-auto block min-h-12 w-full max-w-3xl rounded-lg bg-ink px-4 font-medium text-white shadow-lg hover:bg-ink-soft"
        >
          Unlock Full AI Report & All 4 Lenders ($0 Today) →
        </button>
      </div>
    </div>
  );
}
