import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import ComparisonSection from '../components/landing/ComparisonSection';
import Intro from '../components/landing/Intro';
import Shell from '../components/layout/Shell';
import Button from '../components/ui/Button';
import { formatUSD } from '../lib/format';
import { loadSaved } from '../lib/plan';
import { GOAL_LABELS } from '../lib/types';
import { useApp } from '../state/AppContext';

// Kept in memory only: the intro plays on every page load, but not when coming back to the
// landing page from another screen during the same load.
let introPlayed = false;

export default function Landing() {
  const { setView, setInput } = useApp();
  const saved = useMemo(() => loadSaved(), []);
  const [showIntro, setShowIntro] = useState(() => !introPlayed);

  const start = () => {
    introPlayed = true;
    setShowIntro(false);
  };

  const resume = () => {
    if (!saved) return;
    setInput(saved.input);
    setView('dashboard');
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showIntro ? (
        <motion.div key="intro" exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: 'easeInOut' }}>
          <Intro onStart={start} />
        </motion.div>
      ) : (
        <motion.div
          key="page"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Shell tone="white">
            {saved && (
              <div className="border-b border-blue-100 bg-blue-50">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Welcome back.</span> Your{' '}
                    {formatUSD(saved.input.amount)} {GOAL_LABELS[saved.input.goal].toLowerCase()} plan is saved on this
                    device.
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

            <div className="bg-linear-to-b from-slate-50 to-white pt-14 sm:pt-20">
              <ComparisonSection />
            </div>

            <section className="mx-auto max-w-5xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-28">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-2xl leading-snug font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Lendro helps you to find the most favorable mortgage terms.
                </p>
                <div className="mt-6 space-y-5 text-left text-lg leading-relaxed text-slate-600">
                  <p>
                    A large portion of the American population loses money due to hidden mortgage fees. There are many
                    free consultations available, but as a rule, they are all tied to their own banks, and no one will
                    tell you the most advantageous option.
                  </p>
                  <p>
                    Our app helps you find the best terms for you and ensures you don't miss out on financial
                    opportunities from other banks, thereby saving you from 17% to 23% of your savings.
                  </p>
                </div>
              </div>
              <div className="mt-12 text-center">
                <Button size="xl" onClick={() => setView('quiz')}>
                  <Sparkles className="size-5 sm:size-6" aria-hidden="true" />
                  Check my loan offer
                </Button>
                <p className="mt-4 text-sm text-slate-500">Four questions. No account, no SSN, no credit pull.</p>
              </div>
            </section>
          </Shell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
