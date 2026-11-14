export type View = 'landing' | 'quiz' | 'preview' | 'trial' | 'dashboard';
export type Goal = 'mortgage' | 'auto' | 'bnpl';
export type UsState = 'TX' | 'CA' | 'NY' | 'FL' | 'IL';
export type CreditTier = 'excellent' | 'good' | 'fair' | 'building';

export interface QuizInput {
  state: UsState;
  goal: Goal;
  amount: number;
  tier: CreditTier;
  bankApr: number | null;
}

export interface LenderQuote {
  id: string;
  name: string;
  kind: 'credit_union' | 'online_lender';
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
  previewLenders: LenderQuote[];
  tableLenders: LenderQuote[];
  assistanceEstimate: number;
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
export const US_STATES: UsState[] = ['TX', 'CA', 'NY', 'FL', 'IL'];
export const CREDIT_TIERS: CreditTier[] = ['excellent', 'good', 'fair', 'building'];

export const STATE_NAMES: Record<UsState, string> = {
  TX: 'Texas',
  CA: 'California',
  NY: 'New York',
  FL: 'Florida',
  IL: 'Illinois',
};

export const GOAL_LABELS: Record<Goal, string> = {
  mortgage: 'Home Mortgage',
  auto: 'Auto Loan',
  bnpl: 'BNPL Installment',
};

export const TIER_LABELS: Record<CreditTier, string> = {
  excellent: '740+ Excellent',
  good: '680–739 Good',
  fair: '620–679 Fair',
  building: 'Below 620 Building',
};
