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
import { formatMoney } from './format.js';
import { planSteps } from './plan.js';
import type { QuizInput } from './types.js';
import { parseQuizInput, parseScannedFees } from './validate.js';

const base: QuizInput = { market: 'us-tx', goal: 'mortgage', amount: 350_000, tier: 'excellent', bankApr: 6.85 };

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
    const tiers = (['excellent', 'good', 'fair', 'building'] as const).map((t) => baselineApr('auto', 'us-ca', t));
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
    expect(new Set(tiers).size).toBe(4);
  });

  it('applies the state adjustment', () => {
    expect(baselineApr('mortgage', 'us-ny', 'excellent')).toBeGreaterThan(baselineApr('mortgage', 'us-ca', 'excellent'));
  });
});

describe('computeAudit', () => {
  it('depends on every input', () => {
    const a = computeAudit(base);
    expect(computeAudit({ ...base, amount: 500_000 }).lifetimeSavings).not.toBe(a.lifetimeSavings);
    expect(computeAudit({ ...base, bankApr: 7.5 }).lifetimeSavings).not.toBe(a.lifetimeSavings);
    expect(computeAudit({ ...base, tier: 'fair' }).best.apr).not.toBe(a.best.apr);
    expect(computeAudit({ ...base, market: 'us-il' }).best.apr).not.toBe(a.best.apr);
    expect(computeAudit({ ...base, goal: 'auto', amount: 32_000 }).best.apr).not.toBe(a.best.apr);
  });

  it('uses the state baseline when there is no bank offer', () => {
    const audit = computeAudit({ ...base, bankApr: null });
    expect(audit.bankLabel).toBe('Texas Baseline');
    expect(audit.bankApr).toBe(baselineApr('mortgage', 'us-tx', 'excellent'));
    expect(audit.lifetimeSavings).toBeGreaterThan(0);
  });

  it('flags an already competitive bank rate and never shows negative savings', () => {
    const audit = computeAudit({ ...base, bankApr: 3 });
    expect(audit.alreadyCompetitive).toBe(true);
    expect(audit.lifetimeSavings).toBeGreaterThanOrEqual(0);
    expect(audit.monthlyDiff).toBe(0);
  });

  it('returns 5 table lenders, best first, top 4 fee-free', () => {
    const audit = computeAudit(base);
    expect(audit.tableLenders).toHaveLength(5);
    expect(audit.best).toEqual(audit.tableLenders[0]);
    expect(audit.tableLenders.slice(0, 4).every((l) => l.originationFee === 0)).toBe(true);
    const aprs = audit.tableLenders.map((l) => l.apr);
    expect(aprs).toEqual([...aprs].sort((x, y) => x - y));
  });

  it('grows savings when the market drops (Rate Watch)', () => {
    const before = computeAudit(base).lifetimeSavings;
    const after = computeAudit(base, { rateShift: -0.25 }).lifetimeSavings;
    expect(after).toBeGreaterThan(before);
  });
});

describe('matchLenders', () => {
  it('never returns a negative APR', () => {
    const quotes = matchLenders({ market: 'us-ca', goal: 'bnpl', amount: 500, tier: 'excellent', bankApr: null });
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
    expect(parseQuizInput({ ...base, market: 'zz' })).toBeNull();
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

describe('markets', () => {
  const de: QuizInput = { market: 'de', goal: 'mortgage', amount: 300_000, tier: 'good', bankApr: 4.4 };
  const uk: QuizInput = { market: 'uk', goal: 'mortgage', amount: 275_000, tier: 'good', bankApr: 5.6 };

  it('formats money in the local currency', () => {
    expect(formatMoney(1234, 'us-tx')).toBe('$1,234');
    expect(formatMoney(1234, 'de')).toBe('\u20ac1,234');
    expect(formatMoney(1234, 'uk')).toBe('\u00a31,234');
  });

  it('prices each region from its own rate table', () => {
    const us = baselineApr('mortgage', 'us-il', 'good');
    const eu = baselineApr('mortgage', 'it', 'good');
    const gb = baselineApr('mortgage', 'uk', 'good');
    expect(eu).toBeLessThan(gb);
    expect(gb).toBeLessThan(us);
    expect(baselineApr('mortgage', 'ie', 'good')).toBeGreaterThan(baselineApr('mortgage', 'es', 'good'));
  });

  it('matches regional lenders and writes the email in local terms', () => {
    const audit = computeAudit(de);
    expect(audit.best.name).toBe('Lindenau Cooperative Bank');
    const email = buildNegotiationEmail(de, audit, simulatedLoanEstimateFees(de));
    expect(email).toContain('\u20ac300,000');
    expect(email).toContain('APRC');
    expect(email).toContain('ESIS');
    expect(email).toContain('Germany');
    expect(email).not.toContain('$');
  });

  it('uses UK lenders, fees and plan steps for the United Kingdom', () => {
    expect(computeAudit(uk).best.name).toBe('Northwold Building Society');
    expect(simulatedLoanEstimateFees(uk).map((f) => f.name)).toContain('Booking fee');
    expect(planSteps('mortgage', 'uk').map((s) => s.id)).toContain('m-erc');
  });

  it('reads saves made before markets existed', () => {
    expect(parseQuizInput({ state: 'NY', goal: 'auto', amount: 20_000, tier: 'fair', bankApr: null })?.market).toBe('us-ny');
  });
});
