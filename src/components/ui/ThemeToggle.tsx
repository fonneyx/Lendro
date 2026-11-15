import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cx } from '../../lib/cx';

const SPRING = { type: 'spring', stiffness: 520, damping: 30, mass: 0.9 } as const;

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, toggle] = useTheme();
  const dark = theme === 'dark';
  const Icon = dark ? Moon : Sun;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      onClick={toggle}
      className={cx(
        'relative flex h-8 w-14 shrink-0 items-center rounded-full p-1 ring-1 transition-colors duration-300 ring-inset',
        dark ? 'justify-end bg-blue-600 ring-blue-600' : 'justify-start bg-slate-200 ring-slate-300',
        className,
      )}
    >
      <Sun
        className={cx('absolute left-2 size-3.5 transition-opacity duration-300', dark ? 'text-on-accent opacity-60' : 'opacity-0')}
        aria-hidden="true"
      />
      <Moon
        className={cx('absolute right-2 size-3.5 text-slate-500 transition-opacity duration-300', dark ? 'opacity-0' : 'opacity-70')}
        aria-hidden="true"
      />
      <motion.span
        layout
        transition={SPRING}
        whileTap={{ scaleX: 1.18 }}
        className="relative z-10 flex size-6 items-center justify-center overflow-hidden rounded-full bg-on-accent shadow-md"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex"
          >
            <Icon className={cx('size-3.5', dark ? 'text-blue-600' : 'text-amber-500')} strokeWidth={2.5} aria-hidden="true" />
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
