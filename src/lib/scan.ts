import { buildNegotiationEmail, computeAudit, flaggedTotal, simulatedLoanEstimateFees } from './finance';
import { formatUSD } from './format';
import { GOAL_LABELS } from './types';
import type { QuizInput, ScanResult } from './types';

const TIMEOUT_MS = 30_000;
export const MAX_PDF_BYTES = 3_200_000;
export const SAMPLE_PDF_URL = '/sample-loan-estimate.pdf';

export function simulatedScan(input: QuizInput): ScanResult {
  const fees = simulatedLoanEstimateFees(input);
  const totalFlagged = flaggedTotal(fees);
  return {
    fees,
    totalFlagged,
    summary: `Estimated fees for a typical ${formatUSD(input.amount)} ${GOAL_LABELS[input.goal].toLowerCase()}. ${formatUSD(totalFlagged)} of them are commonly reduced or removed.`,
    emailScript: buildNegotiationEmail(input, computeAudit(input), fees),
    source: 'simulated',
  };
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// Never throws: any failure falls back to the simulated scan so the dashboard always has a result.
export async function scanDocument(input: QuizInput, file?: Blob): Promise<ScanResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const pdf: Blob = file ? file : await (await fetch(SAMPLE_PDF_URL, { signal: controller.signal })).blob();
    if (pdf.size > MAX_PDF_BYTES) return simulatedScan(input);
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pdfBase64: await toBase64(pdf), input }),
      signal: controller.signal,
    });
    if (!res.ok) return simulatedScan(input);
    const data = (await res.json()) as ScanResult;
    return Array.isArray(data.fees) && data.fees.length > 0 ? data : simulatedScan(input);
  } catch {
    return simulatedScan(input);
  } finally {
    clearTimeout(timer);
  }
}
