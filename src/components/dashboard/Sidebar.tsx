import { Check, FileText } from 'lucide-react';
import type { Scan } from './Thread';
import { Panel, ProgressBar } from '../ui/primitives';
import { flaggedTotal } from '../../lib/finance';
import { formatUSD } from '../../lib/format';
import { cx } from '../../lib/cx';
import { planSteps } from '../../lib/plan';
import type { SavedAudit } from '../../lib/plan';
import { GOAL_LABELS, STATE_NAMES, TIER_LABELS } from '../../lib/types';

interface Props {
  saved: SavedAudit;
  scans: Scan[];
  onToggleStep: (id: string) => void;
  onOpenScan: (id: number) => void;
}

export default function Sidebar({ saved, scans, onToggleStep, onOpenScan }: Props) {
  const steps = planSteps(saved.input.goal);
  const done = steps.filter((s) => saved.completedSteps.includes(s.id)).length;
  const since = new Date(saved.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4">
      <Panel>
        <h2 className="text-sm font-medium text-slate-500">Saved audit</h2>
        <p className="tnum mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{formatUSD(saved.input.amount)}</p>
        <p className="mt-1 text-sm text-slate-600">
          {GOAL_LABELS[saved.input.goal]}, {STATE_NAMES[saved.input.state]}
        </p>
        <p className="text-sm text-slate-600">Credit {TIER_LABELS[saved.input.tier]}</p>
        <p className="mt-3 text-xs text-slate-500">Saved on this device since {since}</p>
      </Panel>

      <Panel>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">My Loan Plan</h2>
          <span className="tnum text-sm font-medium text-slate-500">
            {done} of {steps.length}
          </span>
        </div>
        <ProgressBar value={done} max={steps.length} label="Loan plan progress" className="mt-3" />
        <ul className="mt-4 space-y-1">
          {steps.map((step) => {
            const checked = saved.completedSteps.includes(step.id);
            return (
              <li key={step.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleStep(step.id)}
                    className="peer sr-only"
                  />
                  <span
                    className={cx(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600',
                      checked ? 'bg-emerald-500 text-on-accent ring-emerald-500' : 'bg-white ring-slate-300',
                    )}
                  >
                    {checked && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cx('block text-sm font-semibold', checked ? 'text-slate-400 line-through' : 'text-slate-900')}>
                      {step.title}
                    </span>
                    <span className="block text-xs text-slate-500">{step.detail}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Scans this session</h2>
        {scans.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nothing scanned yet. Drop a Loan Estimate into the analyst to see its fees here.
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {scans.map((scan) => (
              <li key={scan.id}>
                <button
                  type="button"
                  onClick={() => onOpenScan(scan.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-slate-50"
                >
                  <FileText className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{scan.name}</span>
                  <span className="tnum shrink-0 text-sm font-semibold text-amber-700">
                    {scan.result ? formatUSD(flaggedTotal(scan.result.fees)) : 'Reading'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
