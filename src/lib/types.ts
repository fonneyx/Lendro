export type View = 'landing' | 'quiz' | 'preview' | 'trial' | 'dashboard';
export type Goal = 'mortgage' | 'auto' | 'bnpl';
export type Region = 'us' | 'eu' | 'uk';
export type Market = 'us-tx' | 'us-ca' | 'us-ny' | 'us-fl' | 'us-il' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'ie' | 'uk';
export type Currency = 'USD' | 'EUR' | 'GBP';
export type CreditTier = 'excellent' | 'good' | 'fair' | 'building';

export interface QuizInput {
  market: Market;
  goal: Goal;
  amount: number;
  tier: CreditTier;
  // Percent, e.g. 6.85 (APR in the US, APRC in Europe). null = compare against the market baseline.
  bankApr: number | null;
}

export interface LenderQuote {
  id: string;
  name: string;
  kind: 'mutual' | 'online';
  apr: number;
  originationFee: number;
  monthly: number;
  totalInterest: number;
  lifetimeSavings: number;
}

export interface Audit {
  bankLabel: string;
  bankApr: number;
  bankFee: number;
  bankMonthly: number;
  bankTotalInterest: number;
  best: LenderQuote;
  monthlyDiff: number;
  lifetimeSavings: number;
  alreadyCompetitive: boolean;
  tableLenders: LenderQuote[];
  bankFeesFlaggedEstimate: number;
}

export type FeeFlag = 'junk' | 'negotiable' | 'standard';

export interface ScannedFee {
  name: string;
  amount: number;
  flag: FeeFlag;
  note: string;
}

export interface ScanResult {
  fees: ScannedFee[];
  totalFlagged: number;
  summary: string;
  emailScript: string;
  source: 'ai' | 'simulated';
}

export const GOALS: Goal[] = ['mortgage', 'auto', 'bnpl'];
export const CREDIT_TIERS: CreditTier[] = ['excellent', 'good', 'fair', 'building'];
export const US_MARKETS: Market[] = ['us-tx', 'us-ca', 'us-ny', 'us-fl', 'us-il'];
export const EUROPE_MARKETS: Market[] = ['de', 'fr', 'es', 'it', 'nl', 'ie', 'uk'];
export const MARKET_LIST: Market[] = [...US_MARKETS, ...EUROPE_MARKETS];
