import { ArrowLeft, Lock } from 'lucide-react';
import Shell from '../components/layout/Shell';
import Button from '../components/ui/Button';
import { cx } from '../lib/cx';
import { useApp } from '../state/AppContext';

const DAY_MS = 86_400_000;
const shortDate = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * DAY_MS).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function Trial() {
  const { setView } = useApp();
  const activate = () => setView('dashboard');

  const steps = [
    { when: 'Today', date: shortDate(0), price: '$0', detail: 'Full lender comparison, fee scanner and negotiation email.' },
    { when: 'Day 2', date: shortDate(1), price: 'Reminder', detail: 'An email 24 hours before your trial ends.' },
    { when: 'Day 3', date: shortDate(2), price: '$29/mo', detail: 'Cancel anytime in 1 click inside settings.' },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12">
        <button
          type="button"
          onClick={() => setView('preview')}
          className="flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to my audit
        </button>

        <h1 className="mt-8 text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Don't sign a loan contract blindfolded. Unlock the entire market for $0.
        </h1>

        <ol className="mt-10 grid gap-0 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.when} className="relative flex gap-4 pb-7 sm:block sm:pr-5 sm:pb-0">
              <div className="flex flex-col items-center sm:flex-row">
                <span
                  className={cx(
                    'tnum flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    i === 0 ? 'bg-emerald-500 text-on-accent' : 'bg-white text-slate-700 ring-1 ring-slate-300',
                  )}
                >
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-slate-300 sm:mt-0 sm:ml-2 sm:h-px sm:w-auto" aria-hidden="true" />
                )}
              </div>
              <div className="sm:mt-4">
                <p className="text-sm text-slate-500">
                  {s.when} <span className="text-slate-300">·</span> {s.date}
                </p>
                <p className={cx('mt-0.5 text-2xl font-extrabold tracking-tight', i === 0 ? 'text-emerald-600' : 'text-slate-900')}>
                  {s.price}
                </p>
                <p className="mt-1 text-sm text-slate-500">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 space-y-3">
          <Button variant="dark" size="lg" block onClick={activate}>
            Start with Apple Pay
          </Button>
          <Button variant="secondary" size="lg" block onClick={activate}>
            Start with Google Pay
          </Button>
          <Button variant="secondary" size="lg" block onClick={activate}>
            Start with Link
          </Button>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Secure connection. No card is charged in preview mode.
        </p>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={activate}
            className="rounded-lg text-sm font-semibold text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-800"
          >
            Skip payment (MVP Preview Mode)
          </button>
        </div>
      </div>
    </Shell>
  );
}
