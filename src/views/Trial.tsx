import { CalendarClock, CreditCard, LoaderCircle, Mail, Unlock } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../state/AppContext';

const TIMELINE = [
  { icon: Unlock, when: 'Today: $0.00 due', text: 'Instant access to all 4+ matched lenders, grant finder, and PDF contract scanner' },
  { icon: Mail, when: 'Day 2: Email reminder', text: 'Automated email 24 hours before your trial ends' },
  { icon: CalendarClock, when: 'Day 3: $29/month', text: 'Cancel anytime in 1 click inside settings' },
];

const METHODS = ['Apple Pay', 'Google Pay', 'Stripe Link'];

export default function Trial() {
  const { setView } = useApp();
  const [pending, setPending] = useState<string | null>(null);

  const start = (method: string) => {
    setPending(method);
    window.setTimeout(() => setView('dashboard'), 900);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Don't sign a loan contract blindfolded. Unlock the entire market for $0
      </h1>

      <ol className="mt-8 space-y-0">
        {TIMELINE.map(({ icon: Icon, when, text }, i) => (
          <li key={when} className="relative flex gap-4 pb-6 last:pb-0">
            {i < TIMELINE.length - 1 && <span className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px bg-line" aria-hidden />}
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${i === 0 ? 'bg-save text-white' : 'bg-surface text-ink border border-line'}`}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="pt-1.5">
              <p className="font-semibold">{when}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">Lendro Pro</p>
          <p className="tabular-nums"><span className="text-2xl font-semibold">$0</span> <span className="text-sm text-muted">today, then $29/month</span></p>
        </div>
        <div className="mt-5 space-y-3">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              disabled={pending !== null}
              onClick={() => start(m)}
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-lg font-medium disabled:opacity-60 ${
                m === 'Apple Pay' ? 'bg-ink text-white hover:bg-ink-soft' : 'border border-line bg-surface hover:bg-canvas'
              }`}
            >
              {pending === m ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="h-4 w-4" aria-hidden />}
              {pending === m ? 'Starting your trial...' : m}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted">Demo checkout. No card is charged.</p>
      </div>

      <button type="button" onClick={() => setView('dashboard')} className="mx-auto mt-6 block text-sm text-ink-soft underline underline-offset-4 hover:text-ink">
        Skip payment (MVP Preview Mode)
      </button>
    </div>
  );
}
