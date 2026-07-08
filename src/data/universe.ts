import type { Security } from '../core/types';

const S = (
  id: string,
  name: string,
  yahoo: string,
  kind: Security['kind'],
  opts: Partial<Security> = {},
): Security => {
  const parts = id.split(' ');
  const yellowKey = parts[parts.length - 1] as Security['yellowKey'];
  return {
    id,
    ticker: parts.slice(0, -1).join(' '),
    yellowKey,
    kind,
    name,
    yahoo,
    currency: opts.currency ?? 'USD',
    country: opts.country,
    sector: opts.sector,
    description: opts.description,
    simBase: opts.simBase ?? 100,
    simVol: opts.simVol ?? 0.25,
  };
};

export const UNIVERSE: Security[] = [
  // ── US Equities ────────────────────────────────────────────────
  S('AAPL US Equity', 'Apple Inc', 'AAPL', 'stock', { country: 'US', sector: 'Technology', simBase: 232, simVol: 0.26, description: 'Designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories; services include the App Store, iCloud and Apple Pay.' }),
  S('MSFT US Equity', 'Microsoft Corp', 'MSFT', 'stock', { country: 'US', sector: 'Technology', simBase: 465, simVol: 0.24, description: 'Develops and licenses software, cloud services (Azure), devices and AI platforms worldwide.' }),
  S('NVDA US Equity', 'NVIDIA Corp', 'NVDA', 'stock', { country: 'US', sector: 'Technology', simBase: 160, simVol: 0.45, description: 'Designs GPUs and full-stack accelerated computing platforms for AI, data centers, gaming and automotive.' }),
  S('GOOGL US Equity', 'Alphabet Inc-A', 'GOOGL', 'stock', { country: 'US', sector: 'Communication Services', simBase: 178, simVol: 0.28, description: 'Holding company for Google: search, advertising, YouTube, Android, Cloud and Other Bets.' }),
  S('AMZN US Equity', 'Amazon.com Inc', 'AMZN', 'stock', { country: 'US', sector: 'Consumer Discretionary', simBase: 220, simVol: 0.3, description: 'E-commerce, cloud computing (AWS), digital advertising and logistics.' }),
  S('META US Equity', 'Meta Platforms Inc', 'META', 'stock', { country: 'US', sector: 'Communication Services', simBase: 715, simVol: 0.32 }),
  S('TSLA US Equity', 'Tesla Inc', 'TSLA', 'stock', { country: 'US', sector: 'Consumer Discretionary', simBase: 315, simVol: 0.55, description: 'Designs and manufactures electric vehicles, energy storage and solar products; develops autonomy software.' }),
  S('BRK/B US Equity', 'Berkshire Hathaway-B', 'BRK-B', 'stock', { country: 'US', sector: 'Financials', simBase: 485, simVol: 0.16 }),
  S('JPM US Equity', 'JPMorgan Chase & Co', 'JPM', 'stock', { country: 'US', sector: 'Financials', simBase: 290, simVol: 0.22 }),
  S('GS US Equity', 'Goldman Sachs Group', 'GS', 'stock', { country: 'US', sector: 'Financials', simBase: 700, simVol: 0.25 }),
  S('XOM US Equity', 'Exxon Mobil Corp', 'XOM', 'stock', { country: 'US', sector: 'Energy', simBase: 113, simVol: 0.24 }),
  S('CVX US Equity', 'Chevron Corp', 'CVX', 'stock', { country: 'US', sector: 'Energy', simBase: 148, simVol: 0.22 }),
  S('JNJ US Equity', 'Johnson & Johnson', 'JNJ', 'stock', { country: 'US', sector: 'Health Care', simBase: 155, simVol: 0.15 }),
  S('LLY US Equity', 'Eli Lilly & Co', 'LLY', 'stock', { country: 'US', sector: 'Health Care', simBase: 780, simVol: 0.3 }),
  S('UNH US Equity', 'UnitedHealth Group', 'UNH', 'stock', { country: 'US', sector: 'Health Care', simBase: 305, simVol: 0.28 }),
  S('WMT US Equity', 'Walmart Inc', 'WMT', 'stock', { country: 'US', sector: 'Consumer Staples', simBase: 98, simVol: 0.18 }),
  S('PG US Equity', 'Procter & Gamble Co', 'PG', 'stock', { country: 'US', sector: 'Consumer Staples', simBase: 160, simVol: 0.14 }),
  S('KO US Equity', 'Coca-Cola Co', 'KO', 'stock', { country: 'US', sector: 'Consumer Staples', simBase: 70, simVol: 0.13 }),
  S('DIS US Equity', 'Walt Disney Co', 'DIS', 'stock', { country: 'US', sector: 'Communication Services', simBase: 123, simVol: 0.26 }),
  S('BA US Equity', 'Boeing Co', 'BA', 'stock', { country: 'US', sector: 'Industrials', simBase: 215, simVol: 0.35 }),
  S('CAT US Equity', 'Caterpillar Inc', 'CAT', 'stock', { country: 'US', sector: 'Industrials', simBase: 395, simVol: 0.24 }),
  S('AMD US Equity', 'Advanced Micro Devices', 'AMD', 'stock', { country: 'US', sector: 'Technology', simBase: 138, simVol: 0.45 }),
  S('INTC US Equity', 'Intel Corp', 'INTC', 'stock', { country: 'US', sector: 'Technology', simBase: 23, simVol: 0.4 }),
  S('CRM US Equity', 'Salesforce Inc', 'CRM', 'stock', { country: 'US', sector: 'Technology', simBase: 270, simVol: 0.3 }),
  S('NFLX US Equity', 'Netflix Inc', 'NFLX', 'stock', { country: 'US', sector: 'Communication Services', simBase: 1280, simVol: 0.33 }),
  S('V US Equity', 'Visa Inc-A', 'V', 'stock', { country: 'US', sector: 'Financials', simBase: 355, simVol: 0.18 }),
  S('MA US Equity', 'Mastercard Inc-A', 'MA', 'stock', { country: 'US', sector: 'Financials', simBase: 560, simVol: 0.19 }),
  S('PFE US Equity', 'Pfizer Inc', 'PFE', 'stock', { country: 'US', sector: 'Health Care', simBase: 25, simVol: 0.24 }),
  S('T US Equity', 'AT&T Inc', 'T', 'stock', { country: 'US', sector: 'Communication Services', simBase: 28, simVol: 0.18 }),
  S('NKE US Equity', 'NIKE Inc-B', 'NKE', 'stock', { country: 'US', sector: 'Consumer Discretionary', simBase: 76, simVol: 0.3 }),

  // ── International Equities ─────────────────────────────────────
  S('VOD LN Equity', 'Vodafone Group PLC', 'VOD.L', 'stock', { country: 'GB', sector: 'Communication Services', currency: 'GBp', simBase: 72, simVol: 0.25 }),
  S('HSBA LN Equity', 'HSBC Holdings PLC', 'HSBA.L', 'stock', { country: 'GB', sector: 'Financials', currency: 'GBp', simBase: 890, simVol: 0.2 }),
  S('SAP GY Equity', 'SAP SE', 'SAP.DE', 'stock', { country: 'DE', sector: 'Technology', currency: 'EUR', simBase: 270, simVol: 0.25 }),
  S('MC FP Equity', 'LVMH Moet Hennessy', 'MC.PA', 'stock', { country: 'FR', sector: 'Consumer Discretionary', currency: 'EUR', simBase: 520, simVol: 0.27 }),
  S('NESN SW Equity', 'Nestle SA', 'NESN.SW', 'stock', { country: 'CH', sector: 'Consumer Staples', currency: 'CHF', simBase: 78, simVol: 0.15 }),
  S('7203 JT Equity', 'Toyota Motor Corp', '7203.T', 'stock', { country: 'JP', sector: 'Consumer Discretionary', currency: 'JPY', simBase: 2650, simVol: 0.24 }),
  S('9984 JT Equity', 'SoftBank Group Corp', '9984.T', 'stock', { country: 'JP', sector: 'Communication Services', currency: 'JPY', simBase: 10500, simVol: 0.4 }),
  S('700 HK Equity', 'Tencent Holdings Ltd', '0700.HK', 'stock', { country: 'HK', sector: 'Communication Services', currency: 'HKD', simBase: 500, simVol: 0.3 }),
  S('BABA US Equity', 'Alibaba Group ADR', 'BABA', 'stock', { country: 'CN', sector: 'Consumer Discretionary', simBase: 108, simVol: 0.38 }),
  S('TSM US Equity', 'Taiwan Semiconductor ADR', 'TSM', 'stock', { country: 'TW', sector: 'Technology', simBase: 228, simVol: 0.32 }),

  // ── ETFs ───────────────────────────────────────────────────────
  S('SPY US Equity', 'SPDR S&P 500 ETF', 'SPY', 'etf', { country: 'US', sector: 'Broad Market', simBase: 625, simVol: 0.15 }),
  S('QQQ US Equity', 'Invesco QQQ Trust', 'QQQ', 'etf', { country: 'US', sector: 'Broad Market', simBase: 555, simVol: 0.19 }),
  S('TLT US Equity', 'iShares 20+ Yr Treasury', 'TLT', 'etf', { country: 'US', sector: 'Fixed Income', simBase: 87, simVol: 0.15 }),
  S('GLD US Equity', 'SPDR Gold Shares', 'GLD', 'etf', { country: 'US', sector: 'Commodity', simBase: 305, simVol: 0.14 }),

  // ── Indices ────────────────────────────────────────────────────
  S('SPX Index', 'S&P 500 Index', '^GSPC', 'index', { country: 'US', simBase: 6280, simVol: 0.14 }),
  S('INDU Index', 'Dow Jones Industrial Avg', '^DJI', 'index', { country: 'US', simBase: 44800, simVol: 0.13 }),
  S('CCMP Index', 'NASDAQ Composite', '^IXIC', 'index', { country: 'US', simBase: 20600, simVol: 0.18 }),
  S('RTY Index', 'Russell 2000', '^RUT', 'index', { country: 'US', simBase: 2250, simVol: 0.2 }),
  S('VIX Index', 'CBOE Volatility Index', '^VIX', 'index', { country: 'US', simBase: 16.5, simVol: 0.9 }),
  S('UKX Index', 'FTSE 100', '^FTSE', 'index', { country: 'GB', currency: 'GBP', simBase: 8850, simVol: 0.12 }),
  S('DAX Index', 'DAX', '^GDAXI', 'index', { country: 'DE', currency: 'EUR', simBase: 24100, simVol: 0.15 }),
  S('CAC Index', 'CAC 40', '^FCHI', 'index', { country: 'FR', currency: 'EUR', simBase: 7700, simVol: 0.15 }),
  S('SX5E Index', 'EURO STOXX 50', '^STOXX50E', 'index', { country: 'EU', currency: 'EUR', simBase: 5350, simVol: 0.15 }),
  S('NKY Index', 'Nikkei 225', '^N225', 'index', { country: 'JP', currency: 'JPY', simBase: 40100, simVol: 0.18 }),
  S('HSI Index', 'Hang Seng Index', '^HSI', 'index', { country: 'HK', currency: 'HKD', simBase: 24000, simVol: 0.2 }),
  S('SHCOMP Index', 'Shanghai Composite', '000001.SS', 'index', { country: 'CN', currency: 'CNY', simBase: 3480, simVol: 0.17 }),
  S('SENSEX Index', 'BSE Sensex', '^BSESN', 'index', { country: 'IN', currency: 'INR', simBase: 83500, simVol: 0.14 }),
  S('IBOV Index', 'Ibovespa', '^BVSP', 'index', { country: 'BR', currency: 'BRL', simBase: 140500, simVol: 0.2 }),

  // ── Rates ──────────────────────────────────────────────────────
  S('USGG2YR Index', 'US Treasury 2Y Yield', '^IRX', 'rate', { country: 'US', simBase: 3.85, simVol: 0.18 }),
  S('USGG5YR Index', 'US Treasury 5Y Yield', '^FVX', 'rate', { country: 'US', simBase: 3.95, simVol: 0.16 }),
  S('USGG10YR Index', 'US Treasury 10Y Yield', '^TNX', 'rate', { country: 'US', simBase: 4.35, simVol: 0.15 }),
  S('USGG30YR Index', 'US Treasury 30Y Yield', '^TYX', 'rate', { country: 'US', simBase: 4.85, simVol: 0.13 }),

  // ── FX ─────────────────────────────────────────────────────────
  S('EURUSD Curncy', 'Euro / US Dollar', 'EURUSD=X', 'fx', { simBase: 1.175, simVol: 0.08 }),
  S('GBPUSD Curncy', 'British Pound / US Dollar', 'GBPUSD=X', 'fx', { simBase: 1.36, simVol: 0.09 }),
  S('USDJPY Curncy', 'US Dollar / Japanese Yen', 'USDJPY=X', 'fx', { currency: 'JPY', simBase: 145.5, simVol: 0.1 }),
  S('USDCHF Curncy', 'US Dollar / Swiss Franc', 'USDCHF=X', 'fx', { currency: 'CHF', simBase: 0.795, simVol: 0.08 }),
  S('USDCAD Curncy', 'US Dollar / Canadian Dollar', 'USDCAD=X', 'fx', { currency: 'CAD', simBase: 1.365, simVol: 0.06 }),
  S('AUDUSD Curncy', 'Australian Dollar / USD', 'AUDUSD=X', 'fx', { simBase: 0.655, simVol: 0.09 }),
  S('NZDUSD Curncy', 'New Zealand Dollar / USD', 'NZDUSD=X', 'fx', { simBase: 0.605, simVol: 0.09 }),
  S('USDCNH Curncy', 'US Dollar / Offshore Yuan', 'CNH=X', 'fx', { currency: 'CNH', simBase: 7.16, simVol: 0.04 }),
  S('USDMXN Curncy', 'US Dollar / Mexican Peso', 'MXN=X', 'fx', { currency: 'MXN', simBase: 18.6, simVol: 0.12 }),
  S('USDINR Curncy', 'US Dollar / Indian Rupee', 'INR=X', 'fx', { currency: 'INR', simBase: 85.9, simVol: 0.05 }),
  S('USDBRL Curncy', 'US Dollar / Brazilian Real', 'BRL=X', 'fx', { currency: 'BRL', simBase: 5.45, simVol: 0.14 }),
  S('DXY Curncy', 'US Dollar Index', 'DX-Y.NYB', 'fx', { simBase: 97.2, simVol: 0.07 }),

  // ── Commodities ────────────────────────────────────────────────
  S('CL1 Comdty', 'WTI Crude Oil (front)', 'CL=F', 'commodity', { simBase: 67.5, simVol: 0.35 }),
  S('CO1 Comdty', 'Brent Crude Oil (front)', 'BZ=F', 'commodity', { simBase: 69.3, simVol: 0.33 }),
  S('NG1 Comdty', 'Natural Gas (front)', 'NG=F', 'commodity', { simBase: 3.4, simVol: 0.6 }),
  S('GC1 Comdty', 'Gold (front)', 'GC=F', 'commodity', { simBase: 3330, simVol: 0.15 }),
  S('SI1 Comdty', 'Silver (front)', 'SI=F', 'commodity', { simBase: 36.9, simVol: 0.25 }),
  S('HG1 Comdty', 'Copper (front)', 'HG=F', 'commodity', { simBase: 5.05, simVol: 0.25 }),
  S('PL1 Comdty', 'Platinum (front)', 'PL=F', 'commodity', { simBase: 1390, simVol: 0.28 }),
  S('C 1 Comdty', 'Corn (front)', 'ZC=F', 'commodity', { simBase: 420, simVol: 0.22 }),
  S('W 1 Comdty', 'Wheat (front)', 'ZW=F', 'commodity', { simBase: 555, simVol: 0.26 }),
  S('S 1 Comdty', 'Soybeans (front)', 'ZS=F', 'commodity', { simBase: 1030, simVol: 0.2 }),
  S('SB1 Comdty', 'Sugar #11 (front)', 'SB=F', 'commodity', { simBase: 16.3, simVol: 0.3 }),
  S('KC1 Comdty', 'Coffee C (front)', 'KC=F', 'commodity', { simBase: 288, simVol: 0.38 }),

  // ── Crypto ─────────────────────────────────────────────────────
  S('XBT Crypto', 'Bitcoin / USD', 'BTC-USD', 'crypto', { simBase: 108500, simVol: 0.55 }),
  S('XET Crypto', 'Ethereum / USD', 'ETH-USD', 'crypto', { simBase: 2550, simVol: 0.7 }),
  S('XSOL Crypto', 'Solana / USD', 'SOL-USD', 'crypto', { simBase: 150, simVol: 0.9 }),
  S('XRP Crypto', 'XRP / USD', 'XRP-USD', 'crypto', { simBase: 2.25, simVol: 0.85 }),
  S('XDG Crypto', 'Dogecoin / USD', 'DOGE-USD', 'crypto', { simBase: 0.165, simVol: 1.0 }),
];

import { EXTRA_UNIVERSE } from './universeExtra';
UNIVERSE.push(...EXTRA_UNIVERSE);

const byId = new Map(UNIVERSE.map((s) => [s.id.toUpperCase(), s]));
const byTicker = new Map<string, Security>();
for (const s of UNIVERSE) {
  const key = s.ticker.toUpperCase();
  if (!byTicker.has(key)) byTicker.set(key, s);
}

/** Extra lookup layers (e.g. the dynamic whole-market registry) hook in here. */
const externalResolvers: Array<(id: string) => Security | undefined> = [];
export function addExternalResolver(fn: (id: string) => Security | undefined): void {
  externalResolvers.push(fn);
}

export function getSecurity(id: string): Security | undefined {
  const hit = byId.get(id.toUpperCase());
  if (hit) return hit;
  for (const r of externalResolvers) {
    const s = r(id);
    if (s) return s;
  }
  return undefined;
}

export function getByTicker(ticker: string): Security | undefined {
  return byTicker.get(ticker.toUpperCase());
}

export function searchSecurities(q: string, limit = 8): Security[] {
  const t = q.trim().toUpperCase();
  if (!t) return [];
  const scored: Array<[number, Security]> = [];
  for (const s of UNIVERSE) {
    const ticker = s.ticker.toUpperCase();
    const id = s.id.toUpperCase();
    const name = s.name.toUpperCase();
    let score = -1;
    if (ticker === t || id === t) score = 100;
    else if (ticker.startsWith(t)) score = 80 - ticker.length;
    else if (id.startsWith(t)) score = 70 - id.length;
    else if (name.startsWith(t)) score = 60;
    else if (name.includes(t)) score = 40;
    else if (id.includes(t)) score = 30;
    if (score >= 0) scored.push([score, s]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, limit).map(([, s]) => s);
}
