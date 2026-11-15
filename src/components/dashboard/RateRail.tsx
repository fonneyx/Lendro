import { useEffect, useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { Panel, SampleLabel } from '../ui/primitives';
import { AMOUNT_RANGE, baselineApr, clampAmount } from '../../lib/finance';
import { formatPct, formatUSD, formatUSDCents } from '../../lib/format';
import { cx } from '../../lib/cx';
import type { Audit, QuizInput } from '../../lib/types';

interface Props {
  input: QuizInput;
  setInput: (patch: Partial<QuizInput>) => void;
  base: Audit;
  audit: Audit;
  rateShift: number;
  createdAt: string;
  onToggleShift: () => void;
}

const FIELD =
  'flex h-11 items-center gap-1 rounded-xl bg-white px-3 ring-1 ring-slate-300 focus-within:ring-2 focus-within:ring-blue-600';

function InputEditor({ input, setInput }: Pick<Props, 'input' | 'setInput'>) {
  const [amount, setAmount] = useState(input.amount.toLocaleString('en-US'));
  const [apr, setApr] = useState(input.bankApr === null ? '' : String(input.bankApr));
  const range = AMOUNT_RANGE[input.goal];
  const baseline = baselineApr(input.goal, input.state, input.tier);

  useEffect(() => {
    setAmount(input.amount.toLocaleString('en-US'));
  }, [input.amount]);

  const aprNumber = Number(apr);
  const aprInvalid = apr.trim() !== '' && !(Number.isFinite(aprNumber) && aprNumber > 0 && aprNumber <= 60);

  return (
    <Panel>
      <h2 className="text-lg font-bold tracking-tight text-slate-900">Your numbers</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="rail-amount" className="text-sm font-medium text-slate-700">
            Loan amount
          </label>
          <div className={cx(FIELD, 'mt-1.5')}>
            <span className="font-semibold text-slate-400">$</span>
            <input
              id="rail-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={(e) => setInput({ amount: clampAmount(input.goal, Number(e.target.value.replace(/[^\d]/g, ''))) })}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="tnum w-full min-w-0 bg-transparent font-semibold text-slate-900 outline-none"
            />
          </div>
          <p className="tnum mt-1 text-xs text-slate-500">
            {formatUSD(range.min)} to {formatUSD(range.max)}
          </p>
        </div>
        <div>
          <label htmlFor="rail-apr" className="text-sm font-medium text-slate-700">
            Your bank's APR
          </label>
          <div className={cx(FIELD, 'mt-1.5')}>
            <input
              id="rail-apr"
              inputMode="decimal"
              placeholder={baseline.toFixed(2)}
              value={apr}
              aria-describedby="rail-apr-hint"
              onChange={(e) => {
                const text = e.target.value.replace(/[^\d.]/g, '');
                setApr(text);
                const n = Number(text);
                if (text.trim() === '') setInput({ bankApr: null });
                else if (Number.isFinite(n) && n > 0 && n <= 60) setInput({ bankApr: n });
              }}
              className="tnum w-full min-w-0 bg-transparent font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
            />
            <span className="font-semibold text-slate-400">%</span>
          </div>
          <p id="rail-apr-hint" className={cx('mt-1 text-xs', aprInvalid ? 'font-medium text-amber-800' : 'text-slate-500')}>
            {aprInvalid ? 'Enter a number between 0.1 and 60.' : 'Leave empty to compare against the state baseline.'}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function Delta({ label, before, after, lowerIsBetter }: { label: string; before: string; after: string; lowerIsBetter: boolean }) {
  const changed = before !== after;
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="tnum text-right text-sm">
        {changed && <span className="mr-2 text-slate-400 line-through">{before}</span>}
        <span className={cx('font-semibold', changed ? 'text-emerald-700' : 'text-slate-900')}>{after}</span>
        {changed && <span className="sr-only">{lowerIsBetter ? ' (lower)' : ' (higher)'}</span>}
      </dd>
    </div>
  );
}

export default function RateRail({ input, setInput, base, audit, rateShift, createdAt, onToggleShift }: Props) {
  const since = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const shifted = rateShift !== 0;

  return (
    <div className="space-y-4">
      <InputEditor key={input.goal} input={input} setInput={setInput} />

      <Panel>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Rate Watch</h2>
          <TrendingDown className={cx('size-5', shifted ? 'text-emerald-600' : 'text-slate-300')} aria-hidden="true" />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {shifted
            ? `Matched lenders moved ${rateShift.toFixed(2)} points since ${since}.`
            : `No change in matched rates since ${since}.`}
        </p>
        <dl className="mt-3 divide-y divide-slate-100">
          <Delta label="Best APR" before={formatPct(base.best.apr)} after={formatPct(audit.best.apr)} lowerIsBetter />
          <Delta
            label="Best monthly"
            before={formatUSDCents(base.best.monthly)}
            after={formatUSDCents(audit.best.monthly)}
            lowerIsBetter
          />
          <Delta
            label="Lifetime savings"
            before={formatUSD(base.lifetimeSavings)}
            after={formatUSD(audit.lifetimeSavings)}
            lowerIsBetter={false}
          />
        </dl>
        <button
          type="button"
          aria-pressed={shifted}
          onClick={onToggleShift}
          className={cx(
            'mt-4 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold ring-1 transition duration-200',
            shifted ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-white text-slate-700 ring-slate-300 hover:ring-slate-400',
          )}
        >
          Demo: simulate a market rate change
          <span className="block text-xs font-normal text-slate-500">
            {shifted ? 'On. Select again to reset.' : 'Drops matched lender rates by 0.25 points.'}
          </span>
        </button>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Matched rates</h2>
          <SampleLabel />
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {audit.tableLenders.map((l, i) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900">{l.name}</span>
                <span className="tnum block text-xs text-slate-500">{formatUSDCents(l.monthly)} a month</span>
              </span>
              <span className={cx('tnum shrink-0 text-base font-extrabold tracking-tight', i === 0 ? 'text-emerald-600' : 'text-slate-900')}>
                {formatPct(l.apr)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
