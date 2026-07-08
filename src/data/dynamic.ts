import type { Security, SecurityKind, YellowKey } from '../core/types';
import { storageGet, storageSet } from '../core/storage';
import { getDataMode } from './service';
import { addExternalResolver } from './universe';

/**
 * Dynamic universe: resolves ANY listed symbol through the live search
 * connector (Yahoo Finance covers ~100k+ instruments across global
 * exchanges), so coverage is not limited to the built-in list.
 * Resolved securities are cached and persisted; offline, unknown tickers
 * synthesize a clearly-labeled placeholder so the terminal still works.
 */

const DYN_KEY = 'theterminal.dynamicUniverse';

const dynamic = new Map<string, Security>();

// ── persistence ──────────────────────────────────────────────────
try {
  const raw = storageGet(DYN_KEY);
  if (raw) {
    for (const s of JSON.parse(raw) as Security[]) dynamic.set(s.id.toUpperCase(), s);
  }
} catch { /* ignore */ }

function persist() {
  try {
    storageSet(DYN_KEY, JSON.stringify([...dynamic.values()].slice(-500)));
  } catch { /* ignore */ }
}

export function getDynamicSecurity(id: string): Security | undefined {
  return dynamic.get(id.toUpperCase());
}
addExternalResolver(getDynamicSecurity);

export function dynamicCount(): number {
  return dynamic.size;
}

export function registerDynamic(sec: Security): Security {
  dynamic.set(sec.id.toUpperCase(), sec);
  persist();
  return sec;
}

// ── mapping helpers ──────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const EXCH_TO_CC: Record<string, string> = {
  NMS: 'US', NYQ: 'US', NGM: 'US', PCX: 'US', ASE: 'US', BTS: 'US', NCM: 'US', PNK: 'US',
  LSE: 'GB', GER: 'DE', FRA: 'DE', PAR: 'FR', AMS: 'NL', EBS: 'CH', MIL: 'IT', MCE: 'ES',
  TOR: 'CA', VAN: 'CA', ASX: 'AU', NZE: 'NZ',
  JPX: 'JP', OSA: 'JP', HKG: 'HK', SHH: 'CN', SHZ: 'CN', TAI: 'TW', KSC: 'KR', KOE: 'KR',
  NSI: 'IN', BSE: 'IN', SAO: 'BR', BUE: 'AR', MEX: 'MX', JNB: 'ZA', IST: 'TR', SAU: 'SA',
};

function kindFromQuoteType(qt: string): { kind: SecurityKind; yellowKey: YellowKey } {
  switch ((qt || '').toUpperCase()) {
    case 'ETF': return { kind: 'etf', yellowKey: 'Equity' };
    case 'INDEX': return { kind: 'index', yellowKey: 'Index' };
    case 'CURRENCY': return { kind: 'fx', yellowKey: 'Curncy' };
    case 'CRYPTOCURRENCY': return { kind: 'crypto', yellowKey: 'Crypto' };
    case 'FUTURE': return { kind: 'commodity', yellowKey: 'Comdty' };
    case 'MUTUALFUND': return { kind: 'etf', yellowKey: 'Equity' };
    default: return { kind: 'stock', yellowKey: 'Equity' };
  }
}

interface YahooHit {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  exchDisp?: string;
  quoteType?: string;
  sectorDisp?: string;
  industryDisp?: string;
}

export function securityFromHit(hit: YahooHit): Security {
  const { kind, yellowKey } = kindFromQuoteType(hit.quoteType ?? 'EQUITY');
  const country = EXCH_TO_CC[hit.exchange ?? ''] ?? undefined;
  const baseTicker = hit.symbol.split('.')[0].replace(/[=^-]/g, '').toUpperCase() || hit.symbol.toUpperCase();
  const cc = country && kind === 'stock' ? ` ${country}` : '';
  let id = `${baseTicker}${cc} ${yellowKey}`;
  // Avoid id collisions with a different underlying symbol.
  const existing = dynamic.get(id.toUpperCase());
  if (existing && existing.yahoo !== hit.symbol) id = `${hit.symbol.toUpperCase()} ${yellowKey}`;
  return {
    id,
    ticker: baseTicker + cc,
    yellowKey,
    kind,
    name: hit.longname ?? hit.shortname ?? hit.symbol,
    yahoo: hit.symbol,
    currency: 'USD',
    country,
    sector: hit.sectorDisp ?? hit.industryDisp,
    description: hit.exchDisp ? `Listed on ${hit.exchDisp}. Resolved via live market search.` : undefined,
    simBase: 20 + (hashStr(hit.symbol) % 4800) / 10,
    simVol: 0.2 + (hashStr('v' + hit.symbol) % 40) / 100,
  };
}

/** Live symbol search against the market connector. */
export async function searchMarket(query: string, limit = 6): Promise<Security[]> {
  const res = await fetch(
    `/yf/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=${limit}&newsCount=0`,
    { signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) throw new Error(`search HTTP ${res.status}`);
  const j = await res.json();
  const hits: YahooHit[] = (j?.quotes ?? []).filter((q: YahooHit) => q.symbol);
  return hits.map(securityFromHit);
}

/** Synthetic placeholder so unknown tickers still work offline. */
export function syntheticSecurity(ticker: string): Security {
  const t = ticker.toUpperCase().replace(/\s+/g, ' ').trim();
  return {
    id: `${t} Equity`,
    ticker: t,
    yellowKey: 'Equity',
    kind: 'stock',
    name: `${t} — unverified symbol (offline)`,
    yahoo: t.split(' ')[0],
    currency: 'USD',
    description:
      'Created offline without connector verification: prices shown are simulated. Reload with live data to resolve the real listing.',
    simBase: 20 + (hashStr(t) % 4800) / 10,
    simVol: 0.2 + (hashStr('v' + t) % 40) / 100,
  };
}

/**
 * Resolve a security expression against the whole market:
 * live search when the connector is up, synthetic fallback offline.
 * Returns the registered Security or null.
 */
export async function resolveMarketSecurity(text: string): Promise<Security | null> {
  const q = text.trim();
  if (!q || /^\d+$/.test(q)) return null;
  if (getDataMode() !== 'sim') {
    try {
      const hits = await searchMarket(q, 5);
      if (hits.length) {
        // Prefer an exact symbol match, else the top hit.
        const upper = q.toUpperCase();
        const exact = hits.find(
          (h) => h.yahoo.toUpperCase() === upper || h.ticker.toUpperCase() === upper || h.id.toUpperCase() === upper,
        );
        return registerDynamic(exact ?? hits[0]);
      }
      return null; // live search found nothing — symbol really doesn't exist
    } catch {
      /* connector hiccup — fall through to synthetic */
    }
  }
  // Offline: synthesize only for plausible ticker-like input.
  if (/^[A-Za-z0-9.^=\- ]{1,15}$/.test(q) && !/\s{2,}/.test(q)) {
    return registerDynamic(syntheticSecurity(q));
  }
  return null;
}
