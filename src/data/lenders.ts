import type { FeeFlag, Goal, Region } from '../lib/types.js';

// Sample lender profiles per region. Names are fictional and not tied to real institutions.

export const AMOUNT_RANGE: Record<Goal, { min: number; max: number; step: number }> = {
  mortgage: { min: 50_000, max: 1_500_000, step: 5_000 },
  auto: { min: 5_000, max: 150_000, step: 500 },
  bnpl: { min: 200, max: 20_000, step: 100 },
};

export interface LenderProfile {
  id: string;
  name: string;
  kind: 'mutual' | 'online';
  // Percentage points below the market baseline rate.
  discount: Record<Goal, number>;
  // Origination or arrangement fee as a share of the loan amount.
  feeRate: Record<Goal, number>;
}

type Row = [id: string, name: string, kind: LenderProfile['kind']];

// Discounts and fees by rank, best first. The top four charge no fee.
const SPREADS: Record<Region, { discount: Record<Goal, number[]>; feeRate: Record<Goal, number[]> }> = {
  us: {
    discount: {
      mortgage: [0.85, 0.72, 0.64, 0.55, 0.48, 0.4, 0.3],
      auto: [2.5, 2.1, 1.8, 1.5, 1.2, 1.0, 0.8],
      bnpl: [8, 7, 6, 5.5, 4.5, 4, 3],
    },
    feeRate: {
      mortgage: [0, 0, 0, 0, 0.0035, 0.005, 0.006],
      auto: [0, 0, 0, 0, 0.0025, 0.005, 0.0075],
      bnpl: [0, 0, 0, 0, 0.01, 0.015, 0.02],
    },
  },
  eu: {
    discount: {
      mortgage: [0.55, 0.47, 0.41, 0.35, 0.29, 0.22, 0.15],
      auto: [1.9, 1.6, 1.35, 1.1, 0.9, 0.7, 0.5],
      bnpl: [5.5, 4.8, 4.2, 3.6, 3, 2.4, 1.8],
    },
    feeRate: {
      mortgage: [0, 0, 0, 0, 0.002, 0.003, 0.004],
      auto: [0, 0, 0, 0, 0.005, 0.0075, 0.01],
      bnpl: [0, 0, 0, 0, 0.01, 0.015, 0.02],
    },
  },
  uk: {
    discount: {
      mortgage: [0.7, 0.6, 0.52, 0.45, 0.38, 0.3, 0.22],
      auto: [2.3, 1.95, 1.65, 1.4, 1.1, 0.9, 0.7],
      bnpl: [7, 6.2, 5.4, 4.6, 3.8, 3, 2.2],
    },
    feeRate: {
      mortgage: [0, 0, 0, 0, 0.0025, 0.0035, 0.0045],
      auto: [0, 0, 0, 0, 0.004, 0.006, 0.008],
      bnpl: [0, 0, 0, 0, 0.01, 0.015, 0.02],
    },
  },
};

const NAMES: Record<Region, Row[]> = {
  us: [
    ['northpine-fcu', 'Northpine Federal Credit Union', 'mutual'],
    ['harborline', 'Harborline Lending', 'online'],
    ['keystrand-cu', 'Keystrand Credit Union', 'mutual'],
    ['brightmeadow-cu', 'Brightmeadow Members Credit Union', 'mutual'],
    ['larkfield-direct', 'Larkfield Direct', 'online'],
    ['summitvale-fcu', 'Summitvale Federal Credit Union', 'mutual'],
    ['oakhaven-online', 'Oakhaven Online Loans', 'online'],
  ],
  eu: [
    ['lindenau-coop', 'Lindenau Cooperative Bank', 'mutual'],
    ['bluequay-direct', 'Bluequay Direct', 'online'],
    ['asterhof-coop', 'Asterhof Members Bank', 'mutual'],
    ['rivenna-coop', 'Rivenna Cooperative Bank', 'mutual'],
    ['solvane-online', 'Solvane Online Bank', 'online'],
    ['vellmar-coop', 'Vellmar Community Bank', 'mutual'],
    ['kestria-direct', 'Kestria Direct', 'online'],
  ],
  uk: [
    ['northwold-bs', 'Northwold Building Society', 'mutual'],
    ['calderbrook-direct', 'Calderbrook Direct', 'online'],
    ['pennridge-bs', 'Pennridge Building Society', 'mutual'],
    ['ashcombe-mutual', 'Ashcombe Mutual', 'mutual'],
    ['wrenfield-online', 'Wrenfield Online', 'online'],
    ['greymoor-bs', 'Greymoor Building Society', 'mutual'],
    ['ferrisdale-direct', 'Ferrisdale Direct', 'online'],
  ],
};

const pick = (table: Record<Goal, number[]>, i: number): Record<Goal, number> => ({
  mortgage: table.mortgage[i],
  auto: table.auto[i],
  bnpl: table.bnpl[i],
});

export const LENDERS: Record<Region, LenderProfile[]> = {
  us: NAMES.us.map(([id, name, kind], i) => ({ id, name, kind, discount: pick(SPREADS.us.discount, i), feeRate: pick(SPREADS.us.feeRate, i) })),
  eu: NAMES.eu.map(([id, name, kind], i) => ({ id, name, kind, discount: pick(SPREADS.eu.discount, i), feeRate: pick(SPREADS.eu.feeRate, i) })),
  uk: NAMES.uk.map(([id, name, kind], i) => ({ id, name, kind, discount: pick(SPREADS.uk.discount, i), feeRate: pick(SPREADS.uk.feeRate, i) })),
};

// Typical offer-document fee lines per region, used when the AI scan is unavailable.
export interface FeeTemplate {
  name: string;
  rate: number;
  min: number;
  max: number;
  flag: FeeFlag;
  note: string;
}

const BNPL_FEES = (lateFee: number): FeeTemplate[] => [
  { name: 'Account setup fee', rate: 0.025, min: 10, max: 400, flag: 'junk', note: 'Many installment providers charge nothing to open a plan.' },
  { name: 'Payment processing fee', rate: 0.01, min: 5, max: 200, flag: 'junk', note: 'Avoidable by paying by bank transfer or direct debit.' },
  { name: 'Late payment fee (per occurrence)', rate: 0, min: lateFee, max: lateFee, flag: 'standard', note: 'Only charged if you miss a payment. Set up automatic payments.' },
];

export const FEE_TEMPLATES: Record<Region, Record<Goal, FeeTemplate[]>> = {
  us: {
    mortgage: [
      { name: 'Origination charge', rate: 0.01, min: 0, max: Infinity, flag: 'negotiable', note: 'Credit unions often charge nothing. Ask the bank to waive or match.' },
      { name: 'Application fee', rate: 0.001, min: 300, max: 750, flag: 'junk', note: 'Charged for paperwork already covered by the origination charge.' },
      { name: 'Underwriting fee', rate: 0.002, min: 500, max: 1_500, flag: 'negotiable', note: 'Often reduced when you show a competing Loan Estimate.' },
      { name: 'Processing fee', rate: 0.0015, min: 250, max: 900, flag: 'junk', note: 'A duplicate admin fee with no separate service behind it.' },
      { name: 'Rate lock fee', rate: 0.001, min: 200, max: 800, flag: 'junk', note: 'Most lenders lock for 30–45 days at no cost.' },
      { name: 'Appraisal fee', rate: 0, min: 550, max: 550, flag: 'standard', note: 'Paid to a third-party appraiser. Normal for a mortgage.' },
      { name: 'Credit report fee', rate: 0, min: 50, max: 50, flag: 'standard', note: 'Normal pass-through cost.' },
      { name: 'Title services', rate: 0.003, min: 600, max: 3_000, flag: 'standard', note: 'Shop title providers yourself to lower this.' },
    ],
    auto: [
      { name: 'Loan origination fee', rate: 0.01, min: 0, max: Infinity, flag: 'negotiable', note: 'Many credit unions finance cars with no origination fee.' },
      { name: 'Dealer documentation fee', rate: 0.008, min: 150, max: 800, flag: 'negotiable', note: 'Capped by law in some states. Always ask for a reduction.' },
      { name: 'GAP insurance add-on', rate: 0.022, min: 400, max: 1_200, flag: 'junk', note: 'Usually cheaper through your own auto insurer.' },
      { name: 'Pre-bundled extended warranty', rate: 0.05, min: 900, max: 4_000, flag: 'junk', note: 'Optional. You can decline it and still get the loan.' },
      { name: 'Credit life insurance', rate: 0.015, min: 200, max: 1_500, flag: 'junk', note: 'Optional cover that is often added without asking.' },
      { name: 'Title and registration', rate: 0.006, min: 100, max: 900, flag: 'standard', note: 'Government fees. Normal.' },
    ],
    bnpl: BNPL_FEES(29),
  },
  eu: {
    mortgage: [
      { name: 'Processing fee', rate: 0.006, min: 0, max: Infinity, flag: 'negotiable', note: 'Several banks waive it to win the loan. Ask for a match.' },
      { name: 'Broker commission', rate: 0.01, min: 0, max: Infinity, flag: 'negotiable', note: 'Often negotiable, and some lenders pay it instead of you.' },
      { name: 'Bundled loan insurance', rate: 0.007, min: 600, max: 4_000, flag: 'junk', note: 'You may choose your own insurer if it gives equal cover.' },
      { name: 'Account maintenance fee', rate: 0, min: 240, max: 240, flag: 'junk', note: 'Many lenders charge nothing to service the loan account.' },
      { name: 'Valuation fee', rate: 0, min: 450, max: 450, flag: 'standard', note: 'Paid for the property valuation. Normal for a mortgage.' },
      { name: 'Notary and land registry', rate: 0.015, min: 1_000, max: 20_000, flag: 'standard', note: 'Set by law or official scales. Normal.' },
    ],
    auto: [
      { name: 'Arrangement fee', rate: 0.01, min: 0, max: Infinity, flag: 'negotiable', note: 'Online banks often finance cars with no arrangement fee.' },
      { name: 'Dealer handling fee', rate: 0.006, min: 100, max: 600, flag: 'negotiable', note: 'Ask the dealer to remove it before you sign.' },
      { name: 'Payment protection insurance', rate: 0.03, min: 300, max: 2_500, flag: 'junk', note: 'Optional. You can refuse it and still get the loan.' },
      { name: 'Extended warranty add-on', rate: 0.04, min: 600, max: 3_000, flag: 'junk', note: 'Optional. Usually cheaper bought separately, if at all.' },
      { name: 'Registration and transfer', rate: 0.004, min: 80, max: 600, flag: 'standard', note: 'Official fees. Normal.' },
    ],
    bnpl: BNPL_FEES(25),
  },
  uk: {
    mortgage: [
      { name: 'Product fee', rate: 0.0036, min: 999, max: 1_999, flag: 'negotiable', note: 'Compare fee-free deals. A lower fee can beat a lower rate.' },
      { name: 'Booking fee', rate: 0, min: 199, max: 199, flag: 'junk', note: 'An extra admin charge that many lenders do not have.' },
      { name: 'Mortgage account fee', rate: 0, min: 125, max: 125, flag: 'junk', note: 'Ask for it to be waived. Many lenders charge nothing.' },
      { name: 'Broker fee', rate: 0.002, min: 299, max: 999, flag: 'negotiable', note: 'Many brokers are paid by the lender and charge you nothing.' },
      { name: 'Valuation fee', rate: 0, min: 395, max: 395, flag: 'standard', note: 'Often free on remortgage deals. Normal on a purchase.' },
      { name: 'Legal fees', rate: 0, min: 1_100, max: 1_100, flag: 'standard', note: 'Paid to your conveyancer. Normal.' },
    ],
    auto: [
      { name: 'Arrangement fee', rate: 0.005, min: 0, max: Infinity, flag: 'negotiable', note: 'Many lenders charge nothing. Ask the dealer to match.' },
      { name: 'Dealer admin fee', rate: 0.006, min: 99, max: 400, flag: 'negotiable', note: 'Ask for it to be removed before you sign.' },
      { name: 'GAP insurance add-on', rate: 0.02, min: 300, max: 900, flag: 'junk', note: 'Usually cheaper from a standalone GAP insurer.' },
      { name: 'Paint and fabric protection', rate: 0.02, min: 300, max: 1_200, flag: 'junk', note: 'Optional. You can refuse it and still get the finance.' },
      { name: 'Option to purchase fee', rate: 0, min: 10, max: 10, flag: 'standard', note: 'A small standard fee at the end of the agreement.' },
    ],
    bnpl: BNPL_FEES(12),
  },
};
