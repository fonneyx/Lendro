import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BellRing, Check, ChevronDown, FileSearch, Mail } from 'lucide-react';
import Shell from '../components/layout/Shell';
import Button from '../components/ui/Button';
import { useCountUp } from '../hooks/useCountUp';
import { AMOUNT_RANGE, baselineApr, computeAudit } from '../lib/finance';
import { cx } from '../lib/cx';
import { formatMoney, formatMoneyCents, formatPct } from '../lib/format';
import { documentName, goalLabel, goalNoun, marketName, rateTerm, regionProfile } from '../lib/market';
import { loadSaved, planSteps } from '../lib/plan';
import { EUROPE_MARKETS, GOALS, US_MARKETS } from '../lib/types';
import type { Audit, Goal, Market } from '../lib/types';
import { useApp } from '../state/AppContext';

// The calculator starts with a bank offer this far above the market baseline, a typical first-offer gap.
const SAMPLE_BANK_PREMIUM = 0.25;
const round2 = (n: number) => Math.round(n * 100) / 100;
const sampleBankRate = (goal: Goal, market: Market) => round2(baselineApr(goal, market, 'good') + SAMPLE_BANK_PREMIUM);

const SELECT =
  'h-11 w-full appearance-none rounded-xl bg-white pr-9 pl-3 text-sm font-medium text-slate-900 ring-1 ring-slate-300 transition outline-none hover:ring-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600';

const PROOF = [
  {
    figure: '77%',
    text: 'of US mortgage borrowers apply with only one lender.',
    source: 'CFPB, 2015',
    href: 'https://files.consumerfinance.gov/f/201501_cfpb_factsheet-the-consumer-mortgage-shopping-perspective.pdf',
  },
  {
    figure: '$1,500',
    text: 'saved on average with just one extra mortgage quote.',
    source: 'Freddie Mac, 2018',
    href: 'https://www.freddiemac.com/fmac-resources/research/pdf/201804-Insight.pdf',
  },
  {
    figure: '£550',
    text: 'a year overpaid by 3 in 10 UK borrowers who missed a cheaper deal.',
    source: 'FCA, 2018',
    href: 'https://www.fca.org.uk/publications/occasional-papers/no-33-choices-dominated-mortgage-products-uk-consumers',
  },
];

const PRO_FEATURES = [
  'Rate Watch on your saved offer',
  'Unlimited offer scans and fee checks',
  'Negotiation emails written with your numbers',
  'Your loan plan, saved step by step',
];

function Chevron() {
  return (
    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
  );
}

interface CheckProps {
  bankRate: number;
  setBankRate: (rate: number) => void;
  audit: Audit;
  onStart: () => void;
}

function OfferCheck({ bankRate, setBankRate, audit, onStart }: CheckProps) {
  const { input, setInput } = useApp();
  const { market, goal, amount } = input;
  const baseline = baselineApr(goal, market, 'good');
  const term = rateTerm(market);
  const range = AMOUNT_RANGE[goal];
  const shown = useCountUp(audit.lifetimeSavings, 500);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 shadow-slate-900/5 ring-slate-200 sm:p-7">
      <p className="text-base font-bold tracking-tight text-slate-900">What your bank's offer costs you</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="relative">
          <label htmlFor="check-goal" className="sr-only">
            Loan type
          </label>
          <select id="check-goal" value={goal} onChange={(e) => setInput({ goal: e.target.value as Goal })} className={SELECT}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {goalLabel(g, market)}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
        <div className="relative">
          <label htmlFor="check-market" className="sr-only">
            Location
          </label>
          <select
            id="check-market"
            value={market}
            onChange={(e) => setInput({ market: e.target.value as Market })}
            className={SELECT}
          >
            <optgroup label="United States">
              {US_MARKETS.map((m) => (
                <option key={m} value={m}>
                  {marketName(m)}
                </option>
              ))}
            </optgroup>
            <optgroup label="Europe">
              {EUROPE_MARKETS.map((m) => (
                <option key={m} value={m}>
                  {marketName(m)}
                </option>
              ))}
            </optgroup>
          </select>
          <Chevron />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="check-amount" className="text-sm font-medium text-slate-600">
            Loan amount
          </label>
          <span className="tnum text-base font-bold text-slate-900">{formatMoney(amount, market)}</span>
        </div>
        <input
          id="check-amount"
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={amount}
          aria-valuetext={formatMoney(amount, market)}
          onChange={(e) => setInput({ amount: Number(e.target.value) })}
          className="mt-2 w-full"
        />
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="check-rate" className="text-sm font-medium text-slate-600">
            Your bank's {term}
          </label>
          <span className="tnum text-base font-bold text-amber-700">{formatPct(bankRate)}</span>
        </div>
        <input
          id="check-rate"
          type="range"
          min={Math.max(0.5, round2(baseline - 1.5))}
          max={round2(baseline + 4)}
          step={0.05}
          value={bankRate}
          aria-valuetext={formatPct(bankRate)}
          onChange={(e) => setBankRate(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </div>

      <div className="mt-6 rounded-2xl bg-emerald-50 p-4" aria-live="polite">
        {audit.alreadyCompetitive ? (
          <>
            <p className="text-lg font-bold text-emerald-800">Your rate is already competitive.</p>
            <p className="mt-0.5 text-sm text-emerald-800">The money left is in the fees. We check those too.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-emerald-800">You could keep</p>
            <p className="tnum text-4xl font-extrabold tracking-tight text-emerald-700">{formatMoney(Math.round(shown), market)}</p>
            <p className="tnum mt-0.5 text-sm text-emerald-800">
              {formatMoneyCents(audit.monthlyDiff, market)} a month at {formatPct(audit.best.apr)} {term}
            </p>
          </>
        )}
      </div>

      <Button size="lg" block className="mt-4" onClick={onStart}>
        See my full audit
        <ArrowRight className="size-5" aria-hidden="true" />
      </Button>
      <p className="mt-2.5 text-center text-xs text-slate-500">Estimate from sample lender profiles.</p>
    </div>
  );
}

export default function Landing() {
  const { input, setInput, setView, setPane } = useApp();
  const saved = useMemo(() => loadSaved(), []);
  const { market, goal, amount } = input;
  const [bankRate, setBankRate] = useState(() => input.bankApr ?? sampleBankRate(goal, market));

  // A new market or loan type has a different baseline, so restart from a typical first offer.
  useEffect(() => {
    setBankRate(sampleBankRate(goal, market));
  }, [goal, market]);

  const audit = computeAudit({ market, goal, amount, tier: 'good', bankApr: bankRate });
  const price = formatMoney(regionProfile(market).monthlyPrice, market);

  const startQuiz = () => setView('quiz');
  const startWithNumbers = () => {
    setInput({ bankApr: bankRate });
    setView('quiz');
  };
  const resume = () => {
    if (!saved) return;
    setInput(saved.input);
    setPane('plan');
    setView('dashboard');
  };

  const steps = saved ? planSteps(saved.input.goal, saved.input.market) : [];
  const done = saved ? steps.filter((s) => saved.completedSteps.includes(s.id)).length : 0;

  const how = [
    { icon: FileSearch, title: 'Check your offer', text: 'Four questions, about 60 seconds. No personal details.' },
    { icon: Mail, title: 'Claim the better rate', text: `Scan your ${documentName(goal, market)}. Send the email we write for you.` },
    { icon: BellRing, title: 'Keep it low', text: 'Rate Watch keeps your saved offer next to the market.' },
  ];

  return (
    <Shell tone="white" navAction={<Button size="sm" onClick={startQuiz}>Check my offer</Button>}>
      {saved && (
        <div className="border-b border-blue-100 bg-blue-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Welcome back.</span> Your{' '}
              {formatMoney(saved.input.amount, saved.input.market)} {goalNoun(saved.input.goal, saved.input.market)} plan:{' '}
              <span className="tnum">
                {done} of {steps.length}
              </span>{' '}
              steps done.
            </p>
            <button
              type="button"
              onClick={resume}
              className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Continue your plan
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <section aria-labelledby="hero-title" className="bg-linear-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-24">
          <div>
            <h1 id="hero-title" className="text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Your bank's first offer is rarely its best one.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Lendro shows what a better rate is worth, helps you ask for it, and keeps watching.
            </p>
            <div className="mt-9">
              <Button size="xl" onClick={startQuiz}>
                Check my loan offer
                <ArrowRight className="size-5 sm:size-6" aria-hidden="true" />
              </Button>
              <p className="mt-4 text-sm text-slate-500">Free check. No sign-up, no credit check.</p>
            </div>
          </div>
          <OfferCheck bankRate={bankRate} setBankRate={setBankRate} audit={audit} onStart={startWithNumbers} />
        </div>
      </section>

      <section aria-labelledby="proof-title" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="proof-title" className="text-center text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Most people never shop around. It costs them.
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {PROOF.map((p) => (
              <li key={p.figure} className="text-center">
                <p className="tnum text-4xl font-extrabold tracking-tight text-slate-900">{p.figure}</p>
                <p className="mx-auto mt-2 max-w-xs text-base text-slate-600">{p.text}</p>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block rounded text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                >
                  Source: {p.source}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="how-title" className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 id="how-title" className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Check it. Claim it. Keep it low.
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {how.map((s, i) => (
            <li key={s.title} className="text-center md:text-left">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 md:mx-0">
                <s.icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
                <span className="tnum text-slate-400">{i + 1}.</span> {s.title}
              </h3>
              <p className="mt-1.5 text-base text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pro-title" className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="pro-title" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              One plan. It pays for itself.
            </h2>
            <p className="mt-3 text-lg text-slate-500">The check is free. Pro keeps your rate low before you sign, and after.</p>
          </div>

          <div className="mx-auto mt-12 max-w-md rounded-3xl bg-white p-7 shadow-xl ring-2 shadow-blue-900/10 ring-blue-600 sm:p-9">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Lendro Pro</h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">3 days free</span>
            </div>
            <p className="mt-4">
              <span className="tnum text-5xl font-extrabold tracking-tight text-slate-900">{price}</span>
              <span className="text-base font-medium text-slate-500"> /month</span>
            </p>

            <p
              className={cx(
                'mt-4 rounded-xl p-3 text-sm',
                audit.alreadyCompetitive ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-800',
              )}
            >
              {audit.alreadyCompetitive ? (
                'Rate Watch tells you the day a lender beats your rate.'
              ) : (
                <>
                  Your estimate above: <strong className="tnum">{formatMoneyCents(audit.monthlyDiff, market)}</strong> a month
                  back. Pro costs {price}.
                </>
              )}
            </p>

            <ul className="mt-6 space-y-3">
              {PRO_FEATURES.map((t) => (
                <li key={t} className="flex items-start gap-3 text-base text-slate-700">
                  <Check className="mt-0.5 size-5 shrink-0 text-emerald-600" strokeWidth={3} aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>

            <Button size="lg" block className="mt-8" onClick={startQuiz}>
              Start with a free check
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
            <p className="mt-3 text-center text-xs text-slate-500">No credit check. No ID number. Cancel in 1 click.</p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
