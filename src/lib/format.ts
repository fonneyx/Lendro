import { regionProfile } from './market.js';
import type { Market } from './types.js';

export function formatMoney(n: number, market: Market): string {
  const { locale, currency } = regionProfile(market);
  return n.toLocaleString(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
}

export function formatMoneyCents(n: number, market: Market): string {
  const { locale, currency } = regionProfile(market);
  return n.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const currencySymbol = (market: Market): string =>
  formatMoney(0, market).replace(/[\d.,\s]/g, '');

export const formatPct = (n: number) => `${n.toFixed(2)}%`;
