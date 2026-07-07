import { useMemo, useState } from 'react';
import type { FnProps, NewsItem, Security } from '../core/types';
import { QuoteHead, ScreenTitle } from '../components/widgets';
import { useBars, useNews, useQuote, useQuotes } from '../data/hooks';
import { annualizedVol, closes, logReturns, maxDrawdown, rsi, sma } from '../core/ta';
import { aggregateSentiment, scoreHeadline } from '../core/sentiment';
import { ago, fmtPct, fmtPx, upDown } from '../core/fmt';
import { getSecurity } from '../data/universe';
import { resolveSecurity } from '../core/parser';

/** IQ — security intelligence: quantitative + news read in plain language. */
export function IqFn({ sec }: FnProps) {
  const q = useQuote(sec);
  const { bars } = useBars(sec, '1Y');
  const { news } = useNews(sec);
  if (!sec) return <div className="empty-hint">Load a security first — e.g. <span className="gold">NVDA IQ</span> ⏎</div>;
  if (bars.length < 60 || !q) return <div className="empty-hint">assembling intelligence…</div>;

  const cx = closes(bars);
  const px = q.price;
  const rets = logReturns(cx);
  const vol30 = annualizedVol(rets.slice(-30)) * 100;
  const vol1y = annualizedVol(rets) * 100;
  const volRegime = vol30 > vol1y * 1.25 ? 'ELEVATED' : vol30 < vol1y * 0.75 ? 'COMPRESSED' : 'NORMAL';
  const s50v = sma(cx, 50)[cx.length - 1];
  const s200v = sma(cx, 200)[cx.length - 1];
  const rsiV = rsi(cx, 14)[cx.length - 1];
  const hi52 = Math.max(...bars.map((b) => b.high));
  const lo52 = Math.min(...bars.map((b) => b.low));
  const rangePos = ((px - lo52) / (hi52 - lo52)) * 100;
  const ret1y = (px / cx[0] - 1) * 100;
  const mdd = maxDrawdown(cx) * 100;
  const senti = aggregateSentiment(news);

  const trendLine =
    s50v && s200v
      ? px > s50v && s50v > s200v
        ? 'in a firm uptrend — price above the 50-day, which sits above the 200-day'
        : px < s50v && s50v < s200v
          ? 'in a downtrend — price below the 50-day, which sits below the 200-day'
          : 'in a transition zone, with the moving averages crossed against each other'
      : 'still building trend history';
  const momLine =
    rsiV === null ? '' : rsiV > 70 ? 'Momentum is stretched (RSI ' + rsiV.toFixed(0) + ') — chase risk is real.' : rsiV < 30 ? 'Momentum is washed out (RSI ' + rsiV.toFixed(0) + ') — mean-reversion setups favored.' : `Momentum is unremarkable (RSI ${rsiV.toFixed(0)}).`;
  const volLine =
    volRegime === 'ELEVATED'
      ? `Realized vol is running hot — 30-day at ${vol30.toFixed(0)}% vs ${vol1y.toFixed(0)}% for the year. Size positions accordingly.`
      : volRegime === 'COMPRESSED'
        ? `Vol is compressed — 30-day at ${vol30.toFixed(0)}% vs ${vol1y.toFixed(0)}% for the year. Regimes like this often precede expansion.`
        : `Vol is in line with its 1-year norm (~${vol1y.toFixed(0)}%).`;
  const newsLine = news.length
    ? `The news tape reads ${senti.label.toLowerCase()} (${senti.pos} positive / ${senti.neg} negative headlines).`
    : 'No recent headlines.';

  return (
    <>
      <QuoteHead sec={sec} />
      <div className="menu-section">The read</div>
      <div className="prose" style={{ marginBottom: 10 }}>
        {sec.name} is {trendLine}, sitting at <b className="gold">{rangePos.toFixed(0)}%</b> of its 52-week range after a{' '}
        <b className={upDown(ret1y)}>{fmtPct(ret1y)}</b> year. {momLine} {volLine} {newsLine}
      </div>
      <div className="menu-section">Dashboard</div>
      <div className="stat-grid">
        <div className="stat"><span className="k">TREND (P vs 50D)</span><span className={`v ${s50v && px > s50v ? 'up' : 'down'}`}>{s50v ? (px > s50v ? 'ABOVE' : 'BELOW') + ' · ' + fmtPx(s50v) : '—'}</span></div>
        <div className="stat"><span className="k">200D AVG</span><span className="v">{s200v ? fmtPx(s200v) : '—'}</span></div>
        <div className="stat"><span className="k">RSI 14</span><span className="v">{rsiV?.toFixed(1) ?? '—'}</span></div>
        <div className="stat"><span className="k">52W RANGE POSITION</span><span className="v">{rangePos.toFixed(0)}%</span></div>
        <div className="stat"><span className="k">1Y RETURN</span><span className={`v ${upDown(ret1y)}`}>{fmtPct(ret1y)}</span></div>
        <div className="stat"><span className="k">MAX DRAWDOWN 1Y</span><span className="v down">{mdd.toFixed(1)}%</span></div>
        <div className="stat"><span className="k">VOL 30D / 1Y</span><span className="v">{vol30.toFixed(0)}% / {vol1y.toFixed(0)}%</span></div>
        <div className="stat"><span className="k">VOL REGIME</span><span className="v">{volRegime}</span></div>
        <div className="stat"><span className="k">NEWS SENTIMENT</span><span className={`v ${senti.avg > 0.08 ? 'up' : senti.avg < -0.08 ? 'down' : ''}`}>{senti.label}</span></div>
      </div>
      <div className="prose faint" style={{ marginTop: 10 }}>
        Generated from price history and headline analysis. Not investment advice.
      </div>
    </>
  );
}

/** BRIEF — auto-generated cross-asset market brief. */
export function BriefFn({ panel }: FnProps) {
  const ids = ['SPX Index', 'CCMP Index', 'VIX Index', 'USGG10YR Index', 'DXY Curncy', 'EURUSD Curncy', 'CL1 Comdty', 'GC1 Comdty', 'XBT Crypto'];
  const secs = ids.map((id) => getSecurity(id)).filter((x): x is Security => !!x);
  const quotes = useQuotes(secs);
  const { news } = useNews(null);

  const g = (id: string) => quotes.get(id);
  const spx = g('SPX Index');
  const ndx = g('CCMP Index');
  const vix = g('VIX Index');
  const y10 = g('USGG10YR Index');
  const dxy = g('DXY Curncy');
  const oil = g('CL1 Comdty');
  const gold = g('GC1 Comdty');
  const btc = g('XBT Crypto');

  const ready = spx && ndx && vix && y10 && dxy && oil && gold && btc;

  const brief = useMemo(() => {
    if (!ready) return null;
    const dir = (pct: number, strongAt = 1) =>
      pct > strongAt ? 'sharply higher' : pct > 0.15 ? 'higher' : pct > -0.15 ? 'little changed' : pct > -strongAt ? 'lower' : 'sharply lower';
    const eqTone = (spx!.chgPct + ndx!.chgPct) / 2;
    const lead = ndx!.chgPct > spx!.chgPct + 0.2 ? ', led by tech' : spx!.chgPct > ndx!.chgPct + 0.2 ? ', with cyclicals leading growth' : '';
    const vixNote = vix!.price > 22 ? `Volatility is bid — VIX at ${vix!.price.toFixed(1)} signals a defensive tape.` : vix!.price < 14 ? `The VIX at ${vix!.price.toFixed(1)} shows little demand for protection.` : `The VIX sits at ${vix!.price.toFixed(1)}, mid-range.`;
    const rateNote = `The 10-year Treasury yields ${y10!.price.toFixed(2)}% (${y10!.chg >= 0 ? '+' : ''}${(y10!.chg * 100).toFixed(0)}bp), and the dollar index is ${dir(dxy!.chgPct, 0.5)} at ${dxy!.price.toFixed(1)}.`;
    const cmdNote = `In commodities, WTI crude is ${dir(oil!.chgPct, 1.5)} at $${oil!.price.toFixed(2)} and gold ${gold!.chgPct >= 0 ? 'firmer' : 'softer'} at $${fmtPx(gold!.price)}.`;
    const cryptoNote = `Bitcoin trades at $${fmtPx(btc!.price)} (${fmtPct(btc!.chgPct)}).`;
    const senti = aggregateSentiment(news);
    const newsNote = news.length ? `Headline flow is ${senti.label.toLowerCase()}.` : '';
    return {
      opening: `Equities are ${dir(eqTone)}${lead} — the S&P 500 at ${fmtPx(spx!.price)} (${fmtPct(spx!.chgPct)}) and the Nasdaq at ${fmtPx(ndx!.price)} (${fmtPct(ndx!.chgPct)}).`,
      vixNote,
      rateNote,
      cmdNote,
      cryptoNote,
      newsNote,
    };
  }, [ready, spx?.price, ndx?.price, vix?.price, y10?.price, dxy?.price, oil?.price, gold?.price, btc?.price, news]);

  return (
    <>
      <ScreenTitle fn="BRIEF · Market Brief" sub={`generated ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} from live cross-asset data`} />
      {!brief ? (
        <div className="empty-hint">assembling brief…</div>
      ) : (
        <>
          <div className="prose" style={{ fontSize: 13, lineHeight: 1.75, maxWidth: '78ch' }}>
            {brief.opening} {brief.vixNote}
            <br /><br />
            {brief.rateNote} {brief.cmdNote} {brief.cryptoNote} {brief.newsNote}
          </div>
          <div className="menu-section">Tape</div>
          <table className="grid" style={{ maxWidth: 560 }}>
            <thead><tr><th>Ticker</th><th style={{ textAlign: 'left' }}>Name</th><th>Last</th><th>%Chg</th></tr></thead>
            <tbody>
              {secs.map((s) => {
                const q = quotes.get(s.id);
                return (
                  <tr key={s.id} className="rowlink" onClick={() => panel.execute(`${s.id} GP`)}>
                    <td className="ticker-cell">{s.ticker}</td>
                    <td className="name-cell">{s.name}</td>
                    <td>{fmtPx(q?.price)}</td>
                    <td className={upDown(q?.chg)}>{fmtPct(q?.chgPct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="prose faint" style={{ marginTop: 10 }}>
            Narrative generated from streaming data — refreshes with the tape. Not investment advice.
          </div>
        </>
      )}
    </>
  );
}

/** NSE — news search with sentiment tags. */
export function NseFn({ arg }: FnProps) {
  const [q, setQ] = useState(arg ?? '');
  const matched = useMemo(() => (q.trim() ? resolveSecurity(q) : null), [q]);
  const { news: topNews } = useNews(null);
  const { news: secNews } = useNews(matched);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pool = matched ? [...secNews, ...topNews] : topNews;
    const seen = new Set<string>();
    const uniq = pool.filter((n) => !seen.has(n.id) && seen.add(n.id));
    if (!t) return uniq;
    return uniq.filter(
      (n) =>
        n.headline.toLowerCase().includes(t) ||
        (matched && n.secIds?.includes(matched.id)) ||
        n.source.toLowerCase().includes(t),
    );
  }, [q, matched, topNews, secNews]);

  return (
    <>
      <ScreenTitle fn="NSE · News Search" sub="full-text over the live tape · tickers resolve to their story stream" />
      <div className="filter-bar">
        <label>QUERY</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} placeholder="ticker, keyword or source…" autoFocus />
        {matched && <span className="pill gold">MATCHED {matched.id}</span>}
      </div>
      {results.length === 0 ? (
        <div className="empty-hint">No stories match.</div>
      ) : (
        results.map((n: NewsItem) => {
          const s = scoreHeadline(n.headline).sentiment;
          return (
            <div className="news-row" key={n.id}>
              <span className="news-time">{ago(n.time)}</span>
              <span className={s === 'pos' ? 'up' : s === 'neg' ? 'down' : 'faint'} style={{ minWidth: 14 }}>
                {s === 'pos' ? '▲' : s === 'neg' ? '▼' : '•'}
              </span>
              <span className="news-src">{n.source}</span>
              {n.url ? (
                <a className="news-hl" href={n.url} target="_blank" rel="noreferrer">{n.headline}</a>
              ) : (
                <span className="news-hl">{n.headline}</span>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
