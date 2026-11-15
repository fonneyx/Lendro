import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RateRail from '../components/dashboard/RateRail';
import Sidebar from '../components/dashboard/Sidebar';
import Thread from '../components/dashboard/Thread';
import type { Scan } from '../components/dashboard/Thread';
import Shell from '../components/layout/Shell';
import { buildNegotiationEmail, computeAudit } from '../lib/finance';
import { cx } from '../lib/cx';
import { loadSaved, newSavedAudit, saveAudit } from '../lib/plan';
import type { SavedAudit } from '../lib/plan';
import { scanDocument } from '../lib/scan';
import type { QuizInput } from '../lib/types';
import { useApp } from '../state/AppContext';
import type { DashboardPane } from '../state/AppContext';
import { documentName } from '../lib/market';

const PANES: { id: DashboardPane; label: string }[] = [
  { id: 'analyst', label: 'Analyst' },
  { id: 'plan', label: 'My plan' },
  { id: 'rates', label: 'Rates' },
];
const DEMO_SHIFT = -0.25;
// Side columns stick beside the thread on wide screens and scroll on their own when taller than the window.
const SIDE =
  'mx-auto w-full max-w-2xl xl:sticky xl:top-24 xl:-m-1 xl:block xl:max-h-[calc(100vh-7rem)] xl:max-w-none xl:self-start xl:overflow-y-auto xl:p-1';

const sameLoan = (a: QuizInput, b: QuizInput) => a.goal === b.goal && a.market === b.market && a.tier === b.tier;

function initialSaved(input: QuizInput): SavedAudit {
  const existing = loadSaved();
  return existing && sameLoan(existing.input, input) ? { ...existing, input } : newSavedAudit(input);
}

export default function Dashboard() {
  const { input, setInput, pane, setPane } = useApp();
  const [saved, setSaved] = useState<SavedAudit>(() => initialSaved(input));
  const [scans, setScans] = useState<Scan[]>([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const nextId = useRef(1);

  useEffect(() => {
    setSaved((prev) => (prev.input === input ? prev : { ...prev, input }));
  }, [input]);

  useEffect(() => {
    saveAudit(saved);
  }, [saved]);

  const base = useMemo(() => computeAudit(input), [input]);
  const audit = useMemo(() => computeAudit(input, { rateShift: saved.rateShift }), [input, saved.rateShift]);

  const latest = [...scans].reverse().find((s) => s.result)?.result ?? null;
  const email = useMemo(
    () => (latest ? buildNegotiationEmail(input, audit, latest.fees) : null),
    [latest, input, audit],
  );

  const runScan = useCallback(
    async (file?: File) => {
      const id = nextId.current++;
      setPane('analyst');
      setScans((prev) => [...prev, { id, name: file ? file.name : `Sample bank ${documentName(input.goal, input.market)}.pdf`, sample: !file, result: null }]);
      const result = await scanDocument(input, file);
      setScans((prev) => prev.map((s) => (s.id === id ? { ...s, result } : s)));
    },
    [input],
  );

  const toggleStep = (id: string) =>
    setSaved((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(id)
        ? prev.completedSteps.filter((s) => s !== id)
        : [...prev.completedSteps, id],
    }));

  const openScan = (id: number) => {
    setPane('analyst');
    requestAnimationFrame(() => document.getElementById(`scan-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-16 sm:px-6 xl:pt-8">
        <h1 className="sr-only">Your loan analyst</h1>

        <div role="tablist" aria-label="Dashboard sections" className="mb-4 flex rounded-xl bg-slate-200/70 p-1 xl:hidden">
          {PANES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pane === p.id}
              onClick={() => setPane(p.id)}
              className={cx(
                'flex-1 rounded-lg py-2 text-sm font-semibold transition duration-200',
                pane === p.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <aside aria-label="Saved audit and plan" className={cx(SIDE, pane !== 'plan' && 'hidden')}>
            <Sidebar saved={saved} scans={scans} onToggleStep={toggleStep} onOpenScan={openScan} />
          </aside>

          <section
            aria-label="Analyst"
            className={cx('mx-auto w-full max-w-2xl min-w-0 xl:block xl:max-w-none', pane !== 'analyst' && 'hidden')}
          >
            <Thread
              input={input}
              audit={audit}
              scans={scans}
              email={email}
              emailOpen={emailOpen}
              onFile={runScan}
              onSample={() => runScan()}
              onDraftEmail={() => setEmailOpen(true)}
            />
          </section>

          <aside aria-label="Rates" className={cx(SIDE, pane !== 'rates' && 'hidden')}>
            <RateRail
              input={input}
              setInput={setInput}
              base={base}
              audit={audit}
              rateShift={saved.rateShift}
              createdAt={saved.createdAt}
              onToggleShift={() => setSaved((prev) => ({ ...prev, rateShift: prev.rateShift === 0 ? DEMO_SHIFT : 0 }))}
            />
          </aside>
        </div>
      </div>
    </Shell>
  );
}
