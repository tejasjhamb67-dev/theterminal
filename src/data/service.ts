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

// ── Tiny TTL cache ───────────────────────────────────────────────
const cache = new Map<string, { at: number; val: unknown }>();

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.val as T;
  const val = await fn();
  cache.set(key, { at: Date.now(), val });
  return val;
}

// ── Public data API ──────────────────────────────────────────────
export async function getQuote(sec: Security): Promise<Quote> {
  if (mode !== 'sim') {
    try {
      return await cached(`q:${sec.id}`, 10_000, () => yahooQuote(sec));
    } catch {
      /* fall through to sim */
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
