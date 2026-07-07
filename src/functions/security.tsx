import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorType, CrosshairMode, createChart } from 'lightweight-charts';
import type { IChartApi, UTCTimestamp } from 'lightweight-charts';
import type { Bar, ChartRange, FnProps } from '../core/types';
import { QuoteHead, ScreenTitle, Sparkline } from '../components/widgets';
import { useBars, useQuote } from '../data/hooks';
import { fmtBig, fmtChg, fmtDate, fmtPct, fmtPx, upDown } from '../core/fmt';

const NoSec = () => (
  <div className="empty-hint">
    No security loaded. Type a ticker first — e.g. <span className="gold">AAPL GP</span> ⏎
  </div>
);

/** DES — security description. */
export function DesFn({ sec }: FnProps) {
  const { bars } = useBars(sec, '1Y');
  const q = useQuote(sec);
  if (!sec) return <NoSec />;
  const yrHigh = bars.length ? Math.max(...bars.map((b) => b.high)) : undefined;
  const yrLow = bars.length ? Math.min(...bars.map((b) => b.low)) : undefined;
  const yrRet =
    bars.length > 1 && q ? ((q.price - bars[0].close) / bars[0].close) * 100 : undefined;
  const vol30 = (() => {
    if (bars.length < 32) return undefined;
    const rets: number[] = [];
    for (let i = bars.length - 31; i < bars.length; i++)
      rets.push(Math.log(bars[i].close / bars[i - 1].close));
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const va = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
    return Math.sqrt(va * 252) * 100;
  })();

  return (
    <>
      <QuoteHead sec={sec} />
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 340px' }}>
          <div className="menu-section">Profile</div>
          <div className="prose">
            {sec.description ??
              `${sec.name} — ${sec.kind} instrument quoted in ${sec.currency}${sec.country ? `, ${sec.country}` : ''}.`}
          </div>
          <div className="menu-section">Classification</div>
          <div className="stat-grid">
            <div className="stat"><span className="k">TICKER</span><span className="v gold">{sec.id}</span></div>
            <div className="stat"><span className="k">TYPE</span><span className="v">{sec.kind.toUpperCase()}</span></div>
            {sec.sector && <div className="stat"><span className="k">SECTOR</span><span className="v">{sec.sector}</span></div>}
            {sec.country && <div className="stat"><span className="k">COUNTRY</span><span className="v">{sec.country}</span></div>}
            <div className="stat"><span className="k">CURRENCY</span><span className="v">{sec.currency}</span></div>
            <div className="stat"><span className="k">CONNECTOR ID</span><span className="v dim">{sec.yahoo}</span></div>
          </div>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <div className="menu-section">Key statistics · 1Y</div>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="stat"><span className="k">52W HIGH</span><span className="v">{fmtPx(yrHigh)}</span></div>
            <div className="stat"><span className="k">52W LOW</span><span className="v">{fmtPx(yrLow)}</span></div>
            <div className="stat"><span className="k">1Y RETURN</span><span className={`v ${upDown(yrRet)}`}>{fmtPct(yrRet)}</span></div>
            <div className="stat"><span className="k">30D REALIZED VOL</span><span className="v">{vol30 ? vol30.toFixed(1) + '%' : '—'}</span></div>
          </div>
          <div className="menu-section">1Y price path</div>
          <Sparkline bars={bars} w={260} h={54} />
        </div>
      </div>
    </>
  );
}

/** GP / GIP — interactive chart. */
export function GpFn({ sec, arg }: FnProps & { intraday?: boolean }) {
  return <ChartScreen sec={sec} initialRange={arg === 'ID' ? '1D' : '6M'} />;
}
export function GipFn({ sec }: FnProps) {
  return <ChartScreen sec={sec} initialRange="1D" />;
}

function ChartScreen({ sec, initialRange }: { sec: FnProps['sec']; initialRange: ChartRange }) {
  const [range, setRange] = useState<ChartRange>(initialRange);
  const [style, setStyle] = useState<'candle' | 'line'>('candle');
  const { bars, loading } = useBars(sec, range);
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !sec || !bars.length) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#97a0b3',
        fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(32,40,57,0.6)' },
        horzLines: { color: 'rgba(32,40,57,0.6)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#202839' },
      timeScale: {
        borderColor: '#202839',
        timeVisible: range === '1D' || range === '5D',
        secondsVisible: false,
      },
      autoSize: true,
    });
    chartRef.current = chart;

    const data = bars.map((b: Bar) => ({
      time: b.time as UTCTimestamp,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      value: b.close,
    }));

    if (style === 'candle') {
      const series = chart.addCandlestickSeries({
        upColor: '#4ade9c',
        downColor: '#f27983',
        borderUpColor: '#4ade9c',
        borderDownColor: '#f27983',
        wickUpColor: 'rgba(74,222,156,0.6)',
        wickDownColor: 'rgba(242,121,131,0.6)',
      });
      series.setData(data);
    } else {
      const series = chart.addAreaSeries({
        lineColor: '#d4b476',
        topColor: 'rgba(212,180,118,0.25)',
        bottomColor: 'rgba(212,180,118,0.0)',
        lineWidth: 2,
      });
      series.setData(data.map((d) => ({ time: d.time, value: d.value })));
    }

    if (bars.some((b) => b.volume)) {
      const vol = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
        color: 'rgba(93,102,120,0.5)',
      });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      vol.setData(
        bars.map((b) => ({
          time: b.time as UTCTimestamp,
          value: b.volume ?? 0,
          color: b.close >= b.open ? 'rgba(74,222,156,0.35)' : 'rgba(242,121,131,0.35)',
        })),
      );
    }

    chart.timeScale().fitContent();
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [sec?.id, bars, style, range]);

  if (!sec) return <NoSec />;

  const ranges: ChartRange[] = ['1D', '5D', '1M', '6M', '1Y', '5Y'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <QuoteHead sec={sec} />
      <div className="chart-tabs">
        {ranges.map((r) => (
          <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
        <span style={{ width: 12 }} />
        <button className={style === 'candle' ? 'on' : ''} onClick={() => setStyle('candle')}>CANDLE</button>
        <button className={style === 'line' ? 'on' : ''} onClick={() => setStyle('line')}>LINE</button>
      </div>
      <div ref={wrapRef} className="chart-wrap" style={{ flex: 1, minHeight: 220 }}>
        {loading && <div className="empty-hint">loading chart…</div>}
      </div>
    </div>
  );
}

/** HP — historical price table. */
export function HpFn({ sec }: FnProps) {
  const [range, setRange] = useState<ChartRange>('1M');
  const { bars, loading } = useBars(sec, range);
  const rows = useMemo(() => [...bars].reverse(), [bars]);
  if (!sec) return <NoSec />;
  const ranges: ChartRange[] = ['1M', '6M', '1Y', '5Y'];
  return (
    <>
      <QuoteHead sec={sec} />
      <div className="chart-tabs">
        {ranges.map((r) => (
          <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>
      {loading ? (
        <div className="empty-hint">loading…</div>
      ) : (
        <table className="grid">
          <thead>
            <tr><th style={{ textAlign: 'left' }}>Date</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Chg%</th><th>Volume</th></tr>
          </thead>
          <tbody>
            {rows.map((b, i) => {
              const prev = rows[i + 1];
              const chg = prev ? ((b.close - prev.close) / prev.close) * 100 : undefined;
              return (
                <tr key={b.time}>
                  <td style={{ textAlign: 'left' }} className="dim">{fmtDate(b.time * 1000)}</td>
                  <td>{fmtPx(b.open)}</td>
                  <td>{fmtPx(b.high)}</td>
                  <td>{fmtPx(b.low)}</td>
                  <td>{fmtPx(b.close)}</td>
                  <td className={upDown(chg)}>{fmtPct(chg)}</td>
                  <td className="dim">{fmtBig(b.volume)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

/** BQ — quote board with session detail. */
export function BqFn({ sec }: FnProps) {
  const q = useQuote(sec);
  const { bars } = useBars(sec, '1D');
  if (!sec) return <NoSec />;
  const ticks = [...bars].reverse().slice(0, 30);
  return (
    <>
      <QuoteHead sec={sec} />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div className="menu-section">Session</div>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="stat"><span className="k">OPEN</span><span className="v">{fmtPx(q?.open)}</span></div>
            <div className="stat"><span className="k">DAY HIGH</span><span className="v up">{fmtPx(q?.high)}</span></div>
            <div className="stat"><span className="k">DAY LOW</span><span className="v down">{fmtPx(q?.low)}</span></div>
            <div className="stat"><span className="k">PREV CLOSE</span><span className="v">{fmtPx(q?.prevClose)}</span></div>
            <div className="stat"><span className="k">NET CHG</span><span className={`v ${upDown(q?.chg)}`}>{fmtChg(q?.chg)}</span></div>
            <div className="stat"><span className="k">% CHG</span><span className={`v ${upDown(q?.chg)}`}>{fmtPct(q?.chgPct)}</span></div>
            <div className="stat"><span className="k">VOLUME</span><span className="v">{fmtBig(q?.volume)}</span></div>
            <div className="stat"><span className="k">RANGE POSITION</span><span className="v">{q && q.high !== q.low ? `${(((q.price - q.low) / (q.high - q.low)) * 100).toFixed(0)}% of day range` : '—'}</span></div>
          </div>
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <div className="menu-section">Recent intraday bars</div>
          <table className="grid">
            <thead><tr><th style={{ textAlign: 'left' }}>Time</th><th>Px</th><th>Chg</th></tr></thead>
            <tbody>
              {ticks.map((b, i) => {
                const prev = ticks[i + 1];
                const chg = prev ? b.close - prev.close : 0;
                return (
                  <tr key={b.time}>
                    <td style={{ textAlign: 'left' }} className="dim">
                      {new Date(b.time * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{fmtPx(b.close)}</td>
                    <td className={upDown(chg)}>{fmtChg(chg)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
