import { useMemo, useState } from 'react';
import type { FnProps } from '../core/types';
import { QuoteHead, ScreenTitle } from '../components/widgets';
import { useBars, useQuote } from '../data/hooks';
import { blackScholes, genExpiries, smileVol } from '../core/options';
import { annualizedVol, closes, logReturns } from '../core/ta';
import { fmtPx } from '../core/fmt';

const RISK_FREE = 0.042;

const NoSec = ({ fn }: { fn: string }) => (
  <div className="empty-hint">
    Load an underlying first — e.g. <span className="gold">AAPL {fn}</span> ⏎
  </div>
);

/** Realized 30d vol as the ATM anchor, falling back to the sim vol. */
function useAtmVol(sec: FnProps['sec']): number {
  const { bars } = useBars(sec, '6M');
  return useMemo(() => {
    if (!sec) return 0.25;
    if (bars.length > 35) {
      const rets = logReturns(closes(bars).slice(-31));
      const rv = annualizedVol(rets);
      if (rv > 0.03) return rv;
    }
    return sec.simVol;
  }, [sec?.id, bars]);
}

/** Strike ladder around spot: ~2–2.5% spacing rounded to a market-style increment. */
function strikeLadder(spot: number, n = 13): { strikes: number[]; incr: number } {
  const raw = spot / 45;
  const incr =
    [0.05, 0.1, 0.25, 0.5, 1, 2, 2.5, 5, 10, 15, 20, 25, 50, 100, 150, 200, 250, 500, 1000, 2500, 5000].find(
      (x) => x >= raw,
    ) ?? 5000;
  const atm = Math.round(spot / incr) * incr;
  const out: number[] = [];
  for (let i = -Math.floor(n / 2); i <= Math.floor(n / 2); i++) out.push(atm + i * incr);
  return { strikes: out.filter((k) => k > 0), incr };
}

/** OMON — option chain monitor (Black–Scholes theoreticals on live spot). */
export function OmonFn({ sec }: FnProps) {
  const q = useQuote(sec);
  const atmVol = useAtmVol(sec);
  const expiries = useMemo(() => genExpiries(4), []);
  const [expIdx, setExpIdx] = useState(1);
  if (!sec) return <NoSec fn="OMON" />;
  const spot = q?.price ?? sec.simBase;
  const exp = expiries[expIdx];
  const { strikes, incr } = strikeLadder(spot);

  return (
    <>
      <QuoteHead sec={sec} />
      <div className="chart-tabs">
        {expiries.map((e, i) => (
          <button key={e.label} className={i === expIdx ? 'on' : ''} onClick={() => setExpIdx(i)}>{e.label}</button>
        ))}
        <span className="pill" style={{ marginLeft: 8 }}>BS THEORETICALS · ATM σ {(atmVol * 100).toFixed(1)}%</span>
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th colSpan={4} style={{ textAlign: 'center', color: 'var(--up)' }}>CALLS</th>
            <th style={{ textAlign: 'center' }}>STRIKE</th>
            <th colSpan={4} style={{ textAlign: 'center', color: 'var(--down)' }}>PUTS</th>
          </tr>
          <tr>
            <th>Px</th><th>Δ</th><th>Γ</th><th>IV</th>
            <th style={{ textAlign: 'center' }} />
            <th>IV</th><th>Δ</th><th>Γ</th><th>Px</th>
          </tr>
        </thead>
        <tbody>
          {strikes.map((k) => {
            const iv = smileVol(atmVol, k / spot, exp.t);
            const call = blackScholes({ spot, strike: k, vol: iv, rate: RISK_FREE, t: exp.t, type: 'call' });
            const put = blackScholes({ spot, strike: k, vol: iv, rate: RISK_FREE, t: exp.t, type: 'put' });
            const atm = Math.abs(k - spot) <= incr / 2;
            return (
              <tr key={k} style={atm ? { background: 'rgba(212,180,118,0.08)' } : undefined}>
                <td className={call.price > 0.01 ? '' : 'faint'}>{fmtPx(call.price)}</td>
                <td className="dim">{call.delta.toFixed(2)}</td>
                <td className="dim">{call.gamma.toFixed(4)}</td>
                <td className="dim">{(iv * 100).toFixed(1)}</td>
                <td style={{ textAlign: 'center' }} className="gold">{fmtPx(k)}{atm ? ' ◄' : ''}</td>
                <td className="dim">{(iv * 100).toFixed(1)}</td>
                <td className="dim">{put.delta.toFixed(2)}</td>
                <td className="dim">{put.gamma.toFixed(4)}</td>
                <td className={put.price > 0.01 ? '' : 'faint'}>{fmtPx(put.price)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** OVME — option pricer with editable inputs. */
export function OvmeFn({ sec }: FnProps) {
  const q = useQuote(sec);
  const atmVol = useAtmVol(sec);
  const [type, setType] = useState<'call' | 'put'>('call');
  const [strikeIn, setStrikeIn] = useState('');
  const [volIn, setVolIn] = useState('');
  const [daysIn, setDaysIn] = useState('30');
  const [rateIn, setRateIn] = useState((RISK_FREE * 100).toFixed(1));
  if (!sec) return <NoSec fn="OVME" />;

  const spot = q?.price ?? sec.simBase;
  const strike = parseFloat(strikeIn) || Math.round(spot);
  const vol = (parseFloat(volIn) || atmVol * 100) / 100;
  const days = Math.max(parseFloat(daysIn) || 30, 0.5);
  const rate = (parseFloat(rateIn) || 4.2) / 100;
  const t = days / 365;

  const res = blackScholes({ spot, strike, vol, rate, t, type });
  const breakeven = type === 'call' ? strike + res.price : strike - res.price;

  const spotShifts = [-10, -5, -2, 0, 2, 5, 10];
  return (
    <>
      <QuoteHead sec={sec} />
      <div className="filter-bar">
        <label>TYPE</label>
        <select value={type} onChange={(e) => setType(e.target.value as 'call' | 'put')}>
          <option value="call">CALL</option>
          <option value="put">PUT</option>
        </select>
        <label>STRIKE</label>
        <input style={{ width: 80 }} value={strikeIn} placeholder={String(Math.round(spot))} onChange={(e) => setStrikeIn(e.target.value)} />
        <label>VOL %</label>
        <input style={{ width: 64 }} value={volIn} placeholder={(atmVol * 100).toFixed(1)} onChange={(e) => setVolIn(e.target.value)} />
        <label>DAYS</label>
        <input style={{ width: 56 }} value={daysIn} onChange={(e) => setDaysIn(e.target.value)} />
        <label>RATE %</label>
        <input style={{ width: 56 }} value={rateIn} onChange={(e) => setRateIn(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px' }}>
          <div className="menu-section">Valuation</div>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="stat"><span className="k">THEO PRICE</span><span className="v gold" style={{ fontSize: 16 }}>{fmtPx(res.price)}</span></div>
            <div className="stat"><span className="k">% OF SPOT</span><span className="v">{((res.price / spot) * 100).toFixed(2)}%</span></div>
            <div className="stat"><span className="k">BREAKEVEN AT EXPIRY</span><span className="v">{fmtPx(breakeven)}</span></div>
            <div className="stat"><span className="k">DELTA</span><span className="v">{res.delta.toFixed(3)}</span></div>
            <div className="stat"><span className="k">GAMMA</span><span className="v">{res.gamma.toFixed(5)}</span></div>
            <div className="stat"><span className="k">VEGA / VOL PT</span><span className="v">{res.vega.toFixed(3)}</span></div>
            <div className="stat"><span className="k">THETA / DAY</span><span className="v down">{res.theta.toFixed(3)}</span></div>
            <div className="stat"><span className="k">RHO / 1%</span><span className="v">{res.rho.toFixed(3)}</span></div>
          </div>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <div className="menu-section">Spot ladder · value & P&L</div>
          <table className="grid">
            <thead><tr><th>Spot</th><th>Move</th><th>Theo</th><th>P&L</th></tr></thead>
            <tbody>
              {spotShifts.map((pct) => {
                const s2 = spot * (1 + pct / 100);
                const v2 = blackScholes({ spot: s2, strike, vol, rate, t, type });
                const pnl = v2.price - res.price;
                return (
                  <tr key={pct} style={pct === 0 ? { background: 'rgba(212,180,118,0.08)' } : undefined}>
                    <td>{fmtPx(s2)}</td>
                    <td className={pct > 0 ? 'up' : pct < 0 ? 'down' : 'dim'}>{pct > 0 ? '+' : ''}{pct}%</td>
                    <td>{fmtPx(v2.price)}</td>
                    <td className={pnl > 0 ? 'up' : pnl < 0 ? 'down' : 'dim'}>{pnl >= 0 ? '+' : ''}{fmtPx(pnl)}</td>
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

/** SKEW — implied-vol smile by expiry. */
export function SkewFn({ sec }: FnProps) {
  const q = useQuote(sec);
  const atmVol = useAtmVol(sec);
  const expiries = useMemo(() => genExpiries(3), []);
  if (!sec) return <NoSec fn="SKEW" />;
  const spot = q?.price ?? sec.simBase;

  const moneyness = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2];
  const COLORS = ['#d4b476', '#8ab8e8', '#4ade9c', '#f27983'];

  const W = 640;
  const H = 240;
  const PAD = 44;
  const allVols = expiries.flatMap((e) => moneyness.map((m) => smileVol(atmVol, m, e.t) * 100));
  const vMin = Math.min(...allVols) - 2;
  const vMax = Math.max(...allVols) + 2;
  const xPos = (m: number) => PAD + ((m - 0.8) / 0.4) * (W - PAD * 2);
  const yPos = (v: number) => H - PAD - ((v - vMin) / (vMax - vMin)) * (H - PAD * 2);

  return (
    <>
      <QuoteHead sec={sec} />
      <ScreenTitle fn="SKEW · Volatility Smile" sub={`modeled surface anchored to ${(atmVol * 100).toFixed(1)}% realized ATM vol`} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 760 }}>
        {[...Array(5)].map((_, i) => {
          const v = vMin + ((vMax - vMin) * i) / 4;
          return (
            <g key={i}>
              <line x1={PAD} x2={W - PAD} y1={yPos(v)} y2={yPos(v)} stroke="rgba(32,40,57,0.8)" />
              <text x={6} y={yPos(v) + 4} fill="#5d6678" fontSize="11">{v.toFixed(0)}%</text>
            </g>
          );
        })}
        {moneyness.map((m) => (
          <text key={m} x={xPos(m)} y={H - PAD + 18} fill="#97a0b3" fontSize="10" textAnchor="middle">
            {(m * 100).toFixed(0)}%
          </text>
        ))}
        <text x={W / 2} y={H - 6} fill="#5d6678" fontSize="10" textAnchor="middle">STRIKE / SPOT</text>
        <line x1={xPos(1)} x2={xPos(1)} y1={PAD - 8} y2={H - PAD} stroke="rgba(212,180,118,0.35)" strokeDasharray="3 3" />
        {expiries.map((e, i) => {
          const pts = moneyness.map((m) => `${xPos(m).toFixed(1)},${yPos(smileVol(atmVol, m, e.t) * 100).toFixed(1)}`);
          return <path key={e.label} d={'M' + pts.join(' L')} fill="none" stroke={COLORS[i]} strokeWidth="2" />;
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {expiries.map((e, i) => (
          <span key={e.label} style={{ color: COLORS[i], fontSize: 11.5 }}>■ {e.label}</span>
        ))}
      </div>
      <div className="prose faint" style={{ marginTop: 8 }}>
        Downside strikes carry higher implied vol (put skew) — the market pays up for crash protection. Shorter expiries
        show a steeper smile. Spot {fmtPx(spot)}.
      </div>
    </>
  );
}
