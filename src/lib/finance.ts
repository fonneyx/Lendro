import { AMOUNT_RANGE, FEE_TEMPLATES, LENDERS } from '../data/lenders.js';
import { MARKETS } from '../data/markets.js';
import { formatMoney } from './format.js';
import { documentName, feeTerm, goalNoun, marketName, placeName, rateTerm, regionOf, regionProfile, termMonths } from './market.js';
import type { Audit, CreditTier, Goal, LenderQuote, Market, QuizInput, ScannedFee } from './types.js';

export { AMOUNT_RANGE };

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

export function baselineApr(goal: Goal, market: Market, tier: CreditTier): number {
  const region = regionProfile(market);
  return Math.max(0, round2(region.baseApr[goal] + region.tierAddOn[goal][tier] + MARKETS[market].rateAdjust));
}

export function clampAmount(goal: Goal, amount: number): number {
  const { min, max } = AMOUNT_RANGE[goal];
  if (!Number.isFinite(amount)) return min;
  return Math.min(max, Math.max(min, Math.round(amount)));
}

export function bankOriginationFee(goal: Goal, market: Market, amount: number): number {
  return Math.round(amount * regionProfile(market).bankFeeRate[goal]);
}

function bankCost(input: QuizInput) {
  const months = termMonths(input.goal, input.market);
  const apr = input.bankApr ?? baselineApr(input.goal, input.market, input.tier);
  const fee = bankOriginationFee(input.goal, input.market, input.amount);
  const interest = totalInterest(input.amount, apr, months);
  return { apr, fee, interest, monthly: monthlyPayment(input.amount, apr, months) };
}

export interface MarketOptions {
  // Shift applied to the lender market only (Rate Watch). The user's bank offer stays fixed.
  rateShift?: number;
}

export function matchLenders(input: QuizInput, options: MarketOptions = {}): LenderQuote[] {
  const { goal, amount, market } = input;
  const months = termMonths(goal, market);
  const marketBase = baselineApr(goal, market, input.tier) + (options.rateShift ?? 0);
  const bank = bankCost(input);
  const bankTotal = bank.interest + bank.fee;

  return LENDERS[regionOf(market)]
    .map((lender): LenderQuote => {
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
    })
    .sort((a, b) => a.apr - b.apr || a.originationFee - b.originationFee);
}

export function simulatedLoanEstimateFees(input: QuizInput): ScannedFee[] {
  return FEE_TEMPLATES[regionOf(input.market)][input.goal].map((t) => ({
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

  return {
    bankLabel: input.bankApr === null ? `${marketName(input.market)} Baseline` : 'Your Bank',
    bankApr: bank.apr,
    bankFee: bank.fee,
    bankMonthly: bank.monthly,
    bankTotalInterest: bank.interest,
    best,
    monthlyDiff: Math.max(0, bank.monthly - best.monthly),
    lifetimeSavings: best.lifetimeSavings,
    alreadyCompetitive: bank.apr <= best.apr,
    tableLenders: lenders.slice(0, 5),
    bankFeesFlaggedEstimate: flaggedTotal(simulatedLoanEstimateFees(input)),
  };
}

export function buildNegotiationEmail(input: QuizInput, audit: Audit, fees: ScannedFee[]): string {
  const { market } = input;
  const money = (n: number) => formatMoney(n, market);
  const goal = goalNoun(input.goal, market);
  const term = rateTerm(market);
  const flagged = fees.filter((f) => f.flag !== 'standard');
  const feeLines = flagged.length
    ? flagged.map((f) => `- ${f.name}: ${money(f.amount)}`).join('\n')
    : '- No avoidable fees found in the offer.';
  const rateLine = audit.alreadyCompetitive
    ? `Your ${audit.bankApr.toFixed(2)}% ${term} is already competitive, so I would like to focus on fees.`
    : `I have a written option at ${audit.best.apr.toFixed(2)}% ${term} with ${money(audit.best.originationFee)} in ${feeTerm(market)}s, compared with your offer of ${audit.bankApr.toFixed(2)}%. Over the life of the loan that difference is about ${money(audit.lifetimeSavings)}.`;

  return [
    `Subject: Request to review my ${money(input.amount)} ${goal} offer`,
    '',
    'Hello,',
    '',
    `Thank you for the ${goal} offer for ${money(input.amount)}. Before I sign, I have compared it with other lenders in ${placeName(market)}.`,
    '',
    rateLine,
    '',
    'I would also like these charges removed or reduced:',
    feeLines,
    '',
    `Could you match ${audit.alreadyCompetitive ? 'this request' : `a ${audit.best.apr.toFixed(2)}% ${term}`} and waive the fees above? I would prefer to stay with you if we can close the gap. Please send an updated ${documentName(input.goal, market)} by the end of the week.`,
    '',
    'Thank you,',
    '[Your name]',
  ].join('\n');
}
