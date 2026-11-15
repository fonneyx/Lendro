import { MARKETS, REGIONS } from '../data/markets.js';
import type { RegionProfile } from '../data/markets.js';
import type { CreditTier, Goal, Market, Region } from './types.js';

export const regionOf = (market: Market): Region => MARKETS[market].region;
export const regionProfile = (market: Market): RegionProfile => REGIONS[regionOf(market)];
export const marketName = (market: Market): string => MARKETS[market].name;
// For running text: "lenders in the United Kingdom", "lenders in Texas".
const WITH_ARTICLE: Partial<Record<Market, true>> = { uk: true, nl: true };
export const placeName = (market: Market): string => (WITH_ARTICLE[market] ? `the ${marketName(market)}` : marketName(market));
export const isUs = (market: Market): boolean => regionOf(market) === 'us';

export const rateTerm = (market: Market) => regionProfile(market).rateTerm;
export const goalLabel = (goal: Goal, market: Market) => regionProfile(market).goalLabels[goal];
export const goalNoun = (goal: Goal, market: Market) => goalLabel(goal, market).toLowerCase();
export const documentName = (goal: Goal, market: Market) => regionProfile(market).documents[goal];
export const feeTerm = (market: Market) => regionProfile(market).feeTerm;
export const mutualLabel = (market: Market) => regionProfile(market).mutualLabel;
export const termMonths = (goal: Goal, market: Market) => regionProfile(market).termMonths[goal];
export const defaultAmount = (goal: Goal, market: Market) => regionProfile(market).defaultAmount[goal];

export function tierLabel(tier: CreditTier, market: Market): string {
  const t = regionProfile(market).tiers[tier];
  return isUs(market) ? `${t.hint} ${t.name}` : t.name;
}

const COUNTRY_TO_MARKET: Record<string, Market> = {
  US: 'us-tx',
  DE: 'de',
  AT: 'de',
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',
  ES: 'es',
  PT: 'es',
  IT: 'it',
  NL: 'nl',
  IE: 'ie',
  GB: 'uk',
  UK: 'uk',
};

// Best guess from the browser's language settings; the user can change it in the quiz.
export function detectMarket(languages: readonly string[]): Market {
  for (const tag of languages) {
    const country = tag.split('-')[1]?.toUpperCase();
    if (country && COUNTRY_TO_MARKET[country]) return COUNTRY_TO_MARKET[country];
  }
  return 'us-tx';
}
