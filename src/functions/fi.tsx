import { useMemo, useState } from 'react';
import type { FnProps, Security } from '../core/types';
import { ScreenTitle } from '../components/widgets';
import { useQuotes } from '../data/hooks';
import { bondRisk, priceFromYield, yieldFromPrice } from '../core/bond';
import { fmtPct, fmtPx } from '../core/fmt';
import { getSecurity } from '../data/universe';

const TENORS = [
  { label: '2Y', years: 2, coupon: 3.875, benchmark: 'USGG2YR Index' },
  { label: '5Y', years: 5, coupon: 4.0, benchmark: 'USGG5YR Index' },
  { label: '10Y', years: 10, coupon: 4.25, benchmark: 'USGG10YR Index' },
  { label: '30Y', years: 30, coupon: 4.625, benchmark: 'USGG30YR Index' },
];

function benchmarkSecs(): Security[] {
  return TENORS.map((t) => getSecurity(t.benchmark)).filter((x): x is Security => !!x);
}

/** YAS — yield & spread analysis (treasury calculator). */
export function YasFn(_: FnProps) {
  const secs = benchmarkSecs();
  const quotes = useQuotes(secs);
  const [tenorIdx, setTenorIdx] = useState(2); // default 10Y
  const [override, setOverride] = useState<{ field: 'yield' | 'price'; value: string } | null>(null);

  const tenor = TENORS[tenorIdx];
  const mktYield = quotes.get(tenor.benchmark)?.price;
  const spec = { coupon: tenor.coupon, yearsToMaturity: tenor.years };

  let y = mktYield ?? 4.25;
  let source = 'MARKET';
  if (override) {
    const v = parseFloat(override.value);
    if (!isNaN(v)) {
      y = override.field === 'yield' ? v : yieldFromPrice(spec, v);
      source = 'USER';
    }
  }
  const risk = bondRisk(spec, y);
  const maturity = new Date();
  maturity.setFullYear(maturity.getFullYear() + tenor.years);

  const scenarios = [-50, -25, -10, 0, 10, 25, 50].map((bp) => ({
    bp,
    px: priceFromYield(spec, y + bp / 100),
  }));

  return (
    <>
      <ScreenTitle fn="YAS · Yield & Spread Analysis" sub="US treasury benchmark calculator — semiannual bond-equivalent" />
      <div className="chart-tabs">
        {TENORS.map((t, i) => (
          <button key={t.label} className={i === tenorIdx ? 'on' : ''} onClick={() => { setTenorIdx(i); setOverride(null); }}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="stat-grid" style={{ marginTop: 6 }}>
        <div className="stat"><span className="k">ISSUE</span><span className="v gold">T {tenor.coupon.toFixed(3)} {maturity.toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}</span></div>
        <div className="stat"><span className="k">COUPON</span><span className="v">{tenor.coupon.toFixed(3)}%</span></div>
        <div className="stat"><span className="k">MATURITY</span><span className="v">{tenor.years}Y</span></div>
        <div className="stat"><span className="k">YIELD SOURCE</span><span className="v">{source}</span></div>
      </div>
      <div className="filter-bar" style={{ margin: '10px 0' }}>
        <label>YIELD %</label>
        <input
          style={{ width: 90 }}
          value={override?.field === 'yield' ? override.value : y.toFixed(3)}
          onChange={(e) => setOverride({ field: 'yield', value: e.target.value })}
        />
        <label>PRICE</label>
        <input
          style={{ width: 90 }}
          value={override?.field === 'price' ? override.value : risk.price.toFixed(4)}
          onChange={(e) => setOverride({ field: 'price', value: e.target.value })}
        />
        <button className="btn" onClick={() => setOverride(null)}>RESET TO MARKET</button>
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div className="menu-section">Risk</div>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="stat"><span className="k">CLEAN PRICE</span><span className="v gold">{risk.price.toFixed(4)}</span></div>
            <div className="stat"><span className="k">YIELD (S/A)</span><span className="v gold">{y.toFixed(3)}%</span></div>
            <div className="stat"><span className="k">MACAULAY DURATION</span><span className="v">{risk.macaulay.toFixed(2)}Y</span></div>
            <div className="stat"><span className="k">MODIFIED DURATION</span><span className="v">{risk.modified.toFixed(2)}</span></div>
            <div className="stat"><span className="k">DV01 / 100 FACE</span><span className="v">${risk.dv01.toFixed(4)}</span></div>
            <div className="stat"><span className="k">CONVEXITY</span><span className="v">{risk.convexity.toFixed(1)}</span></div>
          </div>
        </div>
        <div style={{ flex: '1 1 260px' }}>
          <div className="menu-section">Rate scenarios</div>
          <table className="grid">
            <thead><tr><th>Shift</th><th>Yield</th><th>Price</th><th>P&L / 100</th></tr></thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.bp} style={s.bp === 0 ? { background: 'rgba(212,180,118,0.08)' } : undefined}>
                  <td>{s.bp > 0 ? '+' : ''}{s.bp}bp</td>
                  <td>{(y + s.bp / 100).toFixed(3)}%</td>
                  <td>{s.px.toFixed(4)}</td>
                  <td className={s.px - risk.price > 0 ? 'up' : s.px - risk.price < 0 ? 'down' : 'dim'}>
                    {(s.px - risk.price).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** GC — treasury curve graph. */
export function GcFn(_: FnProps) {
  const secs = benchmarkSecs();
  const quotes = useQuotes(secs);
  const points = TENORS.map((t) => ({ t, y: quotes.get(t.benchmark)?.price }));
  const ready = points.every((p) => p.y !== undefined);
  const y2 = points[0].y;
  const y10 = points[2].y;
  const spread2s10s = y2 !== undefined && y10 !== undefined ? (y10 - y2) * 100 : undefined;

  // SVG curve
  const W = 640;
  const H = 260;
  const PAD = 44;
  const xs = [2, 5, 10, 30];
  const xPos = (yr: number) => PAD + (Math.log(yr / 2) / Math.log(30 / 2)) * (W - PAD * 2);
  const yVals = points.map((p) => p.y ?? 0);
  const yMin = Math.min(...yVals) - 0.25;
  const yMax = Math.max(...yVals) + 0.25;
  const yPos = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - PAD * 2);
  const path = ready
    ? 'M' + points.map((p, i) => `${xPos(xs[i]).toFixed(1)},${yPos(p.y!).toFixed(1)}`).join(' L')
    : '';

  return (
    <>
      <ScreenTitle fn="GC · Treasury Curve" sub="constant-maturity benchmark yields, live" />
      {!ready ? (
        <div className="empty-hint">loading curve…</div>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 760 }}>
            {[...Array(5)].map((_, i) => {
              const v = yMin + ((yMax - yMin) * i) / 4;
              return (
                <g key={i}>
                  <line x1={PAD} x2={W - PAD} y1={yPos(v)} y2={yPos(v)} stroke="rgba(32,40,57,0.8)" />
                  <text x={8} y={yPos(v) + 4} fill="#5d6678" fontSize="11">{v.toFixed(2)}%</text>
                </g>
              );
            })}
            {points.map((p, i) => (
              <g key={p.t.label}>
                <circle cx={xPos(xs[i])} cy={yPos(p.y!)} r="4" fill="#d4b476" />
                <text x={xPos(xs[i])} y={H - PAD + 18} fill="#97a0b3" fontSize="11" textAnchor="middle">{p.t.label}</text>
                <text x={xPos(xs[i])} y={yPos(p.y!) - 10} fill="#e9e4d8" fontSize="11" textAnchor="middle">{p.y!.toFixed(2)}</text>
              </g>
            ))}
            <path d={path} fill="none" stroke="#d4b476" strokeWidth="2" />
          </svg>
          <div className="stat-grid">
            <div className="stat"><span className="k">2s10s</span><span className={`v ${spread2s10s !== undefined && spread2s10s < 0 ? 'down' : 'up'}`}>{spread2s10s?.toFixed(0)}bp</span></div>
            <div className="stat"><span className="k">SHAPE</span><span className="v">{spread2s10s !== undefined ? (spread2s10s < 0 ? 'INVERTED' : spread2s10s < 40 ? 'FLAT' : 'NORMAL') : '—'}</span></div>
            <div className="stat"><span className="k">5s30s</span><span className="v">{points[3].y !== undefined && points[1].y !== undefined ? ((points[3].y - points[1].y) * 100).toFixed(0) + 'bp' : '—'}</span></div>
          </div>
          <div className="prose faint" style={{ marginTop: 6 }}>
            {spread2s10s !== undefined && spread2s10s < 0
              ? 'The curve is inverted — short rates above long rates, historically a late-cycle signal.'
              : 'Positively sloped curve — term premium is being paid for duration.'}
          </div>
        </>
      )}
    </>
  );
}

/** WIRP — implied policy path (indicative model). */
export function WirpFn(_: FnProps) {
  const meetings = useMemo(() => {
    const CURRENT_MID = 4.375; // midpoint of 4.25–4.50 target band
    const out: Array<{ date: Date; cutProb: number; holdProb: number; hikeProb: number; implied: number }> = [];
    const d = new Date();
    let implied = CURRENT_MID;
    let easing = 0.35;
    for (let i = 0; i < 6; i++) {
      d.setDate(d.getDate() + 42 + (i % 2) * 7);
      const cutProb = Math.min(0.95, easing);
      const hikeProb = Math.max(0, 0.04 - i * 0.005);
      const holdProb = Math.max(0, 1 - cutProb - hikeProb);
      implied = implied - cutProb * 0.25 + hikeProb * 0.25;
      out.push({ date: new Date(d), cutProb, holdProb, hikeProb, implied });
      easing = Math.min(0.95, easing + 0.14);
    }
    return out;
  }, []);

  return (
    <>
      <ScreenTitle fn="WIRP · Implied Policy Path" sub="indicative meeting-by-meeting probabilities — futures connector pending" />
      <div className="stat-grid" style={{ marginBottom: 4 }}>
        <div className="stat"><span className="k">CURRENT TARGET</span><span className="v gold">4.25 – 4.50%</span></div>
        <div className="stat"><span className="k">MEETINGS MODELED</span><span className="v">{meetings.length}</span></div>
      </div>
      <table className="grid">
        <thead>
          <tr><th style={{ textAlign: 'left' }}>Meeting</th><th>Cut −25</th><th>Hold</th><th>Hike +25</th><th>Implied Mid</th><th>Cum. Δ</th></tr>
        </thead>
        <tbody>
          {meetings.map((m) => (
            <tr key={m.date.toISOString()}>
              <td style={{ textAlign: 'left' }} className="gold">
                {m.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
              </td>
              <td className={m.cutProb > 0.5 ? 'up' : ''}>{fmtPct(m.cutProb * 100, false)}</td>
              <td>{fmtPct(m.holdProb * 100, false)}</td>
              <td className="dim">{fmtPct(m.hikeProb * 100, false)}</td>
              <td>{m.implied.toFixed(3)}%</td>
              <td className={m.implied < 4.375 ? 'up' : 'dim'}>{((m.implied - 4.375) * 100).toFixed(0)}bp</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="prose faint" style={{ marginTop: 8 }}>
        Probabilities shown are an indicative model path, not derived from live futures pricing yet. The market-implied
        version arrives with a rates-futures connector (see docs/ARCHITECTURE.md).
      </div>
    </>
  );
}
