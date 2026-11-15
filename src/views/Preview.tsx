import { useMemo } from 'react';
import { ArrowRight, BadgeCheck, Lock } from 'lucide-react';
import AprBars from '../components/AprBars';
import Shell from '../components/layout/Shell';
import Button from '../components/ui/Button';
import { SampleLabel } from '../components/ui/primitives';
import { buildNegotiationEmail, computeAudit, simulatedLoanEstimateFees } from '../lib/finance';
import { formatMoney, formatMoneyCents, formatPct } from '../lib/format';
import { documentName, feeTerm, goalNoun, marketName, placeName, rateTerm } from '../lib/market';
import { useCountUp } from '../hooks/useCountUp';
import { useApp } from '../state/AppContext';

export default function Preview() {
  const { input, setView } = useApp();
  const audit = useMemo(() => computeAudit(input), [input]);
  const savings = useCountUp(audit.lifetimeSavings, 1100);
  const email = useMemo(
    () => buildNegotiationEmail(input, audit, simulatedLoanEstimateFees(input)),
    [input, audit],
  );
  const zeroFee = audit.tableLenders.filter((l) => l.originationFee === 0).length;
  const goal = goalNoun(input.goal, input.market);
  const place = marketName(input.market);
  const term = rateTerm(input.market);
  const money = (n: number) => formatMoney(n, input.market);
  const cents = (n: number) => formatMoneyCents(n, input.market);

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 pt-10 pb-32 sm:px-6 sm:pt-16 lg:pb-24">
        <p className="text-lg font-semibold text-slate-500">Your loan audit is ready</p>

        {audit.alreadyCompetitive ? (
          <h1 className="mt-3 text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            You already have a competitive rate.
          </h1>
        ) : (
          <h1 className="mt-3 text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            You could save up to{' '}
            <span className="tnum block text-6xl text-emerald-600 sm:text-8xl">{money(Math.round(savings))}</span>
          </h1>
        )}
        <p className="mt-4 max-w-2xl text-lg text-slate-500">
          {audit.alreadyCompetitive
            ? `Your ${formatPct(audit.bankApr)} ${term} beats every matched lender. The savings left are in the fees on your ${documentName(input.goal, input.market)}.`
            : `in interest and fees over the life of your ${money(input.amount)} ${goal} in ${placeName(input.market)}, compared with ${audit.bankLabel === 'Your Bank' ? 'your bank offer' : `the ${place} baseline`}.`}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <AprBars audit={audit} term={term} />
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <div>
              <p className="text-sm font-medium text-slate-500">Monthly payment difference</p>
              <p className="tnum mt-1 text-4xl font-extrabold tracking-tight text-slate-900">
                {cents(audit.monthlyDiff)}
              </p>
              <p className="tnum mt-1 text-sm text-slate-500">
                {cents(audit.bankMonthly)} now, {cents(audit.best.monthly)} with the best match
              </p>
            </div>
            {zeroFee > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                <BadgeCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {zeroFee} sample lender profiles with no {feeTerm(input.market)}
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div aria-hidden="true" inert className="p-6 select-none sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight">Your bank vs. top {audit.tableLenders.length} alternatives</h2>
              <SampleLabel />
            </div>
            <ul className="mt-5 divide-y divide-slate-100">
              {audit.tableLenders.map((l) => (
                <li key={l.id} className="tnum flex items-center justify-between gap-4 py-3.5">
                  <span className="font-semibold text-slate-900">{l.name}</span>
                  <span className="flex gap-6 text-slate-600">
                    <span>{formatPct(l.apr)}</span>
                    <span className="hidden sm:inline">{money(l.originationFee)} fee</span>
                    <span className="font-semibold text-emerald-700">{money(l.lifetimeSavings)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">Avoidable fees on a typical estimate</p>
                <p className="tnum mt-1 text-2xl font-extrabold tracking-tight text-amber-700">
                  {money(audit.bankFeesFlaggedEstimate)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">Negotiation email</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">{email.split('\n').slice(4).join(' ')}</p>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-white/55 p-4 backdrop-blur-md">
            <div className="hidden w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-xl ring-1 shadow-black/10 ring-slate-200 lg:block">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-on-accent">
                <Lock className="size-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Unlock Full Report</h2>
              <p className="mt-2 text-sm text-slate-500">
                All {audit.tableLenders.length} matched lenders, the fee scanner and your negotiation email. $0 today.
              </p>
              <Button size="lg" block className="mt-5" onClick={() => setView('trial')}>
                Unlock Full Report
                <ArrowRight className="size-5" aria-hidden="true" />
              </Button>
            </div>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 lg:hidden">
              <Lock className="size-6" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 p-3 backdrop-blur-md lg:hidden">
        <Button size="lg" block onClick={() => setView('trial')}>
          <Lock className="size-5" aria-hidden="true" />
          Unlock Full Report ($0 today)
        </Button>
      </div>
    </Shell>
  );
}
