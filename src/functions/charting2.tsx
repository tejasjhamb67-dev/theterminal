import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorType, createChart } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';
import type { Bar, ChartRange, FnProps, Security } from '../core/types';
import { QuoteHead, ScreenTitle } from '../components/widgets';
import { getBars } from '../data/service';
import { useBars } from '../data/hooks';
import { bollinger, closes, correlation, logReturns, macd, rsi, sma } from '../core/ta';
import { fmtPct, fmtPx, upDown } from '../core/fmt';
import { UNIVERSE, getSecurity } from '../data/universe';
import { resolveSecurity } from '../core/parser';

const SERIES_COLORS = ['#d4b476', '#8ab8e8', '#4ade9c', '#f27983', '#c792ea', '#e8c468'];

function useMultiBars(secs: Security[], range: ChartRange): Map<string, Bar[]> {
  const [map, setMap] = useState<Map<string, Bar[]>>(new Map());
  const key = secs.map((s) => s.id).join('|') + range;
  useEffect(() => {
    let dead = false;
    Promise.all(
      secs.map(
        (s): Promise<[string, Bar[]]> =>
          getBars(s, range).then(
            (b): [string, Bar[]] => [s.id, b],
            (): [string, Bar[]] => [s.id, []],
          ),
      ),
    ).then((entries) => !dead && setMap(new Map(entries)));
    return () => {
      dead = true;
    };
  }, [key]);
  return map;
}

function defaultPeers(sec: Security | null): Security[] {
  const spx = getSecurity('SPX Index')!;
  if (!sec) return [spx];
  const peers = sec.sector
    ? UNIVERSE.filter((s) => s.kind === 'stock' && s.sector === sec.sector && s.id !== sec.id).slice(0, 3)
    : [];
  return [sec, ...peers, spx].slice(0, 5);
}

/** COMP — comparative total return. Arg: extra tickers, comma separated. */
export function CompFn({ sec, arg }: FnProps) {
  const [range, setRange] = useState<ChartRange>('1Y');
  const secs = useMemo(() => {
    const base = defaultPeers(sec);
    if (arg) {
      const extra = arg.split(/[,\s]+/).map((t) => resolveSecurity(t)).filter((x): x is Security => !!x);
      const all = [...(sec ? [sec] : []), ...extra];
      return [...new Map(all.map((s) => [s.id, s])).values()].slice(0, 6);
    }
    return base;
  }, [sec?.id, arg]);
  const barsMap = useMultiBars(secs, range);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Normalized % return series aligned on common timestamps.
  const normalized = useMemo(() => {
    const out: Array<{ sec: Security; points: Array<{ time: number; value: number }>; total: number }> = [];
    for (const s of secs) {
      const bars = barsMap.get(s.id) ?? [];
      if (bars.length < 2) continue;
      const base = bars[0].close;
      out.push({
        sec: s,
        points: bars.map((b) => ({ time: b.time, value: (b.close / base - 1) * 100 })),
        total: (bars[bars.length - 1].close / base - 1) * 100,
      });
    }
    return out;
  }, [secs, barsMap]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !normalized.length) return;
    const chart = createChart(el, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#97a0b3', fontSize: 11 },
      grid: { vertLines: { color: 'rgba(32,40,57,0.6)' }, horzLines: { color: 'rgba(32,40,57,0.6)' } },
      rightPriceScale: { borderColor: '#202839' },
      timeScale: { borderColor: '#202839' },
      autoSize: true,
    });
    normalized.forEach((n, i) => {
      const series = chart.addLineSeries({ color: SERIES_COLORS[i % SERIES_COLORS.length], lineWidth: 2, priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(1) + '%' } });
      series.setData(n.points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })));
    });
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [normalized]);

  const ranges: ChartRange[] = ['1M', '6M', '1Y', '5Y'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ScreenTitle fn="COMP · Comparative Returns" sub="indexed to 0% at range start · COMP <tickers> to customize" />
      <div className="chart-tabs">
        {ranges.map((r) => (
          <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '2px 0 6px' }}>
        {normalized.map((n, i) => (
          <span key={n.sec.id} style={{ color: SERIES_COLORS[i % SERIES_COLORS.length], fontSize: 11.5 }}>
            ■ {n.sec.ticker} <b className={upDown(n.total)}>{fmtPct(n.total)}</b>
          </span>
        ))}
      </div>
      <div ref={wrapRef} style={{ flex: 1, minHeight: 220 }} />
    </div>
  );
}

/** CORR — correlation matrix over daily returns. */
export function CorrFn({ sec, arg }: FnProps) {
  const secs = useMemo(() => {
    if (arg) {
      const list = arg.split(/[,\s]+/).map((t) => resolveSecurity(t)).filter((x): x is Security => !!x);
      if (list.length >= 2) return list.slice(0, 7);
    }
    const base = ['SPX Index', 'USGG10YR Index', 'DXY Curncy', 'CL1 Comdty', 'GC1 Comdty', 'XBT Crypto']
      .map((id) => getSecurity(id))
      .filter((x): x is Security => !!x);
    return sec && !base.some((b) => b.id === sec.id) ? [sec, ...base].slice(0, 7) : base;
  }, [sec?.id, arg]);
  const barsMap = useMultiBars(secs, '1Y');

  const matrix = useMemo(() => {
    const rets = new Map<string, number[]>();
    for (const s of secs) {
      const bars = barsMap.get(s.id) ?? [];
      if (bars.length > 30) rets.set(s.id, logReturns(closes(bars)));
    }
    return secs.map((a) =>
      secs.map((b) => {
        const ra = rets.get(a.id);
        const rb = rets.get(b.id);
        return ra && rb ? correlation(ra, rb) : NaN;
      }),
    );
  }, [secs, barsMap]);

  const cellColor = (c: number) => {
    if (isNaN(c)) return undefined;
    const alpha = Math.min(Math.abs(c), 1) * 0.35;
    return c >= 0 ? `rgba(74,222,156,${alpha})` : `rgba(242,121,131,${alpha})`;
  };

  return (
    <>
      <ScreenTitle fn="CORR · Correlation Matrix" sub="1Y daily log returns · CORR <tickers> to customize" />
      <table className="grid">
        <thead>
          <tr>
            <th />
            {secs.map((s) => <th key={s.id}>{s.ticker}</th>)}
          </tr>
        </thead>
        <tbody>
          {secs.map((s, i) => (
            <tr key={s.id}>
              <td className="ticker-cell">{s.ticker}</td>
              {secs.map((t, j) => (
                <td key={t.id} style={{ background: cellColor(matrix[i]?.[j]) }}>
                  {isNaN(matrix[i]?.[j]) ? '…' : matrix[i][j].toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="prose faint" style={{ marginTop: 10 }}>
        Green = positive co-movement, red = negative. Diagonal is 1.00 by construction.
      </div>
    </>
  );
}

/** TECH — technical study dashboard with signal read-out. */
export function TechFn({ sec }: FnProps) {
  const { bars } = useBars(sec, '1Y');
  if (!sec) return <div className="empty-hint">Load a security first — e.g. <span className="gold">AAPL TECH</span> ⏎</div>;
  if (bars.length < 60) return <div className="empty-hint">insufficient history…</div>;

  const cx = closes(bars);
  const px = cx[cx.length - 1];
  const s50 = sma(cx, 50);
  const s200 = sma(cx, 200);
  const r = rsi(cx, 14);
  const m = macd(cx);
  const bb = bollinger(cx, 20, 2);
  const last = <T,>(xs: Array<T | null>): T | null => {
    for (let i = xs.length - 1; i >= 0; i--) if (xs[i] !== null) return xs[i];
    return null;
  };

  const v50 = last(s50);
  const v200 = last(s200);
  const vRsi = last(r);
  const vMacd = m[m.length - 1];
  const vBb = last(bb);
  const hi52 = Math.max(...bars.map((b) => b.high));
  const lo52 = Math.min(...bars.map((b) => b.low));

  interface Signal { study: string; value: string; read: string; tone: 'up' | 'down' | 'dim' }
  const signals: Signal[] = [];
  if (v50 && v200) {
    const golden = v50 > v200;
    signals.push({
      study: 'TREND · SMA 50/200',
      value: `${fmtPx(v50)} / ${fmtPx(v200)}`,
      read: golden ? 'Golden alignment — uptrend intact' : 'Dead cross — downtrend regime',
      tone: golden ? 'up' : 'down',
    });
    signals.push({
      study: 'PRICE vs SMA50',
      value: fmtPct(((px - v50) / v50) * 100),
      read: px > v50 ? 'Trading above the 50-day' : 'Trading below the 50-day',
      tone: px > v50 ? 'up' : 'down',
    });
  }
  if (vRsi !== null) {
    signals.push({
      study: 'MOMENTUM · RSI 14',
      value: vRsi.toFixed(1),
      read: vRsi > 70 ? 'Overbought — stretch risk' : vRsi < 30 ? 'Oversold — mean-reversion zone' : 'Neutral momentum',
      tone: vRsi > 70 ? 'down' : vRsi < 30 ? 'up' : 'dim',
    });
  }
  if (vMacd.macd !== null && vMacd.signal !== null) {
    const bull = vMacd.macd > vMacd.signal;
    signals.push({
      study: 'MACD 12/26/9',
      value: `${vMacd.macd.toFixed(2)} vs ${vMacd.signal.toFixed(2)}`,
      read: bull ? 'MACD above signal — bullish impulse' : 'MACD below signal — bearish impulse',
      tone: bull ? 'up' : 'down',
    });
  }
  if (vBb) {
    const pos = (px - vBb.dn) / (vBb.up - vBb.dn);
    signals.push({
      study: 'BOLLINGER 20/2',
      value: `${(pos * 100).toFixed(0)}% of band`,
      read: pos > 0.95 ? 'Pressing the upper band' : pos < 0.05 ? 'Pressing the lower band' : 'Inside the bands',
      tone: pos > 0.95 ? 'down' : pos < 0.05 ? 'up' : 'dim',
    });
  }
  signals.push({
    study: '52-WEEK RANGE',
    value: `${fmtPx(lo52)} – ${fmtPx(hi52)}`,
    read: `${(((px - lo52) / (hi52 - lo52)) * 100).toFixed(0)}% of the 52-week range`,
    tone: 'dim',
  });

  const bullish = signals.filter((s) => s.tone === 'up').length;
  const bearish = signals.filter((s) => s.tone === 'down').length;
  const verdict = bullish > bearish ? 'NET CONSTRUCTIVE' : bearish > bullish ? 'NET CAUTIOUS' : 'MIXED TAPE';

  return (
    <>
      <QuoteHead sec={sec} />
      <div className="menu-section">Signal summary</div>
      <div className="prose" style={{ marginBottom: 8 }}>
        <b className={bullish > bearish ? 'up' : bearish > bullish ? 'down' : 'gold'}>{verdict}</b> — {bullish} bullish
        vs {bearish} bearish studies on the daily tape.
      </div>
      <table className="grid">
        <thead><tr><th style={{ textAlign: 'left' }}>Study</th><th>Value</th><th style={{ textAlign: 'left' }}>Read</th></tr></thead>
        <tbody>
          {signals.map((s) => (
            <tr key={s.study}>
              <td style={{ textAlign: 'left' }} className="gold">{s.study}</td>
              <td>{s.value}</td>
              <td style={{ textAlign: 'left' }} className={s.tone === 'dim' ? 'dim' : s.tone}>{s.read}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
