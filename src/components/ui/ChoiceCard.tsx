import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface Props {
  selected: boolean;
  onSelect: () => void;
  lead: ReactNode;
  title: string;
  detail?: string;
  className?: string;
}

export default function ChoiceCard({ selected, onSelect, lead, title, detail, className }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cx(
        'group flex w-full items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-blue-600 sm:p-6',
        selected ? 'ring-2 ring-blue-600 shadow-lg' : 'ring-slate-200',
        className,
      )}
    >
      <span
        className={cx(
          'flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold tracking-tight transition-colors duration-200',
          selected ? 'bg-blue-600 text-on-accent' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700',
        )}
      >
        {lead}
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-bold tracking-tight text-slate-900">{title}</span>
        {detail && <span className="mt-0.5 block text-sm text-slate-500">{detail}</span>}
      </span>
    </button>
  );
}
