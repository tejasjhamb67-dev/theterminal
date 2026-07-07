import { useEffect, useMemo } from 'react';
import type { Bar, MenuItem, PanelApi, Quote, Security } from '../core/types';
import { fmtBig, fmtChg, fmtPct, fmtPx, fmtTime, upDown } from '../core/fmt';
import { usePrev, useQuote } from '../data/hooks';

/** Screen header strip: function name + subtitle. */
export function ScreenTitle({ fn, sub }: { fn: string; sub?: string }) {
  return (
    <div className="screen-title">
      <h1>{fn}</h1>
      {sub && <span className="st-sub">{sub}</span>}
    </div>
  );
}

/** Numbered menu; registers items for bare-number command execution. */
export function MenuList({
  items,
  panel,
  panelIdx: _p,
  startAt = 1,
}: {
  items: MenuItem[];
  panel: PanelApi;
  panelIdx?: number;
  startAt?: number;
}) {
  useEffect(() => {
    panel.setMenu(items);
    return () => panel.setMenu([]);
  }, [items, panel]);
  return (
    <div className="menu-list">
      {items.map((it, i) => (
        <div key={i} className="menu-item" onClick={() => panel.execute(it.cmd)}>
          <span className="mi-num">{startAt + i})</span>
          <span className="mi-label">{it.label}</span>
          {it.detail && <span className="mi-detail">{it.detail}</span>}
        </div>
      ))}
    </div>
  );
}

/** Price cell that flashes on tick. */
export function PxCell({ value, cls }: { value: number | undefined; cls?: string }) {
  const prev = usePrev(value);
  const flash =
    prev !== undefined && value !== undefined && value !== prev
      ? value > prev
        ? 'flash-up'
        : 'flash-down'
      : '';
  return (
    <td className={`${cls ?? ''} ${flash}`} key={value}>
      {fmtPx(value)}
    </td>
  );
}

/** Big quote header used by DES/BQ/GP. */
export function QuoteHead({ sec }: { sec: Security }) {
  const q = useQuote(sec);
  const dir = upDown(q?.chg);
  return (
    <div className="quote-head">
      <span className="qh-ticker">{sec.id}</span>
      <span className="qh-name">{sec.name}</span>
      <span className={`qh-px ${dir}`}>{fmtPx(q?.price)}</span>
      <span className={`qh-chg ${dir}`}>
        {fmtChg(q?.chg)} ({fmtPct(q?.chgPct)})
      </span>
      <div className="qh-meta">
        <span>O <b>{fmtPx(q?.open)}</b></span>
        <span>H <b>{fmtPx(q?.high)}</b></span>
        <span>L <b>{fmtPx(q?.low)}</b></span>
        <span>PREV <b>{fmtPx(q?.prevClose)}</b></span>
        {q?.volume ? <span>VOL <b>{fmtBig(q.volume)}</b></span> : null}
        <span>{sec.currency}</span>
        {q && <span>AS OF <b>{fmtTime(q.time)}</b></span>}
        {q && <span className={q.source === 'live' ? 'up' : 'gold'}>{q.source.toUpperCase()}</span>}
      </div>
    </div>
  );
}

/** Inline SVG sparkline from bars. */
export function Sparkline({ bars, w = 110, h = 24 }: { bars: Bar[]; w?: number; h?: number }) {
  const path = useMemo(() => {
    if (bars.length < 2) return null;
    const closes = bars.map((b) => b.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || 1;
    const pts = closes.map((c, i) => {
      const x = (i / (closes.length - 1)) * (w - 2) + 1;
      const y = h - 2 - ((c - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { d: 'M' + pts.join(' L'), rising: closes[closes.length - 1] >= closes[0] };
  }, [bars, w, h]);
  if (!path) return <span className="faint">—</span>;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={path.d} fill="none" stroke={path.rising ? 'var(--up)' : 'var(--down)'} strokeWidth="1.4" />
    </svg>
  );
}

/** Standard quote table row (ticker · name · px · chg · %). */
export function QuoteRow({
  sec,
  q,
  onOpen,
  extra,
}: {
  sec: Security;
  q: Quote | undefined;
  onOpen: (sec: Security) => void;
  extra?: React.ReactNode;
}) {
  const dir = upDown(q?.chg);
  return (
    <tr className="rowlink" onClick={() => onOpen(sec)}>
      <td className="ticker-cell">{sec.ticker}</td>
      <td className="name-cell">{sec.name}</td>
      <PxCell value={q?.price} />
      <td className={dir}>{fmtChg(q?.chg)}</td>
      <td className={dir}>{fmtPct(q?.chgPct)}</td>
      {extra}
    </tr>
  );
}
