import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy, FileText, LoaderCircle, Mail, Sparkles } from 'lucide-react';
import PdfDropzone from './PdfDropzone';
import Button from '../ui/Button';
import { SampleLabel } from '../ui/primitives';
import { flaggedTotal } from '../../lib/finance';
import { formatPct, formatUSD, formatUSDCents } from '../../lib/format';
import { cx } from '../../lib/cx';
import { GOAL_LABELS, STATE_NAMES } from '../../lib/types';
import type { Audit, FeeFlag, QuizInput, ScanResult } from '../../lib/types';

export interface Scan {
  id: number;
  name: string;
  sample: boolean;
  result: ScanResult | null;
}

interface Props {
  input: QuizInput;
  audit: Audit;
  scans: Scan[];
  email: string | null;
  emailOpen: boolean;
  onFile: (file: File) => void;
  onSample: () => void;
  onDraftEmail: () => void;
}

function Analyst({ children }: { children: ReactNode }) {
  return (
    <div className="animate-rise flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-on-accent">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-4">{children}</div>
    </div>
  );
}

function You({ children }: { children: ReactNode }) {
  return (
    <div className="animate-rise flex justify-end">
      <p className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-on-accent">
        {children}
      </p>
    </div>
  );
}

const FLAG_STYLE: Record<FeeFlag, string> = {
  junk: 'bg-red-50 text-red-700',
  negotiable: 'bg-amber-50 text-amber-800',
  standard: 'bg-slate-100 text-slate-600',
};
const FLAG_LABEL: Record<FeeFlag, string> = { junk: 'Junk fee', negotiable: 'Negotiable', standard: 'Standard' };

function ComparisonTable({ audit }: { audit: Audit }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Your primary bank vs. top {audit.tableLenders.length} alternatives
        </h2>
        <SampleLabel />
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="tnum w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-2 font-medium">Lender</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">APR</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Origination fee</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Monthly</th>
              <th scope="col" className="px-5 py-2 text-right font-medium">Lifetime saved</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100 bg-amber-50/60">
              <th scope="row" className="px-5 py-3 font-semibold text-slate-900">{audit.bankLabel}</th>
              <td className="px-3 py-3 text-right font-semibold text-amber-800">{formatPct(audit.bankApr)}</td>
              <td className="px-3 py-3 text-right text-slate-700">{formatUSD(audit.bankFee)}</td>
              <td className="px-3 py-3 text-right text-slate-700">{formatUSDCents(audit.bankMonthly)}</td>
              <td className="px-5 py-3 text-right text-slate-400">Baseline</td>
            </tr>
            {audit.tableLenders.map((l, i) => (
              <tr key={l.id} className="border-t border-slate-100">
                <th scope="row" className="px-5 py-3 font-medium text-slate-900">
                  {l.name}
                  <span className="block text-xs font-normal text-slate-500">
                    {l.kind === 'credit_union' ? 'Credit union' : 'Online lender'}
                    {i === 0 && ' · Best match'}
                  </span>
                </th>
                <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatPct(l.apr)}</td>
                <td className="px-3 py-3 text-right text-slate-700">{formatUSD(l.originationFee)}</td>
                <td className="px-3 py-3 text-right text-slate-700">{formatUSDCents(l.monthly)}</td>
                <td className={cx('px-5 py-3 text-right font-semibold', l.lifetimeSavings > 0 ? 'text-emerald-700' : 'text-slate-400')}>
                  {formatUSD(l.lifetimeSavings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeeList({ scan, result }: { scan: Scan; result: ScanResult }) {
  const flagged = flaggedTotal(result.fees);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          <span className="tnum text-amber-700">{formatUSD(flagged)}</span> in fees you can push back on
        </h2>
        <SampleLabel>
          {result.source === 'ai'
            ? scan.sample
              ? 'Sample document, read by AI'
              : 'Read from your document by AI'
            : 'Sample data: typical fees for this loan'}
        </SampleLabel>
      </div>
      <p className="mt-1.5 text-sm text-slate-500">{result.summary}</p>
      <ul className="mt-4 divide-y divide-slate-100">
        {result.fees.map((fee) => (
          <li key={fee.name} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                {fee.name}
                <span className={cx('rounded-full px-2 py-0.5 text-xs font-medium', FLAG_STYLE[fee.flag])}>
                  {FLAG_LABEL[fee.flag]}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{fee.note}</p>
            </div>
            <span className="tnum shrink-0 text-sm font-semibold text-slate-900">{formatUSD(fee.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmailDraft({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Negotiation email</h2>
        <Button size="sm" variant="secondary" onClick={copy}>
          {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy email'}
        </Button>
      </div>
      <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-slate-50 p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
        {email}
      </pre>
    </div>
  );
}

export default function Thread({ input, audit, scans, email, emailOpen, onFile, onSample, onDraftEmail }: Props) {
  const end = useRef<HTMLDivElement>(null);
  const busy = scans.some((s) => s.result === null);
  const lastCount = useRef(0);

  useEffect(() => {
    const count = scans.length * 2 + scans.filter((s) => s.result).length + (emailOpen ? 1 : 0);
    if (count > lastCount.current) end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    lastCount.current = count;
  }, [scans, emailOpen]);

  const goal = GOAL_LABELS[input.goal].toLowerCase();

  return (
    <div className="space-y-6">
      <Analyst>
        <p className="text-base leading-relaxed text-slate-700">
          {audit.alreadyCompetitive ? (
            <>
              Your <strong className="tnum font-semibold text-slate-900">{formatPct(audit.bankApr)}</strong> APR on a{' '}
              <span className="tnum">{formatUSD(input.amount)}</span> {goal} in {STATE_NAMES[input.state]} already beats
              every matched lender. You already have a competitive rate, so the money left to save is in the fees.
            </>
          ) : (
            <>
              On a <span className="tnum">{formatUSD(input.amount)}</span> {goal} in {STATE_NAMES[input.state]},{' '}
              {audit.best.name} comes in at{' '}
              <strong className="tnum font-semibold text-slate-900">{formatPct(audit.best.apr)}</strong> against{' '}
              {audit.bankLabel === 'Your Bank' ? 'your bank' : `the ${STATE_NAMES[input.state]} baseline`} at{' '}
              <strong className="tnum font-semibold text-slate-900">{formatPct(audit.bankApr)}</strong>. That is{' '}
              <strong className="tnum font-semibold text-emerald-700">{formatUSD(audit.lifetimeSavings)}</strong> over the
              loan, or <span className="tnum">{formatUSDCents(audit.monthlyDiff)}</span> a month.
            </>
          )}
        </p>
        <ComparisonTable audit={audit} />
        <p className="text-base leading-relaxed text-slate-700">
          Next, show me the Loan Estimate your bank gave you. I will flag every fee you can remove or negotiate.
        </p>
        <PdfDropzone busy={busy} onFile={onFile} onSample={onSample} />
      </Analyst>

      {scans.map((scan) => (
        <div key={scan.id} id={`scan-${scan.id}`} className="scroll-mt-24 space-y-6">
          <You>
            <FileText className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{scan.name}</span>
          </You>
          <Analyst>
            {scan.result ? (
              <FeeList scan={scan} result={scan.result} />
            ) : (
              <p role="status" className="flex items-center gap-2.5 text-base text-slate-600">
                <LoaderCircle className="size-5 animate-spin text-blue-600" aria-hidden="true" />
                Reading the fee lines. This can take up to 30 seconds.
              </p>
            )}
          </Analyst>
        </div>
      ))}

      {emailOpen && email && (
        <Analyst>
          <p className="text-base leading-relaxed text-slate-700">
            Here is an email to your bank. It uses your numbers and updates if you change them.
          </p>
          <EmailDraft email={email} />
        </Analyst>
      )}

      {email && !emailOpen && !busy && (
        <div className="flex flex-wrap gap-2 pl-11">
          <Button size="md" variant="secondary" onClick={onDraftEmail}>
            <Mail className="size-4" aria-hidden="true" />
            Draft my negotiation email
          </Button>
        </div>
      )}

      <div ref={end} />
    </div>
  );
}
