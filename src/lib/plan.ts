import { baselineApr } from './finance';
import type { Goal, QuizInput } from './types';
import { parseQuizInput } from './validate';

export interface SavedAudit {
  version: 1;
  input: QuizInput;
  createdAt: string;
  baselineAtSave: number;
  completedSteps: string[];
  rateShift: number;
}

export interface PlanStep {
  id: string;
  title: string;
  detail: string;
}

const STORAGE_KEY = 'lendro:v1';

const STEPS: Record<Goal, PlanStep[]> = {
  mortgage: [
    { id: 'estimates', title: 'Request Loan Estimates from 3 lenders', detail: 'Apply within the same 14-day window so the credit checks count as one inquiry.' },
    { id: 'scan', title: 'Scan each Loan Estimate', detail: 'Run every estimate through the fee scanner and note the junk and negotiable fees.' },
    { id: 'email', title: 'Send the negotiation email to your bank', detail: 'Use the generated script with your best competing APR and the fees you want removed.' },
    { id: 'compare', title: 'Compare final APR and total fees', detail: 'Look at Section A and B of each estimate, not only the interest rate.' },
    { id: 'lock', title: 'Lock your rate', detail: 'Ask for a free 30 to 45-day lock in writing before the market moves.' },
    { id: 'disclosure', title: 'Review the Closing Disclosure', detail: 'It arrives 3 business days before closing. Every fee should match the estimate.' },
    { id: 'close', title: 'Close and set up autopay', detail: 'Many lenders take 0.25% off the rate for automatic payments.' },
  ],
  auto: [
    { id: 'preapprove', title: 'Get a credit union pre-approval', detail: 'Walk into the dealership with your own financing so you can compare.' },
    { id: 'quotes', title: 'Collect 3 written loan offers', detail: 'Dealer, your bank and one online lender, all for the same term.' },
    { id: 'scan', title: 'Scan the dealer contract', detail: 'Find add-ons like GAP, warranties and credit insurance before you sign.' },
    { id: 'email', title: 'Send the negotiation email', detail: 'Ask the dealer or bank to match your best APR and drop the add-ons.' },
    { id: 'price', title: 'Negotiate the car price separately', detail: 'Agree on the out-the-door price before discussing monthly payments.' },
    { id: 'sign', title: 'Sign only the loan you compared', detail: 'Check that the APR, term and amount match the offer on paper.' },
  ],
  bnpl: [
    { id: 'total', title: 'Write down the total cost of the plan', detail: 'Add every installment and fee and compare it with the item price.' },
    { id: 'scan', title: 'Scan the installment agreement', detail: 'Find setup, processing and late fees before you accept.' },
    { id: 'compare', title: 'Compare with 2 other options', detail: 'A 0% card promotion or a small credit union loan can cost less.' },
    { id: 'email', title: 'Ask the provider to waive setup fees', detail: 'Send the generated email with the cheaper option you found.' },
    { id: 'autopay', title: 'Turn on autopay', detail: 'Late fees are the most common extra cost on installment plans.' },
    { id: 'calendar', title: 'Add every due date to your calendar', detail: 'One missed payment can cost more than the interest you saved.' },
  ],
};

export function planSteps(goal: Goal): PlanStep[] {
  return STEPS[goal];
}

export function newSavedAudit(input: QuizInput): SavedAudit {
  return {
    version: 1,
    input,
    createdAt: new Date().toISOString(),
    baselineAtSave: baselineApr(input.goal, input.state, input.tier),
    completedSteps: [],
    rateShift: 0,
  };
}

export function loadSaved(): SavedAudit | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedAudit>;
    const input = parseQuizInput(data.input);
    if (data.version !== 1 || !input || typeof data.createdAt !== 'string') return null;
    return {
      version: 1,
      input,
      createdAt: data.createdAt,
      baselineAtSave: typeof data.baselineAtSave === 'number' ? data.baselineAtSave : baselineApr(input.goal, input.state, input.tier),
      completedSteps: Array.isArray(data.completedSteps) ? data.completedSteps.filter((s) => typeof s === 'string') : [],
      rateShift: typeof data.rateShift === 'number' && Number.isFinite(data.rateShift) ? data.rateShift : 0,
    };
  } catch {
    return null;
  }
}

export function saveAudit(s: SavedAudit): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Storage can be full or blocked (private mode); the plan still works for this visit.
  }
}
