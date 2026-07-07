import type { Bar } from './types';

/** Technical analysis & portfolio math. Pure functions over close series. */

export function closes(bars: Bar[]): number[] {
  return bars.map((b) => b.close);
}

export function sma(xs: number[], n: number): Array<number | null> {
  const out: Array<number | null> = new Array(xs.length).fill(null);
  let sum = 0;
  for (let i = 0; i < xs.length; i++) {
    sum += xs[i];
    if (i >= n) sum -= xs[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

export function ema(xs: number[], n: number): Array<number | null> {
  const out: Array<number | null> = new Array(xs.length).fill(null);
  const k = 2 / (n + 1);
  let prev: number | null = null;
  for (let i = 0; i < xs.length; i++) {
    prev = prev === null ? xs[i] : xs[i] * k + prev * (1 - k);
    if (i >= n - 1) out[i] = prev;
  }
  return out;
}

export function rsi(xs: number[], n = 14): Array<number | null> {
  const out: Array<number | null> = new Array(xs.length).fill(null);
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < xs.length; i++) {
    const d = xs[i] - xs[i - 1];
    const g = Math.max(d, 0);
    const l = Math.max(-d, 0);
    if (i <= n) {
      gain += g / n;
      loss += l / n;
    } else {
      gain = (gain * (n - 1) + g) / n;
      loss = (loss * (n - 1) + l) / n;
    }
    if (i >= n) out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export interface MacdPoint {
  macd: number | null;
  signal: number | null;
  hist: number | null;
}

export function macd(xs: number[], fast = 12, slow = 26, sig = 9): MacdPoint[] {
  const ef = ema(xs, fast);
  const es = ema(xs, slow);
  const line = xs.map((_, i) => (ef[i] !== null && es[i] !== null ? ef[i]! - es[i]! : null));
  const valid = line.map((v) => v ?? 0);
  const sigLine = ema(valid, sig);
  return xs.map((_, i) => ({
    macd: line[i],
    signal: line[i] !== null ? sigLine[i] : null,
    hist: line[i] !== null && sigLine[i] !== null ? line[i]! - sigLine[i]! : null,
  }));
}

export function bollinger(xs: number[], n = 20, k = 2): Array<{ mid: number; up: number; dn: number } | null> {
  const mid = sma(xs, n);
  return xs.map((_, i) => {
    if (mid[i] === null) return null;
    let ss = 0;
    for (let j = i - n + 1; j <= i; j++) ss += (xs[j] - mid[i]!) ** 2;
    const sd = Math.sqrt(ss / n);
    return { mid: mid[i]!, up: mid[i]! + k * sd, dn: mid[i]! - k * sd };
  });
}

/** Simple (log) returns from a close series. */
export function logReturns(xs: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < xs.length; i++) out.push(Math.log(xs[i] / xs[i - 1]));
  return out;
}

export function annualizedVol(rets: number[], periodsPerYear = 252): number {
  if (rets.length < 2) return 0;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const va = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(va * periodsPerYear);
}

export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ax = a.slice(-n);
  const bx = b.slice(-n);
  const ma = ax.reduce((x, y) => x + y, 0) / n;
  const mb = bx.reduce((x, y) => x + y, 0) / n;
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    cov += (ax[i] - ma) * (bx[i] - mb);
    va += (ax[i] - ma) ** 2;
    vb += (bx[i] - mb) ** 2;
  }
  return va && vb ? cov / Math.sqrt(va * vb) : 0;
}

/** OLS beta of asset returns vs benchmark returns. */
export function beta(asset: number[], bench: number[]): number {
  const n = Math.min(asset.length, bench.length);
  if (n < 3) return 1;
  const a = asset.slice(-n);
  const b = bench.slice(-n);
  const mb = b.reduce((x, y) => x + y, 0) / n;
  const ma = a.reduce((x, y) => x + y, 0) / n;
  let cov = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
    vb += (b[i] - mb) ** 2;
  }
  return vb ? cov / vb : 1;
}

export function maxDrawdown(xs: number[]): number {
  let peak = -Infinity;
  let mdd = 0;
  for (const x of xs) {
    peak = Math.max(peak, x);
    mdd = Math.min(mdd, x / peak - 1);
  }
  return mdd;
}

/** Historical 1-period VaR at the given confidence (positive number, as a fraction). */
export function historicalVaR(rets: number[], conf = 0.95): number {
  if (!rets.length) return 0;
  const sorted = [...rets].sort((a, b) => a - b);
  const idx = Math.floor((1 - conf) * sorted.length);
  return -sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}
