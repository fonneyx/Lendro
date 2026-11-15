import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BellRing, FileSearch, Mail, Sparkles } from 'lucide-react';
import ComparisonSection from '../components/landing/ComparisonSection';
import Intro from '../components/landing/Intro';
import Shell from '../components/layout/Shell';
import Button from '../components/ui/Button';
import FinancePattern from '../components/ui/FinancePattern';
import { formatMoney } from '../lib/format';
import { documentName, goalNoun } from '../lib/market';
import { loadSaved, planSteps } from '../lib/plan';
import { useApp } from '../state/AppContext';

// Kept in memory only: the intro plays on every page load, but not when coming back to the
// landing page from another screen during the same load.
let introPlayed = false;

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

export default function Landing() {
  const { input, setInput, setView, setPane } = useApp();
  const saved = useMemo(() => loadSaved(), []);
  const { market, goal } = input;

  const [showIntro, setShowIntro] = useState(() => !introPlayed);
  const closeIntro = () => {
    introPlayed = true;
    setShowIntro(false);
  };

  const startQuiz = () => setView('quiz');
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

  const page = (
    <Shell tone="white" navAction={<Button size="sm" onClick={startQuiz}>Check my offer</Button>}>
      {saved && (
        <div className="border-b border-blue-100 bg-blue-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Welcome back.</span> Your{' '}
              {formatMoney(saved.input.amount, saved.input.market)} {goalNoun(saved.input.goal, saved.input.market)} plan
              <span className="sr-only">
                : {done} of {steps.length} steps done.
              </span>
              <span className="ml-3 inline-flex items-center gap-1.5 align-middle" aria-hidden="true">
                {steps.map((s, i) => (
                  <span key={s.id} title={s.title} className="relative size-3 rounded-full ring-1 ring-slate-400 ring-inset">
                    {saved.completedSteps.includes(s.id) && (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-blue-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 420, damping: 18 }}
                      />
                    )}
                  </span>
                ))}
              </span>
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

      <div className="relative overflow-hidden bg-linear-to-b from-slate-50 to-white pt-14 sm:pt-20">
        <FinancePattern className="mask-b-from-60%" />
        <div className="relative z-10">
          <ComparisonSection />
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-2xl leading-snug font-bold tracking-tight text-slate-900 sm:text-3xl">
            Lendro helps you to find the most favorable mortgage terms.
          </p>
          <div className="mt-6 space-y-5 text-left text-lg leading-relaxed text-slate-600">
            <p>
              A large portion of the American population loses money due to hidden mortgage fees. There are many free
              consultations available, but as a rule, they are all tied to their own banks, and no one will tell you
              the most advantageous option.
            </p>
            <p>
              Our app helps you find the best terms for you and ensures you don't miss out on financial opportunities
              from other banks, thereby saving you from 17% to 23% of your savings.
            </p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <Button size="xl" onClick={startQuiz}>
            <Sparkles className="size-5 sm:size-6" aria-hidden="true" />
            Check my loan offer
          </Button>
          <p className="mt-4 text-sm text-slate-500">Four questions. No account, no SSN, no credit pull.</p>
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
    </Shell>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showIntro ? (
        <motion.div key="intro" exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: 'easeInOut' }}>
          <Intro onStart={closeIntro} />
        </motion.div>
      ) : (
        <motion.div
          key="page"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {page}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
