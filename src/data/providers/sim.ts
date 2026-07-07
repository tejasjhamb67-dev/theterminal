import type { Bar, ChartRange, NewsItem, Quote, Security } from '../../core/types';
import { UNIVERSE } from '../universe';

// ── Deterministic PRNG ────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard-normal-ish sample from a uniform PRNG (Box–Muller). */
function gauss(rng: () => number): number {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const DAY = 86400;

// ── Daily history ────────────────────────────────────────────────
// Deterministic per security: same series every run, anchored so the
// final daily close equals the security's simBase "today".
const dailyCache = new Map<string, Bar[]>();

function dailyBars(sec: Security): Bar[] {
  const hit = dailyCache.get(sec.id);
  if (hit) return hit;
  const rng = mulberry32(hashStr(sec.id));
  const n = 260 * 5; // ~5 years of trading days
  const dailyVol = sec.simVol / Math.sqrt(252);
  // Build a log-price path backwards from simBase.
  const rets: number[] = [];
  for (let i = 0; i < n; i++) rets.push(gauss(rng) * dailyVol + 0.0002);
  const closes: number[] = new Array(n);
  closes[n - 1] = sec.simBase;
  for (let i = n - 2; i >= 0; i--) closes[i] = closes[i + 1] / Math.exp(rets[i + 1]);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const bars: Bar[] = [];
  let t = Math.floor(today.getTime() / 1000);
  const times: number[] = [];
  // Walk back over weekdays.
  for (let i = 0; i < n; i++) {
    times.unshift(t);
    t -= DAY;
    let dow = new Date(t * 1000).getUTCDay();
    while (dow === 0 || dow === 6) {
      t -= DAY;
      dow = new Date(t * 1000).getUTCDay();
    }
  }
  for (let i = 0; i < n; i++) {
    const c = closes[i];
    const o = i === 0 ? c * (1 - dailyVol / 2) : closes[i - 1] * (1 + gauss(rng) * dailyVol * 0.3);
    const hi = Math.max(o, c) * (1 + Math.abs(gauss(rng)) * dailyVol * 0.5);
    const lo = Math.min(o, c) * (1 - Math.abs(gauss(rng)) * dailyVol * 0.5);
    bars.push({
      time: times[i],
      open: o,
      high: hi,
      low: lo,
      close: c,
      volume: Math.round((5e6 + rng() * 4e7) * (sec.kind === 'stock' || sec.kind === 'etf' ? 1 : 0)),
    });
  }
  dailyCache.set(sec.id, bars);
  return bars;
}

// ── Live tick state ──────────────────────────────────────────────
// A single evolving price per security so every screen agrees.
interface TickState {
  price: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  lastT: number;
  intraday: Bar[]; // 1-minute bars accumulated this session
}

const tickStates = new Map<string, TickState>();
const liveRng = mulberry32(hashStr('session' + new Date().toDateString()));

function tickState(sec: Security): TickState {
  let st = tickStates.get(sec.id);
  if (!st) {
    const hist = dailyBars(sec);
    const prevClose = hist[hist.length - 1].close;
    const rng = mulberry32(hashStr(sec.id + new Date().toDateString()));
    const gap = gauss(rng) * (sec.simVol / Math.sqrt(252)) * 0.6;
    const open = prevClose * Math.exp(gap);
    // Pre-fill the session so intraday charts look alive on first open:
    // simulate from session start (~6.5h ago max) to now in 1-min steps.
    const now = Math.floor(Date.now() / 1000);
    const sessionStart = now - Math.min(6.5 * 3600, Math.max(3600, (new Date().getUTCHours() - 8 + 24) % 24 * 3600));
    const minVol = sec.simVol / Math.sqrt(252 * 390);
    const intraday: Bar[] = [];
    let p = open;
    let hi = open;
    let lo = open;
    let vol = 0;
    for (let t = sessionStart; t <= now; t += 60) {
      const o = p;
      p = p * Math.exp(gauss(rng) * minVol);
      const bh = Math.max(o, p) * (1 + Math.abs(gauss(rng)) * minVol * 0.4);
      const bl = Math.min(o, p) * (1 - Math.abs(gauss(rng)) * minVol * 0.4);
      hi = Math.max(hi, bh);
      lo = Math.min(lo, bl);
      const v = Math.round(rng() * 8e5);
      vol += v;
      intraday.push({ time: t, open: o, high: bh, low: bl, close: p, volume: v });
    }
    st = { price: p, open, high: hi, low: lo, prevClose, volume: vol, lastT: now, intraday };
    tickStates.set(sec.id, st);
  }
  return st;
}

/** Advance a security's simulated price to "now". */
function advance(sec: Security): TickState {
  const st = tickState(sec);
  const now = Math.floor(Date.now() / 1000);
  const dt = now - st.lastT;
  if (dt <= 0) return st;
  const minVol = sec.simVol / Math.sqrt(252 * 390);
  const step = minVol * Math.sqrt(Math.min(dt, 300) / 60);
  st.price = st.price * Math.exp(gauss(liveRng) * step);
  st.high = Math.max(st.high, st.price);
  st.low = Math.min(st.low, st.price);
  st.volume += Math.round(liveRng() * 5e5 * (dt / 60));
  st.lastT = now;
  const last = st.intraday[st.intraday.length - 1];
  const minute = now - (now % 60);
  if (last && last.time === minute) {
    last.close = st.price;
    last.high = Math.max(last.high, st.price);
    last.low = Math.min(last.low, st.price);
  } else {
    st.intraday.push({ time: minute, open: st.price, high: st.price, low: st.price, close: st.price, volume: 0 });
  }
  return st;
}

// ── Public sim API ───────────────────────────────────────────────
export function simQuote(sec: Security): Quote {
  const st = advance(sec);
  const chg = st.price - st.prevClose;
  return {
    secId: sec.id,
    price: st.price,
    chg,
    chgPct: (chg / st.prevClose) * 100,
    open: st.open,
    high: st.high,
    low: st.low,
    prevClose: st.prevClose,
    volume: st.volume || undefined,
    time: Date.now(),
    source: 'sim',
  };
}

export function simBars(sec: Security, range: ChartRange): Bar[] {
  if (range === '1D') return advance(sec).intraday.slice();
  if (range === '5D') {
    const daily = dailyBars(sec);
    return daily.slice(-5).concat();
  }
  const daily = dailyBars(sec);
  const count = range === '1M' ? 22 : range === '6M' ? 128 : range === '1Y' ? 252 : daily.length;
  return daily.slice(-count);
}

// ── Simulated news ───────────────────────────────────────────────
const NEWS_TEMPLATES: Array<[string, string]> = [
  ['{name} Shares {dir} as Traders Weigh Earnings Outlook', 'Markets'],
  ['{name} Draws Analyst Upgrades After Guidance Reset', 'Equities'],
  ['Options Traders Position for Bigger Swings in {name}', 'Derivatives'],
  ['{name} Bonds Rally as Credit Desks Turn Constructive', 'Credit'],
  ['Fund Flows Show Rotation Into {sector} Names Like {name}', 'Flows'],
  ['{name} Said to Explore Strategic Options for Key Unit', 'M&A'],
  ['Supply-Chain Data Point to Firmer Quarter for {name}', 'Intelligence'],
  ['{name} Volatility Slides to Three-Month Low', 'Volatility'],
];

const MACRO_HEADLINES: string[] = [
  'Treasuries Steady as Traders Parse Fed Speakers Before CPI',
  'Dollar Holds Gains While Stocks Drift at Records',
  'Oil Slips as OPEC+ Supply Signals Offset Demand Optimism',
  'Gold Hovers Near Highs on Haven Demand and ETF Inflows',
  'Global Bonds Firm as Investors Add Duration Into Data Week',
  'Emerging-Market Currencies Rally on Soft Dollar, Carry Demand',
  'Fed Cut Bets Firm After Cooler Labor-Market Signals',
  'European Stocks Edge Up as Earnings Season Beats Estimates',
  'Copper Extends Rally on Grid Spending and Tight Inventories',
  'Bitcoin Holds Above Six Figures as ETF Demand Persists',
  'Yen Steadies as BOJ Officials Flag Gradual Policy Path',
  'Credit Spreads Grind Tighter With New-Issue Calendar Heavy',
];

export function simNews(sec?: Security | null, count = 18): NewsItem[] {
  const now = Date.now();
  const seed = hashStr('news' + new Date().toDateString() + (sec?.id ?? 'TOP'));
  const rng = mulberry32(seed);
  const items: NewsItem[] = [];
  const sources = ['Terminal Wire', 'First Word', 'Market Desk', 'Macro Brief', 'Global IQ'];
  if (sec) {
    for (let i = 0; i < count; i++) {
      const [tpl, topic] = NEWS_TEMPLATES[Math.floor(rng() * NEWS_TEMPLATES.length)];
      const dir = rng() > 0.5 ? 'Climb' : 'Slip';
      items.push({
        id: `sim-${sec.id}-${i}`,
        headline: tpl
          .replace('{name}', sec.name)
          .replace('{sector}', sec.sector ?? 'Cyclical')
          .replace('{dir}', dir),
        source: sources[Math.floor(rng() * sources.length)],
        time: now - Math.floor(rng() * 36) * 3600_000 - Math.floor(rng() * 3600_000),
        secIds: [sec.id],
        topic,
      });
    }
  } else {
    const shuffled = [...MACRO_HEADLINES].sort(() => rng() - 0.5);
    shuffled.forEach((h, i) =>
      items.push({
        id: `sim-top-${i}`,
        headline: h,
        source: sources[Math.floor(rng() * sources.length)],
        time: now - i * (14 + Math.floor(rng() * 40)) * 60_000,
        topic: 'Top',
      }),
    );
    // Sprinkle in a few single-name stories.
    for (let i = 0; i < 6; i++) {
      const s = UNIVERSE[Math.floor(rng() * 30)];
      const [tpl, topic] = NEWS_TEMPLATES[Math.floor(rng() * NEWS_TEMPLATES.length)];
      items.push({
        id: `sim-top-name-${i}`,
        headline: tpl.replace('{name}', s.name).replace('{sector}', s.sector ?? 'Cyclical').replace('{dir}', rng() > 0.5 ? 'Climb' : 'Slip'),
        source: sources[Math.floor(rng() * sources.length)],
        time: now - Math.floor(rng() * 10 * 3600_000),
        secIds: [s.id],
        topic,
      });
    }
  }
  return items.sort((a, b) => b.time - a.time);
}
