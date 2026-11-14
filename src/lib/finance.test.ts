import { describe, expect, it } from 'vitest';
import {
  baselineApr,
  buildNegotiationEmail,
  clampAmount,
  computeAudit,
  matchLenders,
  monthlyPayment,
  simulatedLoanEstimateFees,
  totalInterest,
} from './finance.js';
import type { QuizInput } from './types.js';
import { parseQuizInput, parseScannedFees } from './validate.js';

const base: QuizInput = { state: 'TX', goal: 'mortgage', amount: 350_000, tier: 'excellent', bankApr: 6.85 };

describe('monthlyPayment', () => {
  it('matches the standard amortization formula', () => {
    // $350,000 at 6.85% for 30 years is about $2,293.38 a month.
    expect(monthlyPayment(350_000, 6.85, 360)).toBeCloseTo(2293.38, 1);
  });

  it('splits principal evenly at 0% APR', () => {
    expect(monthlyPayment(1_200, 0, 12)).toBe(100);
  });

  it('returns 0 for empty loans', () => {
    expect(monthlyPayment(0, 5, 60)).toBe(0);
  });
});

describe('totalInterest', () => {
  it('is payments minus principal', () => {
    const p = monthlyPayment(32_000, 7, 60);
    expect(totalInterest(32_000, 7, 60)).toBeCloseTo(p * 60 - 32_000, 6);
  });
});

describe('baselineApr', () => {
  it('rises as the credit tier drops', () => {
    const tiers = (['excellent', 'good', 'fair', 'building'] as const).map((t) => baselineApr('auto', 'CA', t));
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
    expect(new Set(tiers).size).toBe(4);
  });

  it('applies the state adjustment', () => {
    expect(baselineApr('mortgage', 'NY', 'excellent')).toBeGreaterThan(baselineApr('mortgage', 'CA', 'excellent'));
  });
});

describe('computeAudit', () => {
  it('depends on every input', () => {
    const a = computeAudit(base);
    expect(computeAudit({ ...base, amount: 500_000 }).lifetimeSavings).not.toBe(a.lifetimeSavings);
    expect(computeAudit({ ...base, bankApr: 7.5 }).lifetimeSavings).not.toBe(a.lifetimeSavings);
    expect(computeAudit({ ...base, tier: 'fair' }).best.apr).not.toBe(a.best.apr);
    expect(computeAudit({ ...base, state: 'IL' }).best.apr).not.toBe(a.best.apr);
    expect(computeAudit({ ...base, goal: 'auto', amount: 32_000 }).best.apr).not.toBe(a.best.apr);
  });

  it('uses the state baseline when there is no bank offer', () => {
    const audit = computeAudit({ ...base, bankApr: null });
    expect(audit.bankLabel).toBe('Texas Baseline');
    expect(audit.bankApr).toBe(baselineApr('mortgage', 'TX', 'excellent'));
    expect(audit.lifetimeSavings).toBeGreaterThan(0);
  });

  it('flags an already competitive bank rate and never shows negative savings', () => {
    const audit = computeAudit({ ...base, bankApr: 3 });
    expect(audit.alreadyCompetitive).toBe(true);
    expect(audit.lifetimeSavings).toBeGreaterThanOrEqual(0);
    expect(audit.monthlyDiff).toBe(0);
  });

  it('returns 4 preview lenders and 5 table lenders, best first, top 4 fee-free', () => {
    const audit = computeAudit(base);
    expect(audit.previewLenders).toHaveLength(4);
    expect(audit.tableLenders).toHaveLength(5);
    expect(audit.best).toEqual(audit.tableLenders[0]);
    expect(audit.previewLenders.every((l) => l.originationFee === 0)).toBe(true);
    const aprs = audit.tableLenders.map((l) => l.apr);
    expect(aprs).toEqual([...aprs].sort((x, y) => x - y));
  });

  it('caps mortgage assistance by state', () => {
    expect(computeAudit({ ...base, amount: 1_500_000 }).assistanceEstimate).toBe(10_000);
    expect(computeAudit({ ...base, amount: 100_000 }).assistanceEstimate).toBe(3_000);
  });

  it('grows savings when the market drops (Rate Watch)', () => {
    const before = computeAudit(base).lifetimeSavings;
    const after = computeAudit(base, { rateShift: -0.25 }).lifetimeSavings;
    expect(after).toBeGreaterThan(before);
  });
});

describe('matchLenders', () => {
  it('never returns a negative APR', () => {
    const quotes = matchLenders({ state: 'CA', goal: 'bnpl', amount: 500, tier: 'excellent', bankApr: null });
    expect(quotes.every((q) => q.apr >= 0)).toBe(true);
  });
});

describe('fees and email', () => {
  it('scales simulated fees with the loan amount', () => {
    const small = simulatedLoanEstimateFees({ ...base, amount: 150_000 });
    const large = simulatedLoanEstimateFees({ ...base, amount: 900_000 });
    expect(large[0].amount).toBeGreaterThan(small[0].amount);
  });

  it('puts the user numbers into the negotiation email', () => {
    const audit = computeAudit(base);
    const email = buildNegotiationEmail(base, audit, simulatedLoanEstimateFees(base));
    expect(email).toContain('$350,000');
    expect(email).toContain('Texas');
    expect(email).toContain(audit.best.apr.toFixed(2));
  });
});

describe('validation', () => {
  it('accepts a valid input and clamps the amount', () => {
    expect(parseQuizInput({ ...base, amount: 10 })?.amount).toBe(50_000);
    expect(clampAmount('bnpl', 999_999)).toBe(20_000);
  });

  it('rejects bad inputs', () => {
    expect(parseQuizInput({ ...base, state: 'ZZ' })).toBeNull();
    expect(parseQuizInput({ ...base, bankApr: -1 })).toBeNull();
    expect(parseQuizInput(null)).toBeNull();
  });

  it('cleans model fee output', () => {
    const fees = parseScannedFees([
      { name: 'Origination', amount: 3500.4, flag: 'negotiable', note: 'x' },
      { name: '', amount: 10, flag: 'junk', note: '' },
      { name: 'Odd', amount: 'a lot', flag: 'junk', note: '' },
      { name: 'Unknown flag', amount: 50, flag: 'weird', note: '' },
    ]);
    expect(fees).toEqual([
      { name: 'Origination', amount: 3500, flag: 'negotiable', note: 'x' },
      { name: 'Unknown flag', amount: 50, flag: 'standard', note: '' },
    ]);
  });
});
