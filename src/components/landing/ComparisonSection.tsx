import { Check, X } from 'lucide-react';

const ROWS: { broker: string; analyst: string }[] = [
  { broker: 'Often paid by the lender', analyst: '100% Unbiased' },
  { broker: 'Hidden origination fees', analyst: 'Zero hidden commissions' },
  { broker: 'Endless spam calls', analyst: 'Total privacy (no calls)' },
  { broker: 'Takes days to reply', analyst: 'Instant data-driven analysis' },
];

export default function ComparisonSection() {
  return (
    <section aria-labelledby="compare-heading" className="mx-auto max-w-5xl px-4 sm:px-6">
      <h1 id="compare-heading" className="max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-6xl">
        A broker is paid by the bank. Your analyst is not.
      </h1>

      <div className="mt-10 grid gap-5 md:grid-cols-2 md:gap-6">
        <div className="order-2 rounded-2xl bg-slate-100 p-7 md:order-1 md:p-9">
          <h2 className="text-xl font-bold tracking-tight text-slate-700">Traditional Mortgage/Loan Broker</h2>
          <ul className="mt-6 space-y-4">
            {ROWS.map((row) => (
              <li key={row.broker} className="flex items-start gap-3 text-base text-slate-600">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <X className="size-4" strokeWidth={3} aria-hidden="true" />
                </span>
                {row.broker}
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 rounded-2xl bg-white p-7 shadow-xl ring-2 shadow-emerald-900/10 ring-emerald-500 md:order-2 md:p-9">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Independent AI Analyst</h2>
          <ul className="mt-6 space-y-4">
            {ROWS.map((row) => (
              <li key={row.analyst} className="flex items-start gap-3 text-base font-semibold text-slate-900">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-on-accent">
                  <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                </span>
                {row.analyst}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
