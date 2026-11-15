import Anthropic from '@anthropic-ai/sdk';
import { buildNegotiationEmail, computeAudit, flaggedTotal } from '../src/lib/finance.js';
import { formatMoney } from '../src/lib/format.js';
import { goalLabel, placeName, regionProfile } from '../src/lib/market.js';
import type { ScanResult } from '../src/lib/types.js';
import { parseQuizInput, parseScannedFees } from '../src/lib/validate.js';

// Vercel rejects request bodies over 4.5 MB; base64 adds about a third.
const MAX_PDF_BASE64 = 4_400_000;

const SCHEMA = {
  type: 'object',
  properties: {
    fees: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
          flag: { type: 'string', enum: ['junk', 'negotiable', 'standard'] },
          note: { type: 'string' },
        },
        required: ['name', 'amount', 'flag', 'note'],
        additionalProperties: false,
      },
    },
    summary: { type: 'string' },
  },
  required: ['fees', 'summary'],
  additionalProperties: false,
};

const SYSTEM = `You review loan offer documents for a borrower: US Loan Estimates and auto or installment contracts, EU and UK mortgage sheets (ESIS), consumer credit forms (SECCI) and car finance agreements.
The document may be in English, German, French, Spanish, Italian or Dutch. Write fee names in English, followed by the original term in parentheses when the document is not in English.
List every fee or charge in the document with its amount in the document's currency, as a whole number.
Flag each one:
- "junk": duplicate admin fees, optional add-ons bundled without asking, charges most lenders do not have.
- "negotiable": real charges that lenders often reduce or waive when shown a competing offer (origination, arrangement, processing, product and broker fees, points, dealer fees).
- "standard": third-party or government costs that are normal (valuation, appraisal, title, notary, land registry, recording, taxes, registration).
The note is one short sentence the borrower can act on. Do not invent fees that are not in the document.
The summary is two sentences in plain English about what stands out. If the document is not a loan document, return an empty fees list and say so in the summary.`;

// Base64 of the "%PDF-" file signature.
const PDF_SIGNATURE = 'JVBERi0';

// Per-instance limits. They cap abuse of the provider key between deploys; the account spend limit is the hard cap.
const PER_IP_LIMIT = 5;
const PER_IP_WINDOW_MS = 10 * 60_000;
const GLOBAL_LIMIT = 60;
const GLOBAL_WINDOW_MS = 60 * 60_000;
const hits = new Map<string, number[]>();

function allow(key: string, limit: number, windowMs: number, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'scanner_unavailable' }, 503);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const input = parseQuizInput(body.input);
  const pdf = body.pdfBase64;
  if (!input) return json({ error: 'invalid_input' }, 400);
  if (typeof pdf !== 'string' || pdf.length === 0) return json({ error: 'missing_pdf' }, 400);
  if (pdf.length > MAX_PDF_BASE64) return json({ error: 'pdf_too_large' }, 413);
  if (!pdf.startsWith(PDF_SIGNATURE)) return json({ error: 'not_a_pdf' }, 415);

  const now = Date.now();
  if (!allow(`ip:${clientIp(request)}`, PER_IP_LIMIT, PER_IP_WINDOW_MS, now) || !allow('all', GLOBAL_LIMIT, GLOBAL_WINDOW_MS, now)) {
    return json({ error: 'rate_limited' }, 429);
  }

  const client = new Anthropic({ apiKey, timeout: 50_000, maxRetries: 1 });
  const context = `Borrower context: ${goalLabel(input.goal, input.market)} of ${formatMoney(input.amount, input.market)} in ${placeName(input.market)} (currency ${regionProfile(input.market).currency}).`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4096,
      system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf } },
            { type: 'text', text: `${context}\nList and flag the fees in this document.` },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') return json({ error: 'refused' }, 502);
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return json({ error: 'empty_response' }, 502);

    const parsed = JSON.parse(text.text) as { fees?: unknown; summary?: unknown };
    const fees = parseScannedFees(parsed.fees);
    const summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 600) : '';
    if (fees.length === 0) return json({ error: 'no_fees_found', summary }, 422);

    const result: ScanResult = {
      fees,
      totalFlagged: flaggedTotal(fees),
      summary,
      emailScript: buildNegotiationEmail(input, computeAudit(input), fees),
      source: 'ai',
    };
    return json(result);
  } catch (err) {
    console.error('scan failed', err instanceof Error ? err.message : err);
    return json({ error: 'scan_failed' }, 502);
  }
}
