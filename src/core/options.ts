/** Black–Scholes pricing, greeks and a deterministic vol-surface generator. */

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26
  const s = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return s * y;
}

export const normCdf = (x: number): number => 0.5 * (1 + erf(x / Math.SQRT2));
export const normPdf = (x: number): number => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

export interface BsInput {
  spot: number;
  strike: number;
  vol: number; // annualized, e.g. 0.25
  rate: number; // cc risk-free, e.g. 0.04
  t: number; // years to expiry
  type: 'call' | 'put';
}

export interface BsResult {
  price: number;
  delta: number;
  gamma: number;
  vega: number; // per 1 vol point (0.01)
  theta: number; // per calendar day
  rho: number; // per 1% rate move
}

export function blackScholes(i: BsInput): BsResult {
  const { spot: S, strike: K, vol: v, rate: r, t: T, type } = i;
  if (T <= 0 || v <= 0) {
    const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
    return { price: intrinsic, delta: type === 'call' ? (S > K ? 1 : 0) : S < K ? -1 : 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }
  const sq = v * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / sq;
  const d2 = d1 - sq;
  const df = Math.exp(-r * T);
  const call = S * normCdf(d1) - K * df * normCdf(d2);
  const price = type === 'call' ? call : call - S + K * df; // put–call parity
  const delta = type === 'call' ? normCdf(d1) : normCdf(d1) - 1;
  const gamma = normPdf(d1) / (S * sq);
  const vega = (S * normPdf(d1) * Math.sqrt(T)) / 100;
  const thetaYr =
    -(S * normPdf(d1) * v) / (2 * Math.sqrt(T)) -
    (type === 'call' ? r * K * df * normCdf(d2) : -r * K * df * normCdf(-d2));
  const rho = ((type === 'call' ? K * T * df * normCdf(d2) : -K * T * df * normCdf(-d2)) / 100);
  return { price, delta, gamma, vega, theta: thetaYr / 365, rho };
}

/** Solve implied vol from price via bisection. */
export function impliedVol(target: number, i: Omit<BsInput, 'vol'>): number | null {
  let lo = 0.005;
  let hi = 4;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    const p = blackScholes({ ...i, vol: mid }).price;
    if (Math.abs(p - target) < 1e-6) return mid;
    if (p > target) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Deterministic smile: base ATM vol with put skew + smile curvature,
 * mildly decaying with time. Same shape every render for a given security.
 */
export function smileVol(baseVol: number, moneyness: number, tYears: number): number {
  const m = Math.log(moneyness); // ln(K/S)
  const skew = -0.28 * m; // downside puts richer
  const curve = 0.55 * m * m;
  const term = 1 + 0.12 / Math.sqrt(Math.max(tYears, 0.02) * 12);
  return Math.max(0.05, baseVol * (1 + skew + curve) * term * 0.92);
}

/** Next N monthly expiries (3rd Friday), plus 1–2 near weeklies. */
export function genExpiries(n = 4): Array<{ label: string; date: Date; t: number }> {
  const out: Array<{ label: string; date: Date; t: number }> = [];
  const now = new Date();
  const thirdFriday = (y: number, m: number) => {
    const d = new Date(y, m, 1);
    const day = d.getDay();
    const firstFri = 1 + ((5 - day + 7) % 7);
    return new Date(y, m, firstFri + 14, 16, 0, 0);
  };
  // Near weekly (next Friday)
  const nf = new Date(now);
  nf.setDate(nf.getDate() + ((5 - nf.getDay() + 7) % 7 || 7));
  nf.setHours(16, 0, 0, 0);
  out.push({ label: nf.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' W', date: nf, t: 0 });
  let m = now.getMonth();
  let y = now.getFullYear();
  while (out.length < n + 1) {
    const d = thirdFriday(y, m);
    if (d > now && Math.abs(d.getTime() - nf.getTime()) > 3 * 86400e3) {
      out.push({ label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }), date: d, t: 0 });
    }
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  for (const e of out) e.t = Math.max((e.date.getTime() - now.getTime()) / (365.25 * 86400e3), 1 / 365);
  return out;
}
