import Anthropic from '@anthropic-ai/sdk';
import { buildNegotiationEmail, computeAudit, flaggedTotal } from '../src/lib/finance.js';
import { GOAL_LABELS, STATE_NAMES } from '../src/lib/types.js';
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

const SYSTEM = `You review US loan documents (Loan Estimates, auto loan contracts, installment agreements) for a borrower.
List every fee or charge in the document with its dollar amount.
Flag each one:
- "junk": duplicate admin fees, optional add-ons bundled without asking, charges most lenders do not have.
- "negotiable": real charges that lenders often reduce or waive when shown a competing offer (origination, underwriting, points, doc fees).
- "standard": third-party or government costs that are normal (appraisal, title, recording, taxes, registration).
The note is one short sentence the borrower can act on. Use whole dollars. Do not invent fees that are not in the document.
The summary is two sentences in plain English about what stands out. If the document is not a loan document, return an empty fees list and say so in the summary.`;

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

  const client = new Anthropic({ apiKey, timeout: 50_000, maxRetries: 1 });
  const context = `Borrower context: ${GOAL_LABELS[input.goal]} of $${input.amount.toLocaleString('en-US')} in ${STATE_NAMES[input.state]}.`;

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
