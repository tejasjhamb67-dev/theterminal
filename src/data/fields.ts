import type { Security } from '../core/types';
import { getBars, getQuote } from './service';
import { getFundamentals } from './fundamentals';
import { annualizedVol, closes, logReturns, maxDrawdown, rsi, sma } from '../core/ta';
import { fmtBig, fmtPct, fmtPx } from '../core/fmt';

/**
 * Field dictionary — the data-pull layer behind FLDS and BDP.
 * Every field is a named formula over the live connectors, mirroring the
 * BDP("AAPL US Equity","PX_LAST") pull model.
 */

export interface FieldDef {
  id: string;
  name: string;
  category: 'Price' | 'Session' | 'Performance' | 'Risk' | 'Fundamental';
  description: string;
  /** stockOnly fields need the modeled fundamentals engine. */
  stockOnly?: boolean;
  resolve: (sec: Security) => Promise<string>;
}

const q = (sec: Security) => getQuote(sec);
const y1 = (sec: Security) => getBars(sec, '1Y');

export const FIELDS: FieldDef[] = [
  { id: 'PX_LAST', name: 'Last Price', category: 'Price', description: 'Most recent traded/quoted price.', resolve: async (s) => fmtPx((await q(s)).price) },
  { id: 'PX_OPEN', name: 'Open Price', category: 'Session', description: 'Session opening price.', resolve: async (s) => fmtPx((await q(s)).open) },
  { id: 'PX_HIGH', name: 'Session High', category: 'Session', description: 'Highest trade of the session.', resolve: async (s) => fmtPx((await q(s)).high) },
  { id: 'PX_LOW', name: 'Session Low', category: 'Session', description: 'Lowest trade of the session.', resolve: async (s) => fmtPx((await q(s)).low) },
  { id: 'PX_CLOSE_1D', name: 'Previous Close', category: 'Session', description: 'Prior session closing price.', resolve: async (s) => fmtPx((await q(s)).prevClose) },
  { id: 'CHG_NET_1D', name: 'Net Change 1D', category: 'Session', description: 'Price change vs previous close.', resolve: async (s) => fmtPx((await q(s)).chg) },
  { id: 'CHG_PCT_1D', name: '% Change 1D', category: 'Session', description: 'Percent change vs previous close.', resolve: async (s) => fmtPct((await q(s)).chgPct) },
  { id: 'VOLUME', name: 'Volume', category: 'Session', description: 'Cumulative session volume.', resolve: async (s) => fmtBig((await q(s)).volume) },
  { id: 'PX_52W_HIGH', name: '52-Week High', category: 'Performance', description: 'Highest price over the trailing year.', resolve: async (s) => fmtPx(Math.max(...(await y1(s)).map((b) => b.high))) },
  { id: 'PX_52W_LOW', name: '52-Week Low', category: 'Performance', description: 'Lowest price over the trailing year.', resolve: async (s) => fmtPx(Math.min(...(await y1(s)).map((b) => b.low))) },
  { id: 'PCT_52W_RANGE', name: '52W Range Position', category: 'Performance', description: 'Where the last price sits inside the 52-week range.', resolve: async (s) => { const bars = await y1(s); const px = (await q(s)).price; const hi = Math.max(...bars.map((b) => b.high)); const lo = Math.min(...bars.map((b) => b.low)); return `${(((px - lo) / (hi - lo)) * 100).toFixed(0)}%`; } },
  { id: 'RET_1M', name: 'Return 1M', category: 'Performance', description: 'Trailing 1-month total price return.', resolve: async (s) => { const bars = await y1(s); const c = closes(bars); return fmtPct((c[c.length - 1] / c[Math.max(0, c.length - 23)] - 1) * 100); } },
  { id: 'RET_YTD', name: 'Return 1Y', category: 'Performance', description: 'Trailing 1-year total price return.', resolve: async (s) => { const c = closes(await y1(s)); return fmtPct((c[c.length - 1] / c[0] - 1) * 100); } },
  { id: 'MOV_AVG_50D', name: '50-Day Average', category: 'Performance', description: 'Simple 50-day moving average.', resolve: async (s) => { const c = closes(await y1(s)); const v = sma(c, 50)[c.length - 1]; return fmtPx(v ?? undefined); } },
  { id: 'MOV_AVG_200D', name: '200-Day Average', category: 'Performance', description: 'Simple 200-day moving average.', resolve: async (s) => { const c = closes(await y1(s)); const v = sma(c, 200)[c.length - 1]; return fmtPx(v ?? undefined); } },
  { id: 'RSI_14D', name: 'RSI 14', category: 'Risk', description: '14-day relative strength index.', resolve: async (s) => { const c = closes(await y1(s)); return (rsi(c, 14)[c.length - 1] ?? 0).toFixed(1); } },
  { id: 'VOLATILITY_30D', name: 'Volatility 30D', category: 'Risk', description: 'Annualized 30-day realized volatility.', resolve: async (s) => fmtPct(annualizedVol(logReturns(closes(await y1(s))).slice(-30)) * 100, false) },
  { id: 'VOLATILITY_1Y', name: 'Volatility 1Y', category: 'Risk', description: 'Annualized 1-year realized volatility.', resolve: async (s) => fmtPct(annualizedVol(logReturns(closes(await y1(s)))) * 100, false) },
  { id: 'MAX_DRAWDOWN_1Y', name: 'Max Drawdown 1Y', category: 'Risk', description: 'Deepest peak-to-trough loss over the trailing year.', resolve: async (s) => fmtPct(maxDrawdown(closes(await y1(s))) * 100, false) },
  { id: 'CUR_MKT_CAP', name: 'Market Cap', category: 'Fundamental', description: 'Shares outstanding × last price (modeled shares).', stockOnly: true, resolve: async (s) => '$' + fmtBig(getFundamentals(s).shares * 1e9 * (await q(s)).price) },
  { id: 'PE_RATIO', name: 'P/E (LTM)', category: 'Fundamental', description: 'Last price over trailing-twelve-month EPS.', stockOnly: true, resolve: async (s) => { const f = getFundamentals(s); const eps = f.quarters.slice(-4).reduce((a, b) => a + b.eps, 0); return ((await q(s)).price / eps).toFixed(1) + 'x'; } },
  { id: 'EPS_LTM', name: 'EPS (LTM)', category: 'Fundamental', description: 'Trailing-twelve-month earnings per share.', stockOnly: true, resolve: async (s) => fmtPx(getFundamentals(s).quarters.slice(-4).reduce((a, b) => a + b.eps, 0)) },
  { id: 'DVD_YIELD', name: 'Dividend Yield', category: 'Fundamental', description: 'Indicated annual dividend over last price.', stockOnly: true, resolve: async (s) => getFundamentals(s).indicatedDivYield.toFixed(2) + '%' },
  { id: 'SALES_LTM', name: 'Revenue (FY)', category: 'Fundamental', description: 'Latest fiscal-year revenue (modeled).', stockOnly: true, resolve: async (s) => { const ys = getFundamentals(s).years; return '$' + fmtBig(ys[ys.length - 1].revenue * 1e9); } },
  { id: 'BEST_TARGET', name: 'Consensus Target', category: 'Fundamental', description: 'Average analyst price target (modeled coverage).', stockOnly: true, resolve: async (s) => fmtPx(getFundamentals(s).consensus.avgTarget) },
];

export function getField(id: string): FieldDef | undefined {
  return FIELDS.find((f) => f.id.toUpperCase() === id.toUpperCase());
}

export function fieldCount(): number {
  return FIELDS.length;
}
