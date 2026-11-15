import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export function SampleLabel({ children = 'Sample lender profiles', className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-200', className)}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-(--ease-out-expo)"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200', className)}>{children}</section>;
}
