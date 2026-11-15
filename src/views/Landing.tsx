import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, X } from 'lucide-react';
import AprBars from '../components/AprBars';
import Shell from '../components/layout/Shell';
import Button from '../components/ui/Button';
import { SampleLabel } from '../components/ui/primitives';
import { useCountUp } from '../hooks/useCountUp';
import { AMOUNT_RANGE, baselineApr, computeAudit } from '../lib/finance';
import { cx } from '../lib/cx';
import { formatMoney, formatMoneyCents, formatPct } from '../lib/format';
import { defaultAmount, documentName, goalLabel, goalNoun, marketName, mutualLabel, placeName, rateTerm } from '../lib/market';
import { loadSaved, planSteps } from '../lib/plan';
import { EUROPE_MARKETS, GOALS, US_MARKETS } from '../lib/types';
import type { Goal, Market } from '../lib/types';
import { useApp } from '../state/AppContext';

// The sample bank offer sits this far above the market baseline, a typical first-offer gap.
const SAMPLE_BANK_PREMIUM = 0.25;
const round2 = (n: number) => Math.round(n * 100) / 100;

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

const plural = (label: string) => (label.endsWith('y') ? `${label.slice(0, -1)}ies` : `${label}s`).toLowerCase();

const sampleBankRate = (goal: Goal, market: Market) => round2(baselineApr(goal, market, 'good') + SAMPLE_BANK_PREMIUM);

function SectionTitle({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 id={id} className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-lg text-slate-500">{subtitle}</p>}
    </div>
  );
}

function HeroCard({ market }: { market: Market }) {
  const amount = defaultAmount('mortgage', market);
  const audit = useMemo(
    () => computeAudit({ market, goal: 'mortgage', amount, tier: 'good', bankApr: sampleBankRate('mortgage', market) }),
    [market, amount],
  );
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 shadow-slate-900/5 ring-slate-200 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">
          {formatMoney(amount, market)} {goalNoun('mortgage', market)} in {placeName(market)}
        </p>
        <SampleLabel>Sample data</SampleLabel>
      </div>
      <div className="mt-6">
        <AprBars audit={audit} term={rateTerm(market)} />
      </div>
      <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-800">You keep over the loan</p>
        <p className="tnum mt-0.5 text-3xl font-extrabold tracking-tight text-emerald-700">
          {formatMoney(audit.lifetimeSavings, market)}
        </p>
        <p className="tnum mt-0.5 text-sm text-emerald-800">{formatMoneyCents(audit.monthlyDiff, market)} less every month</p>
      </div>
    </div>
  );
}

function MarketSelect({ id, value, onChange }: { id: string; value: Market; onChange: (m: Market) => void }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as Market)}
        className="h-12 w-full appearance-none rounded-xl bg-white pr-10 pl-3.5 text-base font-medium text-slate-900 ring-1 ring-slate-300 transition outline-none hover:ring-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600"
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
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
    </div>
  );
}

function Calculator({ onStart }: { onStart: (bankRate: number) => void }) {
  const { input, setInput } = useApp();
  const { market, goal, amount } = input;
  const baseline = baselineApr(goal, market, 'good');
  const [bankRate, setBankRate] = useState(() => input.bankApr ?? sampleBankRate(goal, market));
  const term = rateTerm(market);
  const range = AMOUNT_RANGE[goal];

  // A new market or loan type has a different baseline, so restart from a typical first offer.
  useEffect(() => {
    setBankRate(sampleBankRate(goal, market));
  }, [goal, market]);

  const audit = computeAudit({ market, goal, amount, tier: 'good', bankApr: bankRate });
  const shown = useCountUp(audit.lifetimeSavings, 500);
  const rateMin = Math.max(0.5, round2(baseline - 1.5));
  const rateMax = round2(baseline + 4);

  return (
    <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl ring-1 shadow-slate-900/5 ring-slate-200 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6 p-6 sm:p-8">
        <div role="group" aria-label="Loan type" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={goal === g}
              onClick={() => setInput({ goal: g })}
              className={cx(
                'rounded-lg px-2 py-2 text-sm font-semibold transition duration-200',
                goal === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {goalLabel(g, market)}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="calc-market" className="text-sm font-semibold text-slate-900">
            Location
          </label>
          <div className="mt-2">
            <MarketSelect id="calc-market" value={market} onChange={(m) => setInput({ market: m })} />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="calc-amount" className="text-sm font-semibold text-slate-900">
              Loan amount
            </label>
            <span className="tnum text-base font-bold text-slate-900">{formatMoney(amount, market)}</span>
          </div>
          <input
            id="calc-amount"
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={amount}
            aria-valuetext={formatMoney(amount, market)}
            onChange={(e) => setInput({ amount: Number(e.target.value) })}
            className="mt-3 w-full"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="calc-rate" className="text-sm font-semibold text-slate-900">
              Your bank's {term}
            </label>
            <span className="tnum text-base font-bold text-amber-700">{formatPct(bankRate)}</span>
          </div>
          <input
            id="calc-rate"
            type="range"
            min={rateMin}
            max={rateMax}
            step={0.05}
            value={bankRate}
            aria-valuetext={formatPct(bankRate)}
            onChange={(e) => setBankRate(Number(e.target.value))}
            className="mt-3 w-full"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            {marketName(market)} market baseline: {formatPct(baseline)}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-6 bg-slate-50 p-6 sm:p-8" aria-live="polite">
        {audit.alreadyCompetitive ? (
          <div>
            <p className="text-sm font-medium text-slate-500">Your rate</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Already competitive</p>
            <p className="mt-2 text-base text-slate-600">It beats every matched lender. The savings left are in the fees.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-slate-500">You could keep</p>
            <p className="tnum mt-1 text-5xl font-extrabold tracking-tight text-emerald-600 sm:text-6xl">
              {formatMoney(Math.round(shown), market)}
            </p>
            <p className="tnum mt-2 text-base text-slate-600">
              {formatMoneyCents(audit.monthlyDiff, market)} less a month at {formatPct(audit.best.apr)} {term}
            </p>
          </div>
        )}
        <div>
          <Button size="lg" block onClick={() => onStart(bankRate)}>
            See my full audit
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
          <p className="mt-2.5 text-center text-xs text-slate-500">Your numbers carry over. Sample lender profiles.</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { input, setInput, setView, setPane } = useApp();
  const saved = useMemo(() => loadSaved(), []);
  const market = input.market;
  const docName = documentName('mortgage', market);

  const startQuiz = () => setView('quiz');
  const startFromCalculator = (bankRate: number) => {
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
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-28">
          <div>
            <h1 id="hero-title" className="text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Your bank's first offer is rarely its best one.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Compare it with {plural(mutualLabel(market))} and online lenders in 60 seconds. See what you keep before
              you sign.
            </p>
            <div className="mt-9">
              <Button size="xl" onClick={startQuiz}>
                Check my loan offer
                <ArrowRight className="size-5 sm:size-6" aria-hidden="true" />
              </Button>
              <p className="mt-4 text-sm text-slate-500">Free. No sign-up, no credit check.</p>
            </div>
            <p className="mt-10 text-sm text-slate-500">
              For mortgages, car loans and installment plans in the United States, the eurozone and the United Kingdom.
            </p>
          </div>
          <HeroCard market={market} />
        </div>
      </section>

      <section aria-labelledby="proof-title" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 id="proof-title" className="text-center text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Shopping around pays. Most people never do.
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

      <section aria-labelledby="shift-title" className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionTitle id="shift-title" title="Same loan. Very different cost." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 md:gap-6">
          <div className="rounded-3xl bg-slate-100 p-7 md:p-9">
            <h3 className="text-xl font-bold tracking-tight text-slate-700">Taking the first offer</h3>
            <ul className="mt-6 space-y-4">
              {['One quote, no comparison.', 'Fees you never questioned.', 'You find out later you overpaid.'].map((t) => (
                <li key={t} className="flex items-start gap-3 text-base text-slate-600">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <X className="size-4" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-7 shadow-xl ring-2 shadow-emerald-900/10 ring-emerald-500 md:p-9">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Checking with Lendro</h3>
            <ul className="mt-6 space-y-4">
              {['Your offer next to matched lenders.', 'Every junk fee flagged.', 'An email that asks your bank to match.'].map((t) => (
                <li key={t} className="flex items-start gap-3 text-base font-semibold text-slate-900">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-on-accent">
                    <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-title" className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionTitle id="steps-title" title="Three steps. About a minute." />
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {[
              { title: 'Answer 4 questions', text: 'Location, loan, amount and credit range. No personal details.' },
              { title: "See what you'd keep", text: 'Your rate next to matched lenders, monthly and over the loan.' },
              { title: 'Negotiate with real numbers', text: `Scan your ${docName} and send the email we draft for you.` },
            ].map((s, i) => (
              <li key={s.title}>
                <span className="tnum flex size-10 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-on-accent">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-base text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="calc-title" className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionTitle id="calc-title" title="Try it with your numbers." subtitle="Move the sliders. The math runs as you go." />
        <div className="mt-12">
          <Calculator onStart={startFromCalculator} />
        </div>
      </section>

      <section aria-labelledby="final-title" className="bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <h2 id="final-title" className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Before you sign, spend 60 seconds.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
            Will it affect your credit score? No. We never run a credit check or ask for an ID number.
          </p>
          <Button size="xl" className="mt-9" onClick={startQuiz}>
            Check my loan offer
            <ArrowRight className="size-5 sm:size-6" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </Shell>
  );
}
