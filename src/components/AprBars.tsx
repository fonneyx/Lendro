import { formatPct } from '../lib/format';
import type { Audit } from '../lib/types';
import { cx } from '../lib/cx';

function Bar({ label, apr, max, tone }: { label: string; apr: number; max: number; tone: 'bank' | 'best' | 'neutral' }) {
  const width = max > 0 ? Math.max(8, (apr / max) * 100) : 8;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span
          className={cx(
            'tnum text-2xl font-extrabold tracking-tight',
            tone === 'best' ? 'text-emerald-600' : tone === 'bank' ? 'text-amber-700' : 'text-slate-900',
          )}
        >
          {formatPct(apr)}
        </span>
      </div>
      <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cx(
            'h-full rounded-full transition-[width] duration-700 ease-(--ease-out-expo)',
            tone === 'best' ? 'bg-emerald-500' : tone === 'bank' ? 'bg-amber-400' : 'bg-slate-400',
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function AprBars({ audit, term }: { audit: Audit; term: string }) {
  const max = Math.max(audit.bankApr, audit.best.apr);
  return (
    <div className="space-y-5">
      <Bar label={`${audit.bankLabel} ${term}`} apr={audit.bankApr} max={max} tone={audit.alreadyCompetitive ? 'neutral' : 'bank'} />
      <Bar label={`Best matched lender ${term}`} apr={audit.best.apr} max={max} tone={audit.alreadyCompetitive ? 'neutral' : 'best'} />
    </div>
  );
}
