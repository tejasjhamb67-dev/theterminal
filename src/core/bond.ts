/** Fixed-income math: semiannual-coupon bond pricing and risk. */

export interface BondSpec {
  coupon: number; // annual %, e.g. 4.25
  yearsToMaturity: number;
  face?: number; // default 100
}

/** Clean price per 100 face from a semiannual bond-equivalent yield (%). */
export function priceFromYield(spec: BondSpec, yieldPct: number): number {
  const face = spec.face ?? 100;
  const y = yieldPct / 100 / 2;
  const c = ((spec.coupon / 100) * face) / 2;
  const n = Math.max(1, Math.round(spec.yearsToMaturity * 2));
  let pv = 0;
  for (let i = 1; i <= n; i++) pv += c / (1 + y) ** i;
  pv += face / (1 + y) ** n;
  return pv;
}

/** Solve yield (%) from clean price via bisection. */
export function yieldFromPrice(spec: BondSpec, price: number): number {
  let lo = -5;
  let hi = 30;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (priceFromYield(spec, mid) > price) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface BondRisk {
  price: number;
  macaulay: number;
  modified: number;
  dv01: number; // $ per 100 face per 1bp
  convexity: number;
}

export function bondRisk(spec: BondSpec, yieldPct: number): BondRisk {
  const face = spec.face ?? 100;
  const y = yieldPct / 100 / 2;
  const c = ((spec.coupon / 100) * face) / 2;
  const n = Math.max(1, Math.round(spec.yearsToMaturity * 2));
  let pv = 0;
  let tw = 0;
  for (let i = 1; i <= n; i++) {
    const cf = i === n ? c + face : c;
    const d = cf / (1 + y) ** i;
    pv += d;
    tw += (i / 2) * d;
  }
  const macaulay = tw / pv;
  const modified = macaulay / (1 + y);
  const dv01 = (modified * pv) / 10000;
  // Numeric convexity
  const up = priceFromYield(spec, yieldPct + 0.1);
  const dn = priceFromYield(spec, yieldPct - 0.1);
  const convexity = (up + dn - 2 * pv) / (pv * (0.001) ** 2);
  return { price: pv, macaulay, modified, dv01, convexity };
}
