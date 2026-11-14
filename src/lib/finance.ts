import {
  AMOUNT_RANGE,
  BANK_FEE_RATE,
  BASE_APR,
  FEE_TEMPLATES,
  LENDERS,
  MORTGAGE_ASSISTANCE_CAP,
  STATE_ADJUSTMENT,
  TERM_MONTHS,
  TIER_ADD_ON,
} from '../data/lenders.js';
import type { Audit, CreditTier, Goal, LenderQuote, QuizInput, ScannedFee, UsState } from './types.js';
import { GOAL_LABELS, STATE_NAMES } from './types.js';

export { AMOUNT_RANGE, TERM_MONTHS };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function monthlyPayment(principal: number, aprPct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = aprPct / 100 / 12;
  if (r <= 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function totalInterest(principal: number, aprPct: number, months: number): number {
  return Math.max(0, monthlyPayment(principal, aprPct, months) * months - principal);
}

export function baselineApr(goal: Goal, state: UsState, tier: CreditTier): number {
  return Math.max(0, round2(BASE_APR[goal] + TIER_ADD_ON[goal][tier] + STATE_ADJUSTMENT[state]));
}

export function clampAmount(goal: Goal, amount: number): number {
  const { min, max } = AMOUNT_RANGE[goal];
  if (!Number.isFinite(amount)) return AMOUNT_RANGE[goal].default;
  return Math.min(max, Math.max(min, Math.round(amount)));
}

export function bankOriginationFee(goal: Goal, amount: number): number {
  return Math.round(amount * BANK_FEE_RATE[goal]);
}

function bankCost(input: QuizInput) {
  const months = TERM_MONTHS[input.goal];
  const apr = input.bankApr ?? baselineApr(input.goal, input.state, input.tier);
  const fee = bankOriginationFee(input.goal, input.amount);
  const interest = totalInterest(input.amount, apr, months);
  return { apr, fee, interest, monthly: monthlyPayment(input.amount, apr, months) };
}

export interface MarketOptions {
  // Shift applied to the lender market only (Rate Watch). The user's bank offer stays fixed.
  rateShift?: number;
}

export function matchLenders(input: QuizInput, options: MarketOptions = {}): LenderQuote[] {
  const { goal, amount } = input;
  const months = TERM_MONTHS[goal];
  const marketBase = baselineApr(goal, input.state, input.tier) + (options.rateShift ?? 0);
  const bank = bankCost(input);
  const bankTotal = bank.interest + bank.fee;

  return LENDERS.map((lender): LenderQuote => {
    const apr = Math.max(0, round2(marketBase - lender.discount[goal]));
    const originationFee = Math.round(amount * lender.feeRate[goal]);
    const interest = totalInterest(amount, apr, months);
    return {
      id: lender.id,
      name: lender.name,
      kind: lender.kind,
      apr,
      originationFee,
      monthly: monthlyPayment(amount, apr, months),
      totalInterest: interest,
      lifetimeSavings: Math.max(0, bankTotal - (interest + originationFee)),
    };
  }).sort((a, b) => a.apr - b.apr || a.originationFee - b.originationFee);
}

export function assistanceEstimate(input: QuizInput): number {
  if (input.goal === 'mortgage') {
    return Math.round(Math.min(input.amount * 0.03, MORTGAGE_ASSISTANCE_CAP[input.state]));
  }
  return Math.round(Math.min(input.amount * 0.01, 500));
}

export function simulatedLoanEstimateFees(input: QuizInput): ScannedFee[] {
  return FEE_TEMPLATES[input.goal].map((t) => ({
    name: t.name,
    amount: Math.round(Math.min(t.max, Math.max(t.min, input.amount * t.rate))),
    flag: t.flag,
    note: t.note,
  }));
}

export function flaggedTotal(fees: ScannedFee[]): number {
  return fees.filter((f) => f.flag !== 'standard').reduce((sum, f) => sum + f.amount, 0);
}

export function computeAudit(input: QuizInput, options: MarketOptions = {}): Audit {
  const bank = bankCost(input);
  const lenders = matchLenders(input, options);
  const best = lenders[0];
  const lifetimeSavings = best.lifetimeSavings;

  return {
    bankLabel: input.bankApr === null ? `${STATE_NAMES[input.state]} Baseline` : 'Your Bank',
    bankApr: bank.apr,
    bankFee: bank.fee,
    bankMonthly: bank.monthly,
    bankTotalInterest: bank.interest,
    best,
    monthlyDiff: Math.max(0, bank.monthly - best.monthly),
    lifetimeSavings,
    alreadyCompetitive: bank.apr <= best.apr,
    previewLenders: lenders.slice(0, 4),
    tableLenders: lenders.slice(0, 5),
    assistanceEstimate: assistanceEstimate(input),
    bankFeesFlaggedEstimate: flaggedTotal(simulatedLoanEstimateFees(input)),
  };
}

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function buildNegotiationEmail(input: QuizInput, audit: Audit, fees: ScannedFee[]): string {
  const goal = GOAL_LABELS[input.goal].toLowerCase();
  const flagged = fees.filter((f) => f.flag !== 'standard');
  const feeLines = flagged.length
    ? flagged.map((f) => `- ${f.name}: ${usd(f.amount)}`).join('\n')
    : '- No avoidable fees found on the estimate.';
  const rateLine = audit.alreadyCompetitive
    ? `Your ${audit.bankApr.toFixed(2)}% APR is already competitive, so I would like to focus on fees.`
    : `I have a written option at ${audit.best.apr.toFixed(2)}% APR with ${usd(audit.best.originationFee)} in origination fees, compared with your offer of ${audit.bankApr.toFixed(2)}%. Over the life of the loan that difference is about ${usd(audit.lifetimeSavings)}.`;

  return [
    `Subject: Request to review my ${usd(input.amount)} ${goal} offer`,
    '',
    'Hello,',
    '',
    `Thank you for the ${goal} offer for ${usd(input.amount)}. Before I sign, I have compared it with other lenders in ${STATE_NAMES[input.state]}.`,
    '',
    rateLine,
    '',
    'I would also like these charges removed or reduced:',
    feeLines,
    '',
    `Could you match ${audit.alreadyCompetitive ? 'this request' : `a ${audit.best.apr.toFixed(2)}% APR`} and waive the fees above? I would prefer to stay with you if we can close the gap. Please send an updated Loan Estimate by the end of the week.`,
    '',
    'Thank you,',
    '[Your name]',
  ].join('\n');
}
