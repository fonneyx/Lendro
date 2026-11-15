import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Car, ChevronDown, CreditCard, FileText, House, Search, Sparkles } from 'lucide-react';
import Shell from '../components/layout/Shell';
import Button from '../components/ui/Button';
import ChoiceCard from '../components/ui/ChoiceCard';
import { ProgressBar } from '../components/ui/primitives';
import { AMOUNT_RANGE, baselineApr, clampAmount } from '../lib/finance';
import { currencySymbol, formatMoney, formatPct } from '../lib/format';
import { documentName, goalLabel, goalNoun, isUs, marketName, placeName, rateTerm, regionProfile } from '../lib/market';
import { cx } from '../lib/cx';
import { CREDIT_TIERS, EUROPE_MARKETS, GOALS, US_MARKETS } from '../lib/types';
import type { Goal, Market } from '../lib/types';
import { useApp } from '../state/AppContext';

const TOTAL = 4;
const ADVANCE_MS = 180;
const SCAN_MS = 1500;

const GOAL_ICONS: Record<Goal, typeof House> = { mortgage: House, auto: Car, bnpl: CreditCard };
const TITLES = [
  'Where are you borrowing, and for what?',
  'How much do you need to borrow?',
  'What is your estimated credit score?',
  'Do you already have an offer from a single bank?',
];

function TierBars({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={2 + i * 5.5}
          y={16 - i * 4}
          width="3.5"
          height={6 + i * 4}
          rx="1.5"
          fill="currentColor"
          opacity={i < level ? 1 : 0.25}
        />
      ))}
    </svg>
  );
}

function AmountStep({ onNext }: { onNext: () => void }) {
  const { input, setInput } = useApp();
  const range = AMOUNT_RANGE[input.goal];
  const [text, setText] = useState(input.amount.toLocaleString('en-US'));

  const commit = (raw: string) => {
    const amount = clampAmount(input.goal, Number(raw.replace(/[^\d]/g, '')));
    setInput({ amount });
    setText(amount.toLocaleString('en-US'));
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-9">
      <label htmlFor="amount" className="text-sm font-medium text-slate-500">
        Loan amount
      </label>
      <div className="mt-2 flex items-center gap-1 border-b-2 border-slate-200 pb-2 focus-within:border-blue-600">
        <span className="text-4xl font-extrabold tracking-tight text-slate-400 sm:text-5xl">{currencySymbol(input.market)}</span>
        <input
          id="amount"
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
          className="tnum w-full min-w-0 bg-transparent text-4xl font-extrabold tracking-tight text-slate-900 outline-none sm:text-5xl"
        />
      </div>
      <input
        type="range"
        aria-label="Loan amount slider"
        min={range.min}
        max={range.max}
        step={range.step}
        value={input.amount}
        onChange={(e) => {
          const amount = Number(e.target.value);
          setInput({ amount });
          setText(amount.toLocaleString('en-US'));
        }}
        className="mt-8 w-full"
      />
      <div className="tnum mt-2 flex justify-between text-xs text-slate-500">
        <span>{formatMoney(range.min, input.market)}</span>
        <span>{formatMoney(range.max, input.market)}</span>
      </div>
      <Button size="lg" block className="mt-8" onClick={onNext}>
        Continue
        <ArrowRight className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}

function OfferStep({ onSubmit }: { onSubmit: () => void }) {
  const { input, setInput } = useApp();
  const [hasOffer, setHasOffer] = useState(input.bankApr !== null);
  const [text, setText] = useState(input.bankApr === null ? '' : String(input.bankApr));
  const apr = Number(text);
  const valid = text.trim() !== '' && Number.isFinite(apr) && apr > 0 && apr <= 60;
  const baseline = baselineApr(input.goal, input.market, input.tier);
  const term = rateTerm(input.market);

  return (
    <div className="space-y-4">
      <ChoiceCard
        selected={hasOffer}
        onSelect={() => setHasOffer(true)}
        lead={<FileText className="size-6" aria-hidden="true" />}
        title="Yes, I have an offer"
        detail={`Compare the ${term} your bank quoted against the market`}
      />
      {hasOffer && (
        <form
          className="animate-rise rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            setInput({ bankApr: apr });
            onSubmit();
          }}
        >
          <label htmlFor="apr" className="text-sm font-medium text-slate-700">
            {term} on your bank offer
          </label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-14 flex-1 items-center rounded-xl bg-white px-4 ring-1 ring-slate-300 focus-within:ring-2 focus-within:ring-blue-600">
              <input
                id="apr"
                inputMode="decimal"
                autoFocus
                placeholder={baseline.toFixed(2)}
                value={text}
                onChange={(e) => setText(e.target.value.replace(/[^\d.]/g, ''))}
                aria-describedby="apr-hint"
                className="tnum w-full min-w-0 bg-transparent text-xl font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
              />
              <span className="text-xl font-bold text-slate-400">%</span>
            </div>
            <Button type="submit" size="lg" disabled={!valid}>
              See my audit
            </Button>
          </div>
          <p id="apr-hint" className="mt-2 text-sm text-slate-500">
            {text.trim() !== '' && !valid
              ? `Enter the ${term} as a number between 0.1 and 60, for example ${baseline.toFixed(2)}.`
              : `It is the percentage on your ${documentName(input.goal, input.market)} or offer letter.`}
          </p>
        </form>
      )}
      <ChoiceCard
        selected={false}
        onSelect={() => {
          setInput({ bankApr: null });
          onSubmit();
        }}
        lead={<Search className="size-6" aria-hidden="true" />}
        title="No, just exploring"
        detail={`We will compare against the ${marketName(input.market)} baseline of ${formatPct(baseline)}`}
      />
    </div>
  );
}

function Scanning() {
  const { input } = useApp();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center" role="status">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-on-accent shadow-xl shadow-blue-600/30">
        <Sparkles className="size-8 animate-pulse" aria-hidden="true" />
      </span>
      <p className="mt-8 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        Comparing lender profiles in {placeName(input.market)} for your {formatMoney(input.amount, input.market)}{' '}
        {goalNoun(input.goal, input.market)}
      </p>
      <div className="mt-8 h-2 w-full max-w-sm overflow-hidden rounded-full bg-slate-200">
        <div className="animate-sweep h-full origin-left rounded-full bg-blue-600" />
      </div>
    </div>
  );
}

export default function Quiz() {
  const { input, setInput, setView } = useApp();
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!scanning) return;
    const timer = setTimeout(() => setView('preview'), SCAN_MS);
    return () => clearTimeout(timer);
  }, [scanning, setView]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step, scanning]);

  const next = () => setStep((s) => Math.min(TOTAL - 1, s + 1));
  const pick = (patch: Parameters<typeof setInput>[0]) => {
    setInput(patch);
    setTimeout(next, ADVANCE_MS);
  };

  if (scanning) {
    return (
      <Shell>
        <Scanning />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => (step === 0 ? setView('landing') : setStep(step - 1))}
            className="flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </button>
          <ProgressBar value={step + 1} max={TOTAL} label="Quiz progress" />
          <span className="tnum shrink-0 text-sm font-medium text-slate-500">
            Step {step + 1} of {TOTAL}
          </span>
        </div>

        <div key={step} className="animate-rise mt-10 sm:mt-14">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">{TITLES[step]}</h1>

          <div className="mt-8 sm:mt-10">
            {step === 0 && (
              <div>
                <label htmlFor="market" className="text-sm font-semibold text-slate-900">
                  Location
                </label>
                <div className="relative mt-2">
                  <select
                    id="market"
                    value={input.market}
                    onChange={(e) => setInput({ market: e.target.value as Market })}
                    className="h-14 w-full appearance-none rounded-2xl bg-white pr-12 pl-4 text-base font-medium text-slate-900 shadow-sm ring-1 ring-slate-300 transition duration-200 outline-none hover:ring-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600"
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
                  <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                </div>

                <fieldset className="mt-7">
                  <legend className="text-sm font-semibold text-slate-900">Loan goal</legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {GOALS.map((g) => {
                      const Icon = GOAL_ICONS[g];
                      const selected = input.goal === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setInput({ goal: g })}
                          className={cx(
                            'flex items-center gap-3 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 transition duration-200 ease-out hover:ring-2 hover:ring-blue-600 sm:flex-col sm:items-start sm:gap-5',
                            selected ? 'ring-2 ring-blue-600' : 'ring-slate-200',
                          )}
                        >
                          <Icon className={cx('size-6', selected ? 'text-blue-600' : 'text-slate-500')} aria-hidden="true" />
                          <span className="text-base font-bold tracking-tight text-slate-900">{goalLabel(g, input.market)}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <Button size="lg" block className="mt-8" onClick={next}>
                  Continue
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Button>
              </div>
            )}

            {step === 1 && <AmountStep key={`${input.goal}-${input.market}`} onNext={next} />}

            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {CREDIT_TIERS.map((t, i) => {
                  const tier = regionProfile(input.market).tiers[t];
                  const us = isUs(input.market);
                  return (
                    <ChoiceCard
                      key={t}
                      selected={input.tier === t}
                      onSelect={() => pick({ tier: t })}
                      lead={<TierBars level={CREDIT_TIERS.length - i} />}
                      title={us ? tier.hint : tier.name}
                      detail={us ? tier.name : tier.hint}
                    />
                  );
                })}
              </div>
            )}

            {step === 3 && <OfferStep onSubmit={() => setScanning(true)} />}
          </div>
        </div>
      </div>
    </Shell>
  );
}
