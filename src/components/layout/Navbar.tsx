import { ShieldCheck } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import { useApp } from '../../state/AppContext';

export default function Navbar() {
  const { setView } = useApp();
  const [theme] = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => setView('landing')} className="shrink-0 rounded-lg" aria-label="Lendro home">
          <img
            src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'}
            alt="Lendro"
            width={686}
            height={160}
            className="h-8 w-auto sm:h-9"
          />
        </button>
        <div className="flex items-center gap-3 sm:gap-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>
              No SSN Required <span className="text-slate-300">•</span> Zero Credit Impact
            </span>
          </p>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
