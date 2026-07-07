import type { Bar, ChartRange, NewsItem, Quote, Security } from '../../core/types';

// Yahoo Finance connector. Routed through the /yf dev-server proxy
// (see vite.config.ts) because the upstream API does not send CORS headers.

const RANGE_MAP: Record<ChartRange, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '30m' },
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
};

async function getJson(path: string, timeoutMs = 5000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(path, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function yahooBars(sec: Security, range: ChartRange): Promise<Bar[]> {
  const { range: r, interval } = RANGE_MAP[range];
  const j = await getJson(
    `/yf/v8/finance/chart/${encodeURIComponent(sec.yahoo)}?range=${r}&interval=${interval}`,
  );
  const result = j?.chart?.result?.[0];
  if (!result) throw new Error('no chart result');
  const ts: number[] = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const bars: Bar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = q.close?.[i];
    if (c === null || c === undefined) continue;
    bars.push({
      time: ts[i],
      open: q.open?.[i] ?? c,
      high: q.high?.[i] ?? c,
      low: q.low?.[i] ?? c,
      close: c,
      volume: q.volume?.[i] ?? undefined,
    });
  }
  if (!bars.length) throw new Error('empty chart');
  return bars;
}

export async function yahooQuote(sec: Security): Promise<Quote> {
  const j = await getJson(
    `/yf/v8/finance/chart/${encodeURIComponent(sec.yahoo)}?range=1d&interval=5m`,
  );
  const result = j?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta?.regularMarketPrice) throw new Error('no quote meta');
  const price: number = meta.regularMarketPrice;
  const prevClose: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const q = result.indicators?.quote?.[0] ?? {};
  const highs: number[] = (q.high ?? []).filter((x: number | null) => x != null);
  const lows: number[] = (q.low ?? []).filter((x: number | null) => x != null);
  const opens: number[] = (q.open ?? []).filter((x: number | null) => x != null);
  const vols: number[] = (q.volume ?? []).filter((x: number | null) => x != null);
  const chg = price - prevClose;
  return {
    secId: sec.id,
    price,
    chg,
    chgPct: prevClose ? (chg / prevClose) * 100 : 0,
    open: opens[0] ?? price,
    high: highs.length ? Math.max(...highs) : price,
    low: lows.length ? Math.min(...lows) : price,
    prevClose,
    volume: vols.length ? vols.reduce((a, b) => a + b, 0) : undefined,
    time: (meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
    source: 'live',
  };
}

export async function yahooNews(query: string, count = 20): Promise<NewsItem[]> {
  const j = await getJson(
    `/yf/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=${count}&quotesCount=0`,
  );
  const news: any[] = j?.news ?? [];
  if (!news.length) throw new Error('no news');
  return news.map((n, i) => ({
    id: n.uuid ?? `yf-${i}`,
    headline: n.title,
    source: n.publisher ?? 'Yahoo Finance',
    time: (n.providerPublishTime ?? 0) * 1000,
    url: n.link,
    topic: 'Live',
  }));
}
