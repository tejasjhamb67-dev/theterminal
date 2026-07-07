import type { NewsItem } from './types';

/** Lexicon-based headline sentiment: fast, deterministic, explainable. */

const POS = [
  'rally', 'rallies', 'climb', 'climbs', 'gain', 'gains', 'surge', 'surges', 'jump', 'jumps',
  'beat', 'beats', 'upgrade', 'upgrades', 'record', 'records', 'optimism', 'strong', 'firmer',
  'higher', 'up', 'rise', 'rises', 'boost', 'boosts', 'bullish', 'outperform', 'constructive',
  'demand', 'inflows', 'tighter', 'buy', 'positive', 'soar', 'soars', 'advance', 'advances',
];

const NEG = [
  'slip', 'slips', 'fall', 'falls', 'drop', 'drops', 'slide', 'slides', 'miss', 'misses',
  'downgrade', 'downgrades', 'cut', 'cuts', 'fear', 'fears', 'selloff', 'sell-off', 'weak',
  'lower', 'down', 'decline', 'declines', 'bearish', 'underperform', 'warning', 'warns',
  'outflows', 'wider', 'sell', 'negative', 'plunge', 'plunges', 'tumble', 'tumbles', 'risk',
  'lawsuit', 'probe', 'recall', 'default', 'bankruptcy',
];

const posSet = new Set(POS);
const negSet = new Set(NEG);

export type Sentiment = 'pos' | 'neg' | 'neu';

export function scoreHeadline(headline: string): { score: number; sentiment: Sentiment } {
  const words = headline.toLowerCase().replace(/[^a-z\s-]/g, '').split(/\s+/);
  let score = 0;
  for (const w of words) {
    if (posSet.has(w)) score += 1;
    if (negSet.has(w)) score -= 1;
  }
  return { score, sentiment: score > 0 ? 'pos' : score < 0 ? 'neg' : 'neu' };
}

export interface NewsSentiment {
  avg: number; // -1..1 normalized
  pos: number;
  neg: number;
  neu: number;
  label: string;
}

export function aggregateSentiment(items: NewsItem[]): NewsSentiment {
  let pos = 0;
  let neg = 0;
  let neu = 0;
  let total = 0;
  for (const n of items) {
    const { score, sentiment } = scoreHeadline(n.headline);
    total += Math.max(-2, Math.min(2, score));
    if (sentiment === 'pos') pos++;
    else if (sentiment === 'neg') neg++;
    else neu++;
  }
  const avg = items.length ? total / (items.length * 2) : 0;
  const label =
    avg > 0.25 ? 'BULLISH' : avg > 0.08 ? 'LEANS POSITIVE' : avg < -0.25 ? 'BEARISH' : avg < -0.08 ? 'LEANS NEGATIVE' : 'BALANCED';
  return { avg, pos, neg, neu, label };
}
