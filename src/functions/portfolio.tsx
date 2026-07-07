import { useEffect, useMemo, useState } from 'react';
import type { Bar, FnProps, Security } from '../core/types';
import { ScreenTitle } from '../components/widgets';
import { useQuotes } from '../data/hooks';
import { getBars } from '../data/service';
import { annualizedVol, beta, closes, historicalVaR, logReturns } from '../core/ta';
import { fmtBig, fmtPct, fmtPx, upDown, fmtDateTime } from '../core/fmt';
import { getSecurity } from '../data/universe';
import { resolveSecurity } from '../core/parser';
import { addAlert, getAlerts, onAlertsChange, rearmAlert, removeAlert } from '../core/alerts';

const POS_KEY = 'theterminal.portfolio';

export interface Position {
  secId: string;
  qty: number;
  cost: number; // avg cost per unit
}

function loadPositions(): Position[] {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [
    { secId: 'AAPL US Equity', qty: 100, cost: 185 },
    { secId: 'NVDA US Equity', qty: 120, cost: 92 },
    { secId: 'MSFT US Equity', qty: 40, cost: 372 },
    { secId: 'SPY US Equity', qty: 30, cost: 512 },
    { secId: 'TLT US Equity', qty: 80, cost: 92 },
  ];
}

function savePositions(ps: Position[]) {
  localStorage.setItem(POS_KEY, JSON.stringify(ps));
}

function usePositions(): [Position[], (ps: Position[]) => void] {
  const [ps, setPs] = useState<Position[]>(loadPositions);
  const set = (next: Position[]) => {
    setPs(next);
    savePositions(next);
  };
  return [ps, set];
}

/** PORT — portfolio analytics & risk. */
export function PortFn({ panel }: FnProps) {
  const [positions] = usePositions();
  const secs = useMemo(
    () => positions.map((p) => getSecurity(p.secId)).filter((s): s is Security => !!s),
    [positions],
  );
  const quotes = useQuotes(secs);
  const [riskStats, setRiskStats] = useState<{ beta: number; vol: number; var95: number } | null>(null);

  const rows = positions
    .map((p) => {
      const sec = getSecurity(p.secId);
      const q = sec ? quotes.get(sec.id) : undefined;
      if (!sec) return null;
      const px = q?.price ?? sec.simBase;
      const mv = px * p.qty;
      return {
        p,
        sec,
        px,
        mv,
        dayPnl: (q?.chg ?? 0) * p.qty,
        totPnl: (px - p.cost) * p.qty,
        totPct: ((px - p.cost) / p.cost) * 100,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.mv - a.mv);

  const totMv = rows.reduce((a, r) => a + r.mv, 0);
  const totDay = rows.reduce((a, r) => a + r.dayPnl, 0);
  const totPnl = rows.reduce((a, r) => a + r.totPnl, 0);
  const totCost = rows.reduce((a, r) => a + r.p.cost * r.p.qty, 0);

  // Portfolio risk from 1Y history, weighted returns vs SPX.
  useEffect(() => {
    let dead = false;
    const spx = getSecurity('SPX Index');
    if (!secs.length || !spx) return;
    Promise.all([...secs.map((s) => getBars(s, '1Y')), getBars(spx, '1Y')])
      .then((all) => {
        if (dead) return;
        const bench = logReturns(closes(all[all.length - 1] as Bar[]));
        const weights = rows.map((r) => r.mv / totMv);
        const retSeries: number[][] = all.slice(0, secs.length).map((bars) => logReturns(closes(bars as Bar[])));
        const n = Math.min(bench.length, ...retSeries.map((r) => r.length));
        if (n < 30) return;
        const port: number[] = [];
        for (let i = 0; i < n; i++) {
          let r = 0;
          retSeries.forEach((rs, j) => {
            r += (weights[j] ?? 0) * rs[rs.length - n + i];
          });
          port.push(r);
        }
        setRiskStats({
          beta: beta(port, bench.slice(-n)),
          vol: annualizedVol(port) * 100,
          var95: historicalVaR(port, 0.95) * 100,
        });
      })
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, [secs.map((s) => s.id).join('|'), totMv > 0]);

  // Sector allocation
  const sectors = new Map<string, number>();
  for (const r of rows) {
    const k = r.sec.sector ?? r.sec.kind.toUpperCase();
    sectors.set(k, (sectors.get(k) ?? 0) + r.mv);
  }

  return (
    <>
      <ScreenTitle fn="PORT · Portfolio & Risk" sub="PRTU edits positions · risk from 1Y daily history" />
      <div className="stat-grid" style={{ marginBottom: 6 }}>
        <div className="stat"><span className="k">MARKET VALUE</span><span className="v gold">${fmtBig(totMv)}</span></div>
        <div className="stat"><span className="k">DAY P&L</span><span className={`v ${upDown(totDay)}`}>{totDay >= 0 ? '+' : '−'}${fmtBig(Math.abs(totDay))}</span></div>
        <div className="stat"><span className="k">TOTAL P&L</span><span className={`v ${upDown(totPnl)}`}>{totPnl >= 0 ? '+' : '−'}${fmtBig(Math.abs(totPnl))} ({fmtPct((totPnl / totCost) * 100)})</span></div>
        <div className="stat"><span className="k">BETA vs SPX</span><span className="v">{riskStats ? riskStats.beta.toFixed(2) : '…'}</span></div>
        <div className="stat"><span className="k">ANN. VOL</span><span className="v">{riskStats ? riskStats.vol.toFixed(1) + '%' : '…'}</span></div>
        <div className="stat"><span className="k">1D VaR 95%</span><span className="v down">{riskStats ? `${riskStats.var95.toFixed(2)}% ($${fmtBig((riskStats.var95 / 100) * totMv)})` : '…'}</span></div>
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th>Ticker</th><th style={{ textAlign: 'left' }}>Name</th><th>Qty</th><th>Cost</th><th>Last</th><th>Mkt Val</th><th>Wgt</th><th>Day P&L</th><th>Total P&L</th><th>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sec.id} className="rowlink" onClick={() => panel.execute(`${r.sec.id} DES`)}>
              <td className="ticker-cell">{r.sec.ticker}</td>
              <td className="name-cell">{r.sec.name}</td>
              <td>{r.p.qty}</td>
              <td className="dim">{fmtPx(r.p.cost)}</td>
              <td>{fmtPx(r.px)}</td>
              <td>${fmtBig(r.mv)}</td>
              <td className="dim">{((r.mv / totMv) * 100).toFixed(1)}%</td>
              <td className={upDown(r.dayPnl)}>{r.dayPnl >= 0 ? '+' : '−'}${fmtBig(Math.abs(r.dayPnl))}</td>
              <td className={upDown(r.totPnl)}>{r.totPnl >= 0 ? '+' : '−'}${fmtBig(Math.abs(r.totPnl))}</td>
              <td className={upDown(r.totPnl)}>{fmtPct(r.totPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="menu-section">Allocation</div>
      {[...sectors.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '3px 0' }}>
          <span style={{ minWidth: 190, fontSize: 11 }} className="dim">{k}</span>
          <div style={{ flex: 1, height: 10, background: 'var(--bg-raised)', borderRadius: 2 }}>
            <div style={{ width: `${(v / totMv) * 100}%`, height: '100%', background: 'var(--accent-dim)', borderRadius: 2 }} />
          </div>
          <span style={{ minWidth: 46, textAlign: 'right', fontSize: 11 }}>{((v / totMv) * 100).toFixed(1)}%</span>
        </div>
      ))}
    </>
  );
}

/** PRTU — portfolio position editor. */
export function PrtuFn({ panel }: FnProps) {
  const [positions, setPositions] = usePositions();
  const [ticker, setTicker] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    const sec = resolveSecurity(ticker);
    const q = parseFloat(qty);
    const c = parseFloat(cost);
    if (!sec) return setErr(`Can't resolve "${ticker}"`);
    if (!q || !c) return setErr('Quantity and cost required');
    setErr('');
    const existing = positions.find((p) => p.secId === sec.id);
    if (existing) {
      // Average in
      const totQty = existing.qty + q;
      const avg = (existing.qty * existing.cost + q * c) / totQty;
      setPositions(positions.map((p) => (p.secId === sec.id ? { ...p, qty: totQty, cost: avg } : p)));
    } else {
      setPositions([...positions, { secId: sec.id, qty: q, cost: c }]);
    }
    setTicker('');
    setQty('');
    setCost('');
  };

  return (
    <>
      <ScreenTitle fn="PRTU · Portfolio Setup" sub="positions persist locally · duplicate adds average in" />
      <div className="filter-bar">
        <label>TICKER</label>
        <input value={ticker} onChange={(e) => setTicker(e.target.value)} style={{ width: 150 }} placeholder="AAPL" />
        <label>QTY</label>
        <input value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: 70 }} placeholder="100" />
        <label>AVG COST</label>
        <input value={cost} onChange={(e) => setCost(e.target.value)} style={{ width: 80 }} placeholder="185.00" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn" onClick={add}>ADD ⏎</button>
        {err && <span className="down">{err}</span>}
      </div>
      <table className="grid">
        <thead><tr><th>Security</th><th>Qty</th><th>Avg Cost</th><th /></tr></thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.secId}>
              <td className="ticker-cell">{p.secId}</td>
              <td>{p.qty}</td>
              <td>{fmtPx(p.cost)}</td>
              <td>
                <button className="btn" style={{ padding: '0 6px', fontSize: 10 }} onClick={() => setPositions(positions.filter((x) => x.secId !== p.secId))}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => panel.execute('PORT')}>OPEN PORT ⏎</button>
      </div>
    </>
  );
}

/** ALRT — price alert manager. */
export function AlrtFn({ sec }: FnProps) {
  const [, force] = useState(0);
  useEffect(() => onAlertsChange(() => force((x) => x + 1)), []);
  const alerts = getAlerts();
  const [ticker, setTicker] = useState(sec?.id ?? '');
  const [op, setOp] = useState<'above' | 'below'>('above');
  const [level, setLevel] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    const s = resolveSecurity(ticker);
    const l = parseFloat(level);
    if (!s) return setErr(`Can't resolve "${ticker}"`);
    if (!l) return setErr('Level required');
    setErr('');
    addAlert(s, op, l);
    setLevel('');
  };

  return (
    <>
      <ScreenTitle fn="ALRT · Price Alerts" sub="checked against streaming quotes every 5s · fires a toast" />
      <div className="filter-bar">
        <label>TICKER</label>
        <input value={ticker} onChange={(e) => setTicker(e.target.value)} style={{ width: 150 }} placeholder="AAPL" />
        <label>WHEN</label>
        <select value={op} onChange={(e) => setOp(e.target.value as 'above' | 'below')}>
          <option value="above">TRADES ABOVE</option>
          <option value="below">TRADES BELOW</option>
        </select>
        <label>LEVEL</label>
        <input value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: 90 }} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn" onClick={add}>ARM ⏎</button>
        {err && <span className="down">{err}</span>}
      </div>
      {alerts.length === 0 ? (
        <div className="empty-hint">No alerts. Arm one above — try a level near the current price to see it fire.</div>
      ) : (
        <table className="grid">
          <thead><tr><th>Security</th><th style={{ textAlign: 'left' }}>Condition</th><th style={{ textAlign: 'left' }}>Status</th><th style={{ textAlign: 'left' }}>Fired</th><th /></tr></thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td className="ticker-cell">{a.secId}</td>
                <td style={{ textAlign: 'left' }}>{a.op === 'above' ? '≥' : '≤'} {fmtPx(a.level)}</td>
                <td style={{ textAlign: 'left' }} className={a.state === 'armed' ? 'gold' : 'up'}>
                  {a.state === 'armed' ? '● ARMED' : `✓ TRIGGERED @ ${fmtPx(a.triggeredPx)}`}
                </td>
                <td style={{ textAlign: 'left' }} className="dim">{a.triggeredAt ? fmtDateTime(a.triggeredAt) : '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {a.state === 'triggered' && (
                    <button className="btn" style={{ padding: '0 6px', fontSize: 10, marginRight: 4 }} onClick={() => rearmAlert(a.id)}>RE-ARM</button>
                  )}
                  <button className="btn" style={{ padding: '0 6px', fontSize: 10 }} onClick={() => removeAlert(a.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
