import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import Button from '../ui/Button';
import { cx } from '../../lib/cx';
import { MAX_PDF_BYTES } from '../../lib/scan';

interface Props {
  busy: boolean;
  onFile: (file: File) => void;
  onSample: () => void;
}

export default function PdfDropzone({ busy, onFile, onSample }: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError(`"${file.name}" is not a PDF. Export the Loan Estimate as a PDF and drop it again.`);
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`"${file.name}" is over 3 MB. Save a smaller copy, or try the sample document.`);
      return;
    }
    setError('');
    onFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!busy) accept(e.dataTransfer.files[0]);
        }}
        className={cx(
          'rounded-2xl border-2 border-dashed p-6 text-center transition duration-200 sm:p-8',
          over ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50',
        )}
      >
        <UploadCloud className={cx('mx-auto size-9', over ? 'text-blue-600' : 'text-slate-400')} aria-hidden="true" />
        <p className="mt-3 text-base font-bold tracking-tight text-slate-900">Drag and drop your Loan Estimate PDF</p>
        <p className="mt-1 text-sm text-slate-500">Files are analyzed and not stored. PDF, up to 3 MB.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Button size="md" disabled={busy} onClick={() => picker.current?.click()}>
            Choose a PDF
          </Button>
          <Button size="md" variant="secondary" disabled={busy} onClick={onSample}>
            Test with Sample Bank PDF
          </Button>
        </div>
        <input
          ref={picker}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a Loan Estimate PDF"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-amber-800">
          {error}
        </p>
      )}
    </div>
  );
}
