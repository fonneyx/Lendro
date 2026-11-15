import type { CreditTier, Currency, Goal, Market, Region } from '../lib/types.js';

// Market rules per region. Rates are sample values tuned near 2026 averages for each
// region and are applied to the user's inputs by src/lib/finance.ts.

export interface RegionProfile {
  name: string;
  currency: Currency;
  // Locale used only for number and currency formatting; the interface stays in English.
  locale: string;
  rateTerm: 'APR' | 'APRC';
  termMonths: Record<Goal, number>;
  defaultAmount: Record<Goal, number>;
  baseApr: Record<Goal, number>;
  tierAddOn: Record<Goal, Record<CreditTier, number>>;
  bankFeeRate: Record<Goal, number>;
  goalLabels: Record<Goal, string>;
  tiers: Record<CreditTier, { name: string; hint: string }>;
  // Name of the offer document a lender must give before signing.
  documents: Record<Goal, string>;
  mutualLabel: string;
  feeTerm: string;
  noIdLabel: string;
  monthlyPrice: number;
}

export interface MarketProfile {
  region: Region;
  name: string;
  // Percentage points added to the regional base rate.
  rateAdjust: number;
}

const SAME_TERMS: Record<Goal, number> = { mortgage: 300, auto: 60, bnpl: 12 };

export const REGIONS: Record<Region, RegionProfile> = {
  us: {
    name: 'United States',
    currency: 'USD',
    locale: 'en-US',
    rateTerm: 'APR',
    termMonths: { mortgage: 360, auto: 60, bnpl: 12 },
    defaultAmount: { mortgage: 350_000, auto: 32_000, bnpl: 3_000 },
    baseApr: { mortgage: 6.25, auto: 6.0, bnpl: 12.0 },
    tierAddOn: {
      mortgage: { excellent: 0, good: 0.45, fair: 1.1, building: 2.0 },
      auto: { excellent: 0, good: 1.5, fair: 4.5, building: 8.5 },
      bnpl: { excellent: 0, good: 4.0, fair: 9.0, building: 15.0 },
    },
    bankFeeRate: { mortgage: 0.01, auto: 0.01, bnpl: 0.025 },
    goalLabels: { mortgage: 'Home Mortgage', auto: 'Auto Loan', bnpl: 'BNPL Installment' },
    tiers: {
      excellent: { name: 'Excellent', hint: '740+' },
      good: { name: 'Good', hint: '680–739' },
      fair: { name: 'Fair', hint: '620–679' },
      building: { name: 'Building', hint: 'Below 620' },
    },
    documents: { mortgage: 'Loan Estimate', auto: 'auto loan offer', bnpl: 'installment agreement' },
    mutualLabel: 'Credit union',
    feeTerm: 'origination fee',
    noIdLabel: 'No SSN Required',
    monthlyPrice: 29,
  },
  eu: {
    name: 'Eurozone',
    currency: 'EUR',
    locale: 'en-IE',
    rateTerm: 'APRC',
    termMonths: SAME_TERMS,
    defaultAmount: { mortgage: 300_000, auto: 28_000, bnpl: 2_000 },
    baseApr: { mortgage: 3.45, auto: 5.9, bnpl: 9.5 },
    tierAddOn: {
      mortgage: { excellent: 0, good: 0.3, fair: 0.8, building: 1.5 },
      auto: { excellent: 0, good: 1.2, fair: 3.5, building: 6.5 },
      bnpl: { excellent: 0, good: 3.0, fair: 7.0, building: 12.0 },
    },
    bankFeeRate: { mortgage: 0.006, auto: 0.01, bnpl: 0.02 },
    goalLabels: { mortgage: 'Home Mortgage', auto: 'Car Loan', bnpl: 'Installment Plan' },
    tiers: {
      excellent: { name: 'Excellent', hint: 'No missed payments' },
      good: { name: 'Good', hint: 'One or two late payments' },
      fair: { name: 'Fair', hint: 'Recent missed payments' },
      building: { name: 'Building', hint: 'Little or no history' },
    },
    documents: { mortgage: 'ESIS', auto: 'SECCI form', bnpl: 'SECCI form' },
    mutualLabel: 'Cooperative bank',
    feeTerm: 'arrangement fee',
    noIdLabel: 'No ID Number Required',
    monthlyPrice: 29,
  },
  uk: {
    name: 'United Kingdom',
    currency: 'GBP',
    locale: 'en-GB',
    rateTerm: 'APRC',
    termMonths: SAME_TERMS,
    defaultAmount: { mortgage: 275_000, auto: 25_000, bnpl: 2_000 },
    baseApr: { mortgage: 4.55, auto: 7.9, bnpl: 12.9 },
    tierAddOn: {
      mortgage: { excellent: 0, good: 0.35, fair: 1.0, building: 2.0 },
      auto: { excellent: 0, good: 1.5, fair: 4.5, building: 8.5 },
      bnpl: { excellent: 0, good: 4.0, fair: 9.0, building: 15.0 },
    },
    bankFeeRate: { mortgage: 0.004, auto: 0.005, bnpl: 0.02 },
    goalLabels: { mortgage: 'Mortgage', auto: 'Car Finance', bnpl: 'Buy Now, Pay Later' },
    tiers: {
      excellent: { name: 'Excellent', hint: 'No missed payments' },
      good: { name: 'Good', hint: 'One or two late payments' },
      fair: { name: 'Fair', hint: 'Recent missed payments' },
      building: { name: 'Building', hint: 'Little or no history' },
    },
    documents: { mortgage: 'mortgage illustration (ESIS)', auto: 'finance agreement', bnpl: 'credit agreement' },
    mutualLabel: 'Building society',
    feeTerm: 'arrangement fee',
    noIdLabel: 'No ID Number Required',
    monthlyPrice: 24,
  },
};

export const MARKETS: Record<Market, MarketProfile> = {
  'us-tx': { region: 'us', name: 'Texas', rateAdjust: 0.05 },
  'us-ca': { region: 'us', name: 'California', rateAdjust: -0.05 },
  'us-ny': { region: 'us', name: 'New York', rateAdjust: 0.1 },
  'us-fl': { region: 'us', name: 'Florida', rateAdjust: 0.08 },
  'us-il': { region: 'us', name: 'Illinois', rateAdjust: 0 },
  de: { region: 'eu', name: 'Germany', rateAdjust: 0.25 },
  fr: { region: 'eu', name: 'France', rateAdjust: -0.1 },
  es: { region: 'eu', name: 'Spain', rateAdjust: -0.3 },
  it: { region: 'eu', name: 'Italy', rateAdjust: 0 },
  nl: { region: 'eu', name: 'Netherlands', rateAdjust: 0.3 },
  ie: { region: 'eu', name: 'Ireland', rateAdjust: 0.45 },
  uk: { region: 'uk', name: 'United Kingdom', rateAdjust: 0 },
};
