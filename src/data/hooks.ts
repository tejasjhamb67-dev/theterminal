import { useEffect, useRef, useState } from 'react';
import type { Bar, ChartRange, DataMode, NewsItem, Quote, Security } from './hookTypes';
import { getBars, getDataMode, getNews, getQuote, getQuotes, onDataMode } from './service';

/**
 * Visibility-aware polling: pauses the interval while the tab is hidden and
 * fires immediately on return, so a backgrounded terminal costs ~nothing.
 */
function pollWhileVisible(tick: () => void, ms: number): () => void {
  let iv: ReturnType<typeof setInterval> | undefined;
  const start = () => {
    tick();
    iv = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) tick();
    }, ms);
  };
  const onVis = () => {
    if (!document.hidden) tick();
  };
  start();
  document.addEventListener('visibilitychange', onVis);
  return () => {
    if (iv) clearInterval(iv);
    document.removeEventListener('visibilitychange', onVis);
  };
}

export function useDataMode(): DataMode {
  const [m, setM] = useState<DataMode>(getDataMode());
  useEffect(() => onDataMode(setM), []);
  return m;
}

/** Streaming quote: polls the service (sim ticks every 2.5s, live every 12s). */
export function useQuote(sec: Security | null): Quote | null {
  const [q, setQ] = useState<Quote | null>(null);
  const mode = useDataMode();
  useEffect(() => {
    if (!sec) {
      setQ(null);
      return;
    }
    let dead = false;
    const tick = () => getQuote(sec).then((v) => !dead && setQ(v)).catch(() => {});
    const stop = pollWhileVisible(tick, mode === 'live' ? 6_000 : 2_500);
    return () => {
      dead = true;
      stop();
    };
  }, [sec?.id, mode]);
  return q;
}

/** Streaming quotes for a list of securities. */
export function useQuotes(secs: Security[]): Map<string, Quote> {
  const [map, setMap] = useState<Map<string, Quote>>(new Map());
  const mode = useDataMode();
  const key = secs.map((s) => s.id).join('|');
  useEffect(() => {
    if (!secs.length) return;
    let dead = false;
    const tick = () =>
      getQuotes(secs)
        .then((qs) => {
          if (dead) return;
          setMap(new Map(qs.map((q) => [q.secId, q])));
        })
        .catch(() => {});
    const stop = pollWhileVisible(tick, mode === 'live' ? 8_000 : 2_500);
    return () => {
      dead = true;
      stop();
    };
  }, [key, mode]);
  return map;
}

export function useBars(sec: Security | null, range: ChartRange): { bars: Bar[]; loading: boolean } {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const mode = useDataMode();
  useEffect(() => {
    if (!sec) return;
    let dead = false;
    setLoading(true);
    getBars(sec, range)
      .then((b) => {
        if (!dead) {
          setBars(b);
          setLoading(false);
        }
      })
      .catch(() => !dead && setLoading(false));
    // Refresh intraday periodically so 1D charts stream.
    const iv =
      range === '1D'
        ? setInterval(() => getBars(sec, range).then((b) => !dead && setBars(b)).catch(() => {}), 10_000)
        : undefined;
    return () => {
      dead = true;
      if (iv) clearInterval(iv);
    };
  }, [sec?.id, range, mode]);
  return { bars, loading };
}

export function useNews(sec?: Security | null): { news: NewsItem[]; loading: boolean } {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mode = useDataMode();
  useEffect(() => {
    let dead = false;
    setLoading(true);
    const load = () =>
      getNews(sec)
        .then((n) => {
          if (!dead) {
            setNews(n);
            setLoading(false);
          }
        })
        .catch(() => !dead && setLoading(false));
    load();
    const iv = setInterval(load, 90_000);
    return () => {
      dead = true;
      clearInterval(iv);
    };
  }, [sec?.id, mode]);
  return { news, loading };
}

/** Remembers the previous value — used for tick up/down flash styling. */
export function usePrev<T>(v: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = v;
  });
  return ref.current;
}
