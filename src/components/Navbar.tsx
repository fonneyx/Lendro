import { ShieldCheck } from 'lucide-react';
import { useApp } from '../state/AppContext';

export default function Navbar() {
  const { setView } = useApp();
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setView('landing')}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-bold text-white">L</span>
          Lendro
        </button>
        <p className="flex items-center gap-1.5 rounded-full bg-save-soft px-3 py-1 text-xs font-medium text-save">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">No SSN Required • Zero Credit Impact</span>
          <span className="sm:hidden">No SSN • No credit impact</span>
        </p>
      </div>
    </header>
  );
}
