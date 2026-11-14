import type { CreditTier, Goal, UsState } from '../lib/types.js';

// Sample lender profiles and rate tables. Names are fictional; the numbers are
// tuned to sit near 2026 US market averages and are applied to the user's inputs
// by src/lib/finance.ts.

export const TERM_MONTHS: Record<Goal, number> = {
  mortgage: 360,
  auto: 60,
  bnpl: 12,
};

export const AMOUNT_RANGE: Record<Goal, { min: number; max: number; step: number; default: number }> = {
  mortgage: { min: 50_000, max: 1_500_000, step: 5_000, default: 350_000 },
  auto: { min: 5_000, max: 150_000, step: 500, default: 32_000 },
  bnpl: { min: 200, max: 20_000, step: 100, default: 3_000 },
};

export const BASE_APR: Record<Goal, number> = {
  mortgage: 6.25,
  auto: 6.0,
  bnpl: 12.0,
};

export const TIER_ADD_ON: Record<Goal, Record<CreditTier, number>> = {
  mortgage: { excellent: 0, good: 0.45, fair: 1.1, building: 2.0 },
  auto: { excellent: 0, good: 1.5, fair: 4.5, building: 8.5 },
  bnpl: { excellent: 0, good: 4.0, fair: 9.0, building: 15.0 },
};

export const STATE_ADJUSTMENT: Record<UsState, number> = {
  TX: 0.05,
  CA: -0.05,
  NY: 0.1,
  FL: 0.08,
  IL: 0,
};

export const BANK_FEE_RATE: Record<Goal, number> = {
  mortgage: 0.01,
  auto: 0.01,
  bnpl: 0.025,
};

export const MORTGAGE_ASSISTANCE_CAP: Record<UsState, number> = {
  TX: 10_000,
  CA: 15_000,
  NY: 15_000,
  FL: 10_000,
  IL: 7_500,
};

export interface LenderProfile {
  id: string;
  name: string;
  kind: 'credit_union' | 'online_lender';
  // Percentage points below the state baseline APR.
  discount: Record<Goal, number>;
  // Origination fee as a share of the loan amount.
  feeRate: Record<Goal, number>;
}

export const LENDERS: LenderProfile[] = [
  {
    id: 'northpine-fcu',
    name: 'Northpine Federal Credit Union',
    kind: 'credit_union',
    discount: { mortgage: 0.85, auto: 2.5, bnpl: 8 },
    feeRate: { mortgage: 0, auto: 0, bnpl: 0 },
  },
  {
    id: 'harborline',
    name: 'Harborline Lending',
    kind: 'online_lender',
    discount: { mortgage: 0.72, auto: 2.1, bnpl: 7 },
    feeRate: { mortgage: 0, auto: 0, bnpl: 0 },
  },
  {
    id: 'keystrand-cu',
    name: 'Keystrand Credit Union',
    kind: 'credit_union',
    discount: { mortgage: 0.64, auto: 1.8, bnpl: 6 },
    feeRate: { mortgage: 0, auto: 0, bnpl: 0 },
  },
  {
    id: 'brightmeadow-cu',
    name: 'Brightmeadow Members Credit Union',
    kind: 'credit_union',
    discount: { mortgage: 0.55, auto: 1.5, bnpl: 5.5 },
    feeRate: { mortgage: 0, auto: 0, bnpl: 0 },
  },
  {
    id: 'larkfield-direct',
    name: 'Larkfield Direct',
    kind: 'online_lender',
    discount: { mortgage: 0.48, auto: 1.2, bnpl: 4.5 },
    feeRate: { mortgage: 0.0035, auto: 0.0025, bnpl: 0.01 },
  },
  {
    id: 'summitvale-fcu',
    name: 'Summitvale Federal Credit Union',
    kind: 'credit_union',
    discount: { mortgage: 0.4, auto: 1.0, bnpl: 4 },
    feeRate: { mortgage: 0.005, auto: 0.005, bnpl: 0.015 },
  },
  {
    id: 'oakhaven-online',
    name: 'Oakhaven Online Loans',
    kind: 'online_lender',
    discount: { mortgage: 0.3, auto: 0.8, bnpl: 3 },
    feeRate: { mortgage: 0.006, auto: 0.0075, bnpl: 0.02 },
  },
];

// Typical Loan Estimate line items by goal, used when the AI scan is unavailable.
export interface FeeTemplate {
  name: string;
  rate: number;
  min: number;
  max: number;
  flag: 'junk' | 'negotiable' | 'standard';
  note: string;
}

export const FEE_TEMPLATES: Record<Goal, FeeTemplate[]> = {
  mortgage: [
    { name: 'Origination charge', rate: 0.01, min: 0, max: Infinity, flag: 'negotiable', note: 'Credit unions often charge $0. Ask the bank to waive or match.' },
    { name: 'Application fee', rate: 0.001, min: 300, max: 750, flag: 'junk', note: 'Charged for paperwork that is already covered by the origination charge.' },
    { name: 'Underwriting fee', rate: 0.002, min: 500, max: 1_500, flag: 'negotiable', note: 'Frequently reduced when you show a competing Loan Estimate.' },
    { name: 'Processing fee', rate: 0.0015, min: 250, max: 900, flag: 'junk', note: 'A duplicate admin fee with no separate service behind it.' },
    { name: 'Rate lock fee', rate: 0.001, min: 200, max: 800, flag: 'junk', note: 'Most lenders lock for 30–45 days at no cost.' },
    { name: 'Appraisal fee', rate: 0, min: 550, max: 550, flag: 'standard', note: 'Paid to a third-party appraiser; normal for a mortgage.' },
    { name: 'Credit report fee', rate: 0, min: 50, max: 50, flag: 'standard', note: 'Normal pass-through cost.' },
    { name: 'Title services', rate: 0.003, min: 600, max: 3_000, flag: 'standard', note: 'Shop title providers yourself to lower this.' },
  ],
  auto: [
    { name: 'Loan origination fee', rate: 0.01, min: 0, max: Infinity, flag: 'negotiable', note: 'Many credit unions finance cars with no origination fee.' },
    { name: 'Dealer documentation fee', rate: 0.008, min: 150, max: 800, flag: 'negotiable', note: 'Capped by law in some states; always ask for a reduction.' },
    { name: 'GAP insurance add-on', rate: 0.022, min: 400, max: 1_200, flag: 'junk', note: 'Usually cheaper through your own auto insurer.' },
    { name: 'Pre-bundled extended warranty', rate: 0.05, min: 900, max: 4_000, flag: 'junk', note: 'Optional. You can decline it and still get the loan.' },
    { name: 'Credit life insurance', rate: 0.015, min: 200, max: 1_500, flag: 'junk', note: 'Optional coverage that is often added without asking.' },
    { name: 'Title and registration', rate: 0.006, min: 100, max: 900, flag: 'standard', note: 'Government fees; normal.' },
  ],
  bnpl: [
    { name: 'Account setup fee', rate: 0.025, min: 10, max: 400, flag: 'junk', note: 'Many installment providers charge nothing to open a plan.' },
    { name: 'Payment processing fee', rate: 0.01, min: 5, max: 200, flag: 'junk', note: 'Avoidable by paying with a bank transfer.' },
    { name: 'Late payment fee (per occurrence)', rate: 0, min: 29, max: 29, flag: 'standard', note: 'Only charged if you miss a payment; set up autopay.' },
  ],
};
