import { Check, Copy, FileText, LoaderCircle, Upload } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { formatUSD } from '../lib/format';
import { MAX_PDF_BYTES, scanDocument } from '../lib/scan';
import type { FeeFlag, QuizInput, ScanResult } from '../lib/types';

const FLAG_STYLE: Record<FeeFlag, { label: string; className: string }> = {
  junk: { label: 'Junk fee', className: 'bg-risk-soft text-risk' },
  negotiable: { label: 'Negotiable', className: 'bg-warn-soft text-warn' },
  standard: { label: 'Standard', className: 'bg-canvas text-muted' },
};

export default function PdfScanner({ input }: { input: QuizInput }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannedName, setScannedName] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);

  const run = async (file?: File) => {
    if (file && file.type !== 'application/pdf') return setNotice('Please choose a PDF file.');
    if (file && file.size > MAX_PDF_BYTES) return setNotice('This PDF is over 3 MB. Try a smaller export of the Loan Estimate.');
    setNotice('');
    setCopied(false);
    setBusy(file ? file.name : 'Sample Bank Loan Estimate');
    const res = await scanDocument(input, file);
    setScannedName(file ? file.name : 'Sample Bank Loan Estimate (Sample data)');
    setResult(res);
    setBusy(null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void run(file);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.emailScript);
      setCopied(true);
    } catch {
      setNotice('Copy failed. Select the text and copy it manually.');
    }
  };

  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Junk Fee & Loan Estimate Scanner</h2>
      <p className="mt-1 text-sm text-muted">Upload a Loan Estimate or loan contract. Files are analyzed and not stored.</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-5 flex flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center ${dragging ? 'border-ink bg-canvas' : 'border-line'}`}
      >
        {busy ? (
          <p className="flex items-center gap-2 text-sm font-medium" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Reading {busy}...
          </p>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted" aria-hidden />
            <p className="mt-2 text-sm">Drop a PDF here, or</p>
            <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button type="button" onClick={() => fileRef.current?.click()} className="min-h-11 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-ink-soft">
                Choose PDF
              </button>
              <button type="button" onClick={() => void run()} className="min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:bg-canvas">
                Test with Sample Bank PDF
              </button>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void run(file);
          }}
        />
      </div>
      {notice && <p className="mt-3 text-sm text-risk">{notice}</p>}

      {result && !busy && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" aria-hidden /> {scannedName}
            </p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${result.source === 'ai' ? 'bg-save-soft text-save' : 'bg-canvas text-muted'}`}>
              {result.source === 'ai' ? 'Read by AI' : 'Estimated fees (AI unavailable)'}
            </span>
          </div>
          {result.summary && <p className="mt-3 text-sm text-ink-soft">{result.summary}</p>}

          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {result.fees.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted">{f.note}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:ml-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${FLAG_STYLE[f.flag].className}`}>{FLAG_STYLE[f.flag].label}</span>
                  <span className="w-20 text-right text-sm font-semibold tabular-nums">{formatUSD(f.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-warn-soft px-4 py-3">
            <p className="text-sm font-medium text-warn">Fees you can push back on</p>
            <p className="text-lg font-semibold tabular-nums text-warn">{formatUSD(result.totalFlagged)}</p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Negotiation email</h3>
              <button type="button" onClick={() => void copy()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:bg-canvas">
                {copied ? <Check className="h-4 w-4 text-save" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? 'Copied' : 'Copy email'}
              </button>
            </div>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-canvas p-4 font-sans text-sm leading-6 text-ink-soft">
              {result.emailScript}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
