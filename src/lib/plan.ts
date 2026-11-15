import { baselineApr } from './finance';
import { parseQuizInput } from './validate';
import { regionOf } from './market';
import type { Goal, Market, QuizInput, Region } from './types';

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

const KEY = 'lendro:v1';

const BNPL_STEPS: PlanStep[] = [
  { id: 'b-apr', title: 'Find the real rate', detail: 'Ask for the annual rate and every fee, not only the installment amount.' },
  { id: 'b-compare', title: 'Compare two other providers', detail: 'Use the matched profiles as your benchmark.' },
  { id: 'b-scan', title: 'Scan the plan agreement', detail: 'Flag setup and processing fees before you accept.' },
  { id: 'b-email', title: 'Ask for fees to be waived', detail: 'Send the draft to the provider or the merchant.' },
  { id: 'b-autopay', title: 'Set up automatic payments', detail: 'Late fees are the most common extra cost on these plans.' },
  { id: 'b-payoff', title: 'Check for early payoff terms', detail: 'Confirm there is no penalty for paying the plan off early.' },
];

const STEPS: Record<Region, Record<Goal, PlanStep[]>> = {
  us: {
    mortgage: [
      { id: 'm-estimates', title: 'Request Loan Estimates from 3 lenders', detail: 'Ask on the same day so the rates are comparable.' },
      { id: 'm-scan', title: 'Scan each Loan Estimate', detail: 'Drop every PDF into the analyst to flag junk and negotiable fees.' },
      { id: 'm-email', title: 'Send the negotiation email', detail: 'Use the draft to ask your bank to match the best rate and drop fees.' },
      { id: 'm-compare', title: 'Compare final APR and fees', detail: 'Judge the revised offers on total cost, not the monthly payment alone.' },
      { id: 'm-lock', title: 'Lock the rate', detail: 'Get the lock period and any lock fee in writing.' },
      { id: 'm-closing', title: 'Review the Closing Disclosure', detail: 'Check it line by line against the last Loan Estimate before signing.' },
    ],
    auto: [
      { id: 'a-preapprove', title: 'Get pre-approved by a credit union', detail: 'Walk into the dealership with a rate already in hand.' },
      { id: 'a-price', title: 'Agree the car price first', detail: 'Settle the out-the-door price before talking about financing.' },
      { id: 'a-scan', title: 'Scan the dealer finance offer', detail: 'Flag add-ons such as GAP cover and bundled warranties.' },
      { id: 'a-email', title: 'Send the negotiation email', detail: 'Ask the lender to match your pre-approval and remove add-ons.' },
      { id: 'a-decline', title: 'Decline optional add-ons in writing', detail: 'They are not required to get the loan.' },
      { id: 'a-contract', title: 'Check the final contract', detail: 'Confirm APR, term and amount financed match what you agreed.' },
    ],
    bnpl: BNPL_STEPS,
  },
  eu: {
    mortgage: [
      { id: 'm-esis', title: 'Request an ESIS from 3 lenders', detail: 'Every EU lender must give you this standard sheet before you commit.' },
      { id: 'm-scan', title: 'Scan each ESIS', detail: 'Drop every PDF into the analyst to flag junk and negotiable fees.' },
      { id: 'm-email', title: 'Send the negotiation email', detail: 'Ask your bank to match the best APRC and drop the extras.' },
      { id: 'm-insurance', title: 'Price the loan insurance yourself', detail: 'You can often choose your own insurer if the cover is equal.' },
      { id: 'm-compare', title: 'Compare APRC and total cost', detail: 'The APRC includes most fees, so it is the fairest single number.' },
      { id: 'm-reflect', title: 'Use your reflection period', detail: 'You get time by law to study the binding offer before you sign.' },
    ],
    auto: [
      { id: 'a-quotes', title: 'Get a bank quote before the dealer', detail: 'Walk in with an APRC already in hand.' },
      { id: 'a-price', title: 'Agree the car price first', detail: 'Settle the price before talking about financing.' },
      { id: 'a-scan', title: 'Scan the SECCI form', detail: 'Flag payment protection and other add-ons.' },
      { id: 'a-email', title: 'Send the negotiation email', detail: 'Ask the lender to match your best quote and remove add-ons.' },
      { id: 'a-decline', title: 'Decline optional insurance in writing', detail: 'It is not required to get the loan.' },
      { id: 'a-withdraw', title: 'Note your 14-day withdrawal right', detail: 'You can withdraw from a consumer credit agreement within 14 days.' },
    ],
    bnpl: BNPL_STEPS,
  },
  uk: {
    mortgage: [
      { id: 'm-dip', title: 'Get Decisions in Principle from 3 lenders', detail: 'Ask for soft-search checks so your credit file is not marked.' },
      { id: 'm-scan', title: 'Scan each mortgage illustration', detail: 'Drop every ESIS PDF into the analyst to flag fees.' },
      { id: 'm-email', title: 'Send the negotiation email', detail: 'Ask your bank to match the best rate and drop the booking fee.' },
      { id: 'm-fees', title: 'Compare fee-free and low-rate deals', detail: 'Add the product fee to the cost over the deal period.' },
      { id: 'm-erc', title: 'Check the early repayment charges', detail: 'Know what it costs to leave before the deal ends.' },
      { id: 'm-offer', title: 'Review the mortgage offer', detail: 'Match it line by line against the last illustration before you accept.' },
    ],
    auto: [
      { id: 'a-quotes', title: 'Get a soft-search finance quote first', detail: 'Compare it with the dealer before you visit.' },
      { id: 'a-price', title: 'Agree the car price first', detail: 'Settle the price before talking about PCP or HP.' },
      { id: 'a-scan', title: 'Scan the finance agreement', detail: 'Flag GAP, paint protection and admin fees.' },
      { id: 'a-email', title: 'Send the negotiation email', detail: 'Ask the dealer to match your quote and remove add-ons.' },
      { id: 'a-decline', title: 'Decline optional add-ons in writing', detail: 'They are not required to get the finance.' },
      { id: 'a-withdraw', title: 'Note your 14-day withdrawal right', detail: 'You can withdraw from the credit agreement within 14 days.' },
    ],
    bnpl: BNPL_STEPS,
  },
};

export function planSteps(goal: Goal, market: Market): PlanStep[] {
  return STEPS[regionOf(market)][goal];
}

export function newSavedAudit(input: QuizInput): SavedAudit {
  return {
    version: 1,
    input,
    createdAt: new Date().toISOString(),
    baselineAtSave: baselineApr(input.goal, input.market, input.tier),
    completedSteps: [],
    rateShift: 0,
  };
}

export function loadSaved(): SavedAudit | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedAudit>;
    const input = parseQuizInput(data.input);
    if (data.version !== 1 || !input || typeof data.createdAt !== 'string') return null;
    if (Number.isNaN(Date.parse(data.createdAt))) return null;
    return {
      version: 1,
      input,
      createdAt: data.createdAt,
      baselineAtSave:
        typeof data.baselineAtSave === 'number' ? data.baselineAtSave : baselineApr(input.goal, input.market, input.tier),
      completedSteps: Array.isArray(data.completedSteps)
        ? data.completedSteps.filter((s): s is string => typeof s === 'string')
        : [],
      rateShift: typeof data.rateShift === 'number' && Number.isFinite(data.rateShift) ? data.rateShift : 0,
    };
  } catch {
    return null;
  }
}

export function saveAudit(saved: SavedAudit): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Storage can be unavailable (private mode); the dashboard still works for this visit.
  }
}
