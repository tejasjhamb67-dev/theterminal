import type { Bar, ChartRange, NewsItem, Quote, Security } from '../core/types';
import { simBars, simNews, simQuote } from './providers/sim';
import { yahooBars, yahooNews, yahooQuote } from './providers/yahoo';

// ── Connector status ─────────────────────────────────────────────
// One probe decides LIVE vs SIM; individual calls still fall back
// per-request so a flaky connector never blanks a screen.

export type DataMode = 'probing' | 'live' | 'sim';

let mode: DataMode = 'probing';
const modeListeners = new Set<(m: DataMode) => void>();

export function getDataMode(): DataMode {
  return mode;
}

export function onDataMode(cb: (m: DataMode) => void): () => void {
  modeListeners.add(cb);
  cb(mode);
  return () => modeListeners.delete(cb);
}

function setMode(m: DataMode) {
  if (mode === m) return;
  mode = m;
  modeListeners.forEach((cb) => cb(m));
}

async function probe() {
  try {
    const res = await fetch('/yf/v8/finance/chart/AAPL?range=1d&interval=30m', {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error('probe failed');
    const j = await res.json();
    if (!j?.chart?.result?.[0]?.meta) throw new Error('probe bad payload');
    setMode('live');
  } catch {
    setMode('sim');
  }
}
probe();
// Auto-reconnect: while in SIM, re-probe so the terminal flips to LIVE the
// moment the connector becomes reachable (network back, proxy up, etc).
setInterval(() => {
  if (mode === 'sim' && (typeof document === 'undefined' || !document.hidden)) probe();
}, 45_000);

// ── Tiny TTL cache ───────────────────────────────────────────────
const cache = new Map<string, { at: number; val: unknown }>();

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.val as T;
  const val = await fn();
  cache.set(key, { at: Date.now(), val });
  return val;
}

// ── Secondary live connectors (failover before sim) ─────────────
const COINGECKO_IDS: Record<string, string> = {
  'BTC-USD': 'bitcoin', 'ETH-USD': 'ethereum', 'SOL-USD': 'solana', 'XRP-USD': 'ripple',
  'DOGE-USD': 'dogecoin', 'ADA-USD': 'cardano', 'AVAX-USD': 'avalanche-2', 'LINK-USD': 'chainlink',
  'DOT-USD': 'polkadot', 'LTC-USD': 'litecoin', 'BCH-USD': 'bitcoin-cash', 'UNI-USD': 'uniswap',
  'XLM-USD': 'stellar', 'TRX-USD': 'tron',
};

async function coingeckoQuote(sec: Security): Promise<Quote> {
  const id = COINGECKO_IDS[sec.yahoo];
  if (!id) throw new Error('not mapped');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
    { signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  const price: number = j[id]?.usd;
  const chgPct: number = j[id]?.usd_24h_change ?? 0;
  if (!price) throw new Error('no price');
  const prevClose = price / (1 + chgPct / 100);
  return {
    secId: sec.id, price, chg: price - prevClose, chgPct, open: prevClose,
    high: Math.max(price, prevClose), low: Math.min(price, prevClose),
    prevClose, time: Date.now(), source: 'live',
  };
}

async function frankfurterQuote(sec: Security): Promise<Quote> {
  const m = /^([A-Z]{3})([A-Z]{3}) Curncy$/.exec(sec.id);
  if (!m) throw new Error('not fx');
  const [, base, quote] = m;
  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${quote}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  const price: number = j?.rates?.[quote];
  if (!price) throw new Error('no rate');
  return {
    secId: sec.id, price, chg: 0, chgPct: 0, open: price, high: price, low: price,
    prevClose: price, time: Date.now(), source: 'live',
  };
}

// ── Public data API ──────────────────────────────────────────────
export async function getQuote(sec: Security): Promise<Quote> {
  if (mode !== 'sim') {
    try {
      return await cached(`q:${sec.id}`, 5_000, () => yahooQuote(sec));
    } catch {
      // Primary connector failed for this security — try secondaries.
      try {
        if (sec.kind === 'crypto') return await cached(`q2:${sec.id}`, 15_000, () => coingeckoQuote(sec));
        if (sec.kind === 'fx') return await cached(`q2:${sec.id}`, 60_000, () => frankfurterQuote(sec));
      } catch {
        /* fall through to sim */
      }
    }
  }
  return simQuote(sec);
}

export async function getQuotes(secs: Security[]): Promise<Quote[]> {
  return Promise.all(secs.map((s) => getQuote(s)));
}

export async function getBars(sec: Security, range: ChartRange): Promise<Bar[]> {
  if (mode !== 'sim') {
    try {
      return await cached(`b:${sec.id}:${range}`, 60_000, () => yahooBars(sec, range));
    } catch {
      /* fall through to sim */
    }
  }
  return simBars(sec, range);
}

export async function getNews(sec?: Security | null): Promise<NewsItem[]> {
  if (mode === 'live') {
    try {
      const q = sec ? sec.yahoo : 'stock market';
      return await cached(`n:${sec?.id ?? 'top'}`, 120_000, () => yahooNews(q));
    } catch {
      /* fall through to sim */
    }
  }
  return simNews(sec);
}
