import type { Security } from '../core/types';

/**
 * Deterministic fundamentals engine.
 * Until a real fundamentals connector is wired in, this generates a
 * self-consistent set of financials per issuer: seeded by security id,
 * scaled off the security's price level, with sector-realistic margins,
 * growth and multiples. Same numbers every run.
 */

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

interface SectorProfile {
  netMargin: number;
  pe: number;
  growth: number;
  payout: number; // dividend payout ratio
  debtToEquity: number;
}

const SECTOR: Record<string, SectorProfile> = {
  Technology: { netMargin: 0.24, pe: 32, growth: 0.14, payout: 0.12, debtToEquity: 0.5 },
  'Communication Services': { netMargin: 0.18, pe: 24, growth: 0.1, payout: 0.15, debtToEquity: 0.8 },
  'Consumer Discretionary': { netMargin: 0.08, pe: 28, growth: 0.11, payout: 0.1, debtToEquity: 1.0 },
  'Consumer Staples': { netMargin: 0.11, pe: 22, growth: 0.04, payout: 0.55, debtToEquity: 1.2 },
  Financials: { netMargin: 0.25, pe: 14, growth: 0.06, payout: 0.3, debtToEquity: 1.8 },
  'Health Care': { netMargin: 0.16, pe: 20, growth: 0.07, payout: 0.35, debtToEquity: 0.9 },
  Energy: { netMargin: 0.1, pe: 12, growth: 0.03, payout: 0.45, debtToEquity: 0.7 },
  Industrials: { netMargin: 0.09, pe: 21, growth: 0.06, payout: 0.3, debtToEquity: 1.1 },
  Default: { netMargin: 0.12, pe: 20, growth: 0.07, payout: 0.25, debtToEquity: 1.0 },
};

export interface AnnualRow {
  year: number;
  revenue: number;
  grossProfit: number;
  opIncome: number;
  netIncome: number;
  eps: number;
  fcf: number;
  totalAssets: number;
  totalDebt: number;
  cash: number;
  equity: number;
}

export interface QuarterRow {
  label: string; // "Q1 25"
  reportDate: number;
  revenue: number;
  eps: number;
  epsEst: number;
}

export interface AnalystRec {
  firm: string;
  rec: 'BUY' | 'HOLD' | 'SELL';
  target: number;
  date: number;
}

export interface DividendRow {
  exDate: number;
  payDate: number;
  amount: number;
}

export interface Fundamentals {
  shares: number; // billions
  marketCap: number;
  years: AnnualRow[];
  quarters: QuarterRow[]; // last 8, oldest first
  nextReport: { date: number; epsEst: number; revEst: number };
  dividends: DividendRow[]; // last 8 quarterly, oldest first
  indicatedDivYield: number; // %
  recs: AnalystRec[];
  consensus: { buy: number; hold: number; sell: number; avgTarget: number; highTarget: number; lowTarget: number };
  profile: SectorProfile;
}

const FIRMS = [
  'Ashford & Cole', 'Meridian Partners', 'Blackwell Securities', 'Hartline Capital',
  'Northgate Research', 'Sable & Fox', 'Crestview Analytics', 'Halloran Bros',
  'Wexford Global', 'Quill & Sterling', 'Ironbridge', 'Vantage Point Research',
];

const cache = new Map<string, Fundamentals>();

export function getFundamentals(sec: Security): Fundamentals {
  const hit = cache.get(sec.id);
  if (hit) return hit;

  const rng = mulberry32(hashStr('fund:' + sec.id));
  const profile = SECTOR[sec.sector ?? ''] ?? SECTOR.Default;

  // Scale: shares seeded 0.8–16B; everything else derives from price level.
  const shares = 0.8 + rng() * 15.2; // billions
  const price = sec.simBase;
  const marketCap = price * shares; // $B
  const pe = profile.pe * (0.75 + rng() * 0.5);
  const netIncome = marketCap / pe; // $B, trailing
  const netMargin = profile.netMargin * (0.7 + rng() * 0.6);
  const revenue = netIncome / netMargin;
  const growth = profile.growth * (0.5 + rng()) + (rng() - 0.5) * 0.02;

  const thisYear = new Date().getFullYear();
  const years: AnnualRow[] = [];
  let rev = revenue;
  let ni = netIncome;
  for (let i = 0; i < 5; i++) {
    const y = thisYear - 1 - i;
    const noise = 1 + (rng() - 0.5) * 0.06;
    const assets = rev * (1.6 + rng() * 1.2);
    const equity = assets * (0.3 + rng() * 0.25);
    const debt = equity * profile.debtToEquity * (0.7 + rng() * 0.6);
    years.unshift({
      year: y,
      revenue: rev,
      grossProfit: rev * (netMargin + 0.22 + rng() * 0.1),
      opIncome: ni * (1.2 + rng() * 0.25),
      netIncome: ni,
      eps: ni / shares,
      fcf: ni * (0.85 + rng() * 0.4),
      totalAssets: assets,
      totalDebt: debt,
      cash: assets * (0.06 + rng() * 0.12),
      equity,
    });
    rev = (rev / (1 + growth)) * noise;
    ni = (ni / (1 + growth * 1.15)) * noise;
  }

  // Quarterly: split latest year with seasonality; estimates near actuals.
  const quarters: QuarterRow[] = [];
  const latest = years[years.length - 1];
  const now = Date.now();
  for (let i = 7; i >= 0; i--) {
    const qDate = now - (i + 1) * 91.25 * 86400e3 + 20 * 86400e3;
    const d = new Date(qDate);
    const qi = Math.floor(d.getMonth() / 3) + 1;
    const season = 1 + (qi === 4 ? 0.08 : qi === 1 ? -0.05 : 0) + (rng() - 0.5) * 0.05;
    const qRev = (latest.revenue / 4) * season * (1 - (i * growth) / 4 / 2);
    const qEps = (latest.eps / 4) * season * (1 - (i * growth) / 4 / 2);
    const surprise = (rng() - 0.35) * 0.08; // slight beat bias
    quarters.push({
      label: `Q${qi} ${String(d.getFullYear()).slice(2)}`,
      reportDate: qDate,
      revenue: qRev,
      eps: qEps,
      epsEst: qEps / (1 + surprise),
    });
  }
  const nextEps = (latest.eps / 4) * (1 + growth / 3);
  const nextReport = {
    date: now + (12 + Math.floor(rng() * 60)) * 86400e3,
    epsEst: nextEps,
    revEst: (latest.revenue / 4) * (1 + growth / 3),
  };

  // Dividends
  const divAnnual = latest.eps * profile.payout;
  const dividends: DividendRow[] = [];
  if (divAnnual > 0.01) {
    for (let i = 7; i >= 0; i--) {
      const ex = now - (i + 0.6) * 91.25 * 86400e3;
      dividends.push({
        exDate: ex,
        payDate: ex + 21 * 86400e3,
        amount: (divAnnual / 4) * (1 - (i * profile.growth) / 8),
      });
    }
  }
  const indicatedDivYield = divAnnual > 0.01 ? (divAnnual / price) * 100 : 0;

  // Analyst recommendations around fair value.
  const nRecs = 7 + Math.floor(rng() * 5);
  const recs: AnalystRec[] = [];
  for (let i = 0; i < nRecs; i++) {
    const stance = rng();
    const rec: AnalystRec['rec'] = stance < 0.52 ? 'BUY' : stance < 0.85 ? 'HOLD' : 'SELL';
    const target = price * (rec === 'BUY' ? 1.05 + rng() * 0.25 : rec === 'HOLD' ? 0.95 + rng() * 0.15 : 0.75 + rng() * 0.15);
    recs.push({
      firm: FIRMS[Math.floor(rng() * FIRMS.length)],
      rec,
      target,
      date: now - Math.floor(rng() * 90) * 86400e3,
    });
  }
  // De-dup firms
  const seen = new Set<string>();
  const uniqueRecs = recs.filter((r) => !seen.has(r.firm) && seen.add(r.firm));
  const targets = uniqueRecs.map((r) => r.target);
  const consensus = {
    buy: uniqueRecs.filter((r) => r.rec === 'BUY').length,
    hold: uniqueRecs.filter((r) => r.rec === 'HOLD').length,
    sell: uniqueRecs.filter((r) => r.rec === 'SELL').length,
    avgTarget: targets.reduce((a, b) => a + b, 0) / targets.length,
    highTarget: Math.max(...targets),
    lowTarget: Math.min(...targets),
  };

  const f: Fundamentals = {
    shares,
    marketCap,
    years,
    quarters,
    nextReport,
    dividends,
    indicatedDivYield,
    recs: uniqueRecs.sort((a, b) => b.date - a.date),
    consensus,
    profile,
  };
  cache.set(sec.id, f);
  return f;
}
