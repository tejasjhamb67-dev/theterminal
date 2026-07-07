import { useMemo } from 'react';
import type { FnProps, Security } from '../core/types';
import { QuoteHead, ScreenTitle } from '../components/widgets';
import { useQuote, useQuotes } from '../data/hooks';
import { getFundamentals } from '../data/fundamentals';
import { fmtBig, fmtDate, fmtPct, fmtPx, upDown } from '../core/fmt';
import { UNIVERSE } from '../data/universe';

const NoStock = ({ fn }: { fn: string }) => (
  <div className="empty-hint">
    {fn} needs a loaded equity — e.g. <span className="gold">AAPL {fn}</span> ⏎
  </div>
);

const B = (v: number) => '$' + fmtBig(v * 1e9);

/** FA — financial analysis. */
export function FaFn({ sec }: FnProps) {
  if (!sec || sec.kind !== 'stock') return <NoStock fn="FA" />;
  const f = getFundamentals(sec);
  const latest = f.years[f.years.length - 1];
  return (
    <>
      <QuoteHead sec={sec} />
      <div className="pill" style={{ marginBottom: 8 }}>MODELED FINANCIALS — connector pending</div>
      <div className="menu-section">Income statement · annual ($B)</div>
      <table className="grid">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>FY</th>
            <th>Revenue</th><th>Gross Profit</th><th>Op Income</th><th>Net Income</th><th>EPS</th><th>FCF</th><th>Net Margin</th><th>Rev Growth</th>
          </tr>
        </thead>
        <tbody>
          {f.years.map((y, i) => {
            const prev = f.years[i - 1];
            const g = prev ? (y.revenue / prev.revenue - 1) * 100 : undefined;
            return (
              <tr key={y.year}>
                <td style={{ textAlign: 'left' }} className="gold">{y.year}</td>
                <td>{B(y.revenue)}</td>
                <td>{B(y.grossProfit)}</td>
                <td>{B(y.opIncome)}</td>
                <td>{B(y.netIncome)}</td>
                <td>{fmtPx(y.eps)}</td>
                <td>{B(y.fcf)}</td>
                <td>{fmtPct((y.netIncome / y.revenue) * 100, false)}</td>
                <td className={upDown(g)}>{fmtPct(g)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="menu-section">Balance sheet · latest FY ($B)</div>
      <div className="stat-grid">
        <div className="stat"><span className="k">TOTAL ASSETS</span><span className="v">{B(latest.totalAssets)}</span></div>
        <div className="stat"><span className="k">TOTAL DEBT</span><span className="v">{B(latest.totalDebt)}</span></div>
        <div className="stat"><span className="k">CASH & EQUIV</span><span className="v">{B(latest.cash)}</span></div>
        <div className="stat"><span className="k">EQUITY</span><span className="v">{B(latest.equity)}</span></div>
        <div className="stat"><span className="k">NET DEBT</span><span className="v">{B(latest.totalDebt - latest.cash)}</span></div>
        <div className="stat"><span className="k">DEBT / EQUITY</span><span className="v">{(latest.totalDebt / latest.equity).toFixed(2)}x</span></div>
        <div className="stat"><span className="k">ROE</span><span className="v">{fmtPct((latest.netIncome / latest.equity) * 100, false)}</span></div>
        <div className="stat"><span className="k">SHARES OUT</span><span className="v">{f.shares.toFixed(2)}B</span></div>
      </div>
    </>
  );
}

/** EE — earnings & estimates (incl. ERN history). */
export function EeFn({ sec }: FnProps) {
  const q = useQuote(sec && sec.kind === 'stock' ? sec : null);
  if (!sec || sec.kind !== 'stock') return <NoStock fn="EE" />;
  const f = getFundamentals(sec);
  const px = q?.price ?? sec.simBase;
  const ltmEps = f.quarters.slice(-4).reduce((a, b) => a + b.eps, 0);
  return (
    <>
      <QuoteHead sec={sec} />
      <div className="stat-grid" style={{ marginBottom: 4 }}>
        <div className="stat"><span className="k">NEXT REPORT</span><span className="v gold">{fmtDate(f.nextReport.date)}</span></div>
        <div className="stat"><span className="k">EPS ESTIMATE</span><span className="v">{fmtPx(f.nextReport.epsEst)}</span></div>
        <div className="stat"><span className="k">REV ESTIMATE</span><span className="v">{B(f.nextReport.revEst)}</span></div>
        <div className="stat"><span className="k">LTM EPS</span><span className="v">{fmtPx(ltmEps)}</span></div>
        <div className="stat"><span className="k">P/E (LTM)</span><span className="v">{(px / ltmEps).toFixed(1)}x</span></div>
      </div>
      <div className="menu-section">Reported vs estimate · last 8 quarters</div>
      <table className="grid">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Qtr</th><th>Report Date</th><th>Revenue</th><th>EPS Est</th><th>EPS Act</th><th>Surprise</th><th style={{ textAlign: 'left' }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {[...f.quarters].reverse().map((qr) => {
            const surprise = ((qr.eps - qr.epsEst) / Math.abs(qr.epsEst)) * 100;
            const beat = surprise >= 0;
            return (
              <tr key={qr.label}>
                <td style={{ textAlign: 'left' }} className="gold">{qr.label}</td>
                <td className="dim">{fmtDate(qr.reportDate)}</td>
                <td>{B(qr.revenue)}</td>
                <td className="dim">{fmtPx(qr.epsEst)}</td>
                <td>{fmtPx(qr.eps)}</td>
                <td className={beat ? 'up' : 'down'}>{fmtPct(surprise)}</td>
                <td style={{ textAlign: 'left' }} className={beat ? 'up' : 'down'}>{beat ? '▲ BEAT' : '▼ MISS'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** ANR — analyst recommendations. */
export function AnrFn({ sec }: FnProps) {
  const q = useQuote(sec && sec.kind === 'stock' ? sec : null);
  if (!sec || sec.kind !== 'stock') return <NoStock fn="ANR" />;
  const f = getFundamentals(sec);
  const px = q?.price ?? sec.simBase;
  const c = f.consensus;
  const total = c.buy + c.hold + c.sell;
  const upside = ((c.avgTarget - px) / px) * 100;
  const barW = (n: number) => `${(n / total) * 100}%`;
  return (
    <>
      <QuoteHead sec={sec} />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ flex: '1 1 260px' }}>
          <div className="menu-section">Consensus · {total} analysts</div>
          <div style={{ display: 'flex', height: 14, borderRadius: 3, overflow: 'hidden', margin: '6px 0' }}>
            <div style={{ width: barW(c.buy), background: 'var(--up)' }} title="Buy" />
            <div style={{ width: barW(c.hold), background: 'var(--warn)' }} title="Hold" />
            <div style={{ width: barW(c.sell), background: 'var(--down)' }} title="Sell" />
          </div>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="stat"><span className="k up">BUY</span><span className="v">{c.buy}</span></div>
            <div className="stat"><span className="k" style={{ color: 'var(--warn)' }}>HOLD</span><span className="v">{c.hold}</span></div>
            <div className="stat"><span className="k down">SELL</span><span className="v">{c.sell}</span></div>
            <div className="stat"><span className="k">AVG TARGET</span><span className="v gold">{fmtPx(c.avgTarget)}</span></div>
            <div className="stat"><span className="k">IMPLIED {upside >= 0 ? 'UPSIDE' : 'DOWNSIDE'}</span><span className={`v ${upDown(upside)}`}>{fmtPct(upside)}</span></div>
            <div className="stat"><span className="k">TARGET RANGE</span><span className="v">{fmtPx(c.lowTarget)} – {fmtPx(c.highTarget)}</span></div>
          </div>
        </div>
        <div style={{ flex: '2 1 340px' }}>
          <div className="menu-section">By firm</div>
          <table className="grid">
            <thead><tr><th style={{ textAlign: 'left' }}>Firm</th><th>Rec</th><th>Target</th><th>vs Px</th><th>Date</th></tr></thead>
            <tbody>
              {f.recs.map((r) => {
                const vs = ((r.target - px) / px) * 100;
                return (
                  <tr key={r.firm}>
                    <td style={{ textAlign: 'left' }}>{r.firm}</td>
                    <td className={r.rec === 'BUY' ? 'up' : r.rec === 'SELL' ? 'down' : ''} style={{ letterSpacing: '0.08em' }}>{r.rec}</td>
                    <td>{fmtPx(r.target)}</td>
                    <td className={upDown(vs)}>{fmtPct(vs)}</td>
                    <td className="dim">{fmtDate(r.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pill">MODELED COVERAGE — research connector pending</div>
    </>
  );
}

/** DVD — dividends. */
export function DvdFn({ sec }: FnProps) {
  if (!sec || sec.kind !== 'stock') return <NoStock fn="DVD" />;
  const f = getFundamentals(sec);
  if (!f.dividends.length)
    return (
      <>
        <QuoteHead sec={sec} />
        <div className="empty-hint">{sec.name} does not currently pay a dividend.</div>
      </>
    );
  const ltm = f.dividends.slice(-4).reduce((a, b) => a + b.amount, 0);
  return (
    <>
      <QuoteHead sec={sec} />
      <div className="stat-grid" style={{ marginBottom: 4 }}>
        <div className="stat"><span className="k">INDICATED YIELD</span><span className="v gold">{f.indicatedDivYield.toFixed(2)}%</span></div>
        <div className="stat"><span className="k">LTM DIV / SHARE</span><span className="v">{fmtPx(ltm)}</span></div>
        <div className="stat"><span className="k">FREQUENCY</span><span className="v">QUARTERLY</span></div>
        <div className="stat"><span className="k">PAYOUT RATIO</span><span className="v">{fmtPct(f.profile.payout * 100, false)}</span></div>
      </div>
      <div className="menu-section">Distribution history</div>
      <table className="grid">
        <thead><tr><th style={{ textAlign: 'left' }}>Ex-Date</th><th>Pay Date</th><th>Amount</th><th>Growth</th></tr></thead>
        <tbody>
          {[...f.dividends].reverse().map((d, i, arr) => {
            const prev = arr[i + 1];
            const g = prev ? ((d.amount - prev.amount) / prev.amount) * 100 : undefined;
            return (
              <tr key={d.exDate}>
                <td style={{ textAlign: 'left' }} className="gold">{fmtDate(d.exDate)}</td>
                <td className="dim">{fmtDate(d.payDate)}</td>
                <td>{fmtPx(d.amount)}</td>
                <td className={upDown(g)}>{fmtPct(g)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** EQRV — relative valuation vs sector peers. */
export function EqrvFn({ sec, panel }: FnProps) {
  const peers = useMemo(() => {
    if (!sec?.sector) return [] as Security[];
    return UNIVERSE.filter((s) => s.kind === 'stock' && s.sector === sec.sector);
  }, [sec?.id]);
  const quotes = useQuotes(peers);
  if (!sec || sec.kind !== 'stock') return <NoStock fn="EQRV" />;

  const rows = peers
    .map((p) => {
      const f = getFundamentals(p);
      const px = quotes.get(p.id)?.price ?? p.simBase;
      const ltmEps = f.quarters.slice(-4).reduce((a, b) => a + b.eps, 0);
      const latest = f.years[f.years.length - 1];
      return {
        p,
        px,
        mcap: px * f.shares,
        pe: px / ltmEps,
        ps: (px * f.shares) / latest.revenue,
        de: latest.totalDebt / latest.equity,
        roe: (latest.netIncome / latest.equity) * 100,
        divYield: f.indicatedDivYield,
      };
    })
    .sort((a, b) => b.mcap - a.mcap);

  const med = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const medPe = med(rows.map((r) => r.pe));
  const subject = rows.find((r) => r.p.id === sec.id);
  const premium = subject ? ((subject.pe - medPe) / medPe) * 100 : 0;

  return (
    <>
      <QuoteHead sec={sec} />
      <div className="prose" style={{ marginBottom: 8 }}>
        {sec.ticker} trades at <b className="gold">{subject?.pe.toFixed(1)}x</b> LTM earnings —{' '}
        <b className={premium >= 0 ? 'down' : 'up'}>
          {Math.abs(premium).toFixed(0)}% {premium >= 0 ? 'premium' : 'discount'}
        </b>{' '}
        to the {sec.sector} peer median of {medPe.toFixed(1)}x.
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Ticker</th><th style={{ textAlign: 'left' }}>Name</th><th>Mkt Cap</th><th>P/E</th><th>P/S</th><th>D/E</th><th>ROE</th><th>Div Yld</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.p.id}
              className="rowlink"
              onClick={() => panel.execute(`${r.p.id} EQRV`)}
              style={r.p.id === sec.id ? { background: 'rgba(212,180,118,0.08)' } : undefined}
            >
              <td className="ticker-cell">{r.p.ticker}{r.p.id === sec.id ? ' ◄' : ''}</td>
              <td className="name-cell">{r.p.name}</td>
              <td>${fmtBig(r.mcap * 1e9)}</td>
              <td>{r.pe.toFixed(1)}x</td>
              <td>{r.ps.toFixed(1)}x</td>
              <td>{r.de.toFixed(2)}</td>
              <td>{r.roe.toFixed(1)}%</td>
              <td>{r.divYield ? r.divYield.toFixed(2) + '%' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pill" style={{ marginTop: 8 }}>MODELED MULTIPLES — fundamentals connector pending</div>
    </>
  );
}
