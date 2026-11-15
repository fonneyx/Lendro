import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import FinancePattern from '../ui/FinancePattern';
import { useTheme } from '../../hooks/useTheme';

const EASE = [0.16, 1, 0.3, 1] as const;
const WELCOME_HOLD_MS = 2800;

type Scene = 'welcome' | 'pitch';

export default function Intro({ onStart }: { onStart: () => void }) {
  const reduce = useReducedMotion();
  const [theme] = useTheme();
  const [scene, setScene] = useState<Scene>(reduce ? 'pitch' : 'welcome');

  useEffect(() => {
    if (scene !== 'welcome') return;
    const timer = setTimeout(() => setScene('pitch'), WELCOME_HOLD_MS);
    return () => clearTimeout(timer);
  }, [scene]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-white px-6">
      <FinancePattern />
      <AnimatePresence mode="wait">
        {scene === 'welcome' ? (
          <motion.div
            key="welcome"
            className="relative z-10 flex flex-col items-center text-center"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          >
            <motion.img
              src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'}
              alt="Lendro"
              width={686}
              height={160}
              className="h-16 w-auto sm:h-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
            <motion.p
              className="mt-8 text-2xl font-semibold tracking-tight text-slate-600 sm:text-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
            >
              Welcome to Lendro
            </motion.p>
          </motion.div>
        ) : (
          <motion.div key="pitch" className="relative z-10 flex max-w-4xl flex-col items-center text-center" exit={{ opacity: 0 }}>
            <motion.h1
              className="text-4xl leading-[1.08] font-extrabold tracking-tight text-slate-900 sm:text-6xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            >
              I am your personal assistant for finding the most favorable terms for you.
            </motion.h1>
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: reduce ? 0 : '45vh' }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: reduce ? 0 : 1.1, ease: EASE }}
            >
              <Button size="xl" onClick={onStart}>
                Get Started
                <ArrowRight className="size-5 sm:size-6" aria-hidden="true" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {scene === 'welcome' && (
        <button
          type="button"
          onClick={() => setScene('pitch')}
          className="absolute bottom-8 z-10 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Skip intro
        </button>
      )}
    </div>
  );
}
