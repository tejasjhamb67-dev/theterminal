import type { FnProps } from '../core/types';
import { ScreenTitle } from '../components/widgets';
import { useDataMode, useNews } from '../data/hooks';
import { ago } from '../core/fmt';
import { aggregateSentiment, scoreHeadline } from '../core/sentiment';

function NewsList({ sec, title, sub }: { sec: FnProps['sec']; title: string; sub: string }) {
  const { news, loading } = useNews(sec);
  const mode = useDataMode();
  const senti = aggregateSentiment(news);
  return (
    <>
      <ScreenTitle
        fn={title}
        sub={`${sub} · tape reads ${senti.label.toLowerCase()}${mode === 'sim' ? ' · simulated wire' : ''}`}
      />
      {loading ? (
        <div className="empty-hint">loading headlines…</div>
      ) : (
        <div>
          {news.map((n) => {
            const aged = Date.now() - n.time > 6 * 3600_000;
            const s = scoreHeadline(n.headline).sentiment;
            const inner = (
              <div className="news-row" key={n.id}>
                <span className="news-time">{ago(n.time)}</span>
                <span className={s === 'pos' ? 'up' : s === 'neg' ? 'down' : 'faint'} style={{ minWidth: 14 }}>
                  {s === 'pos' ? '▲' : s === 'neg' ? '▼' : '•'}
                </span>
                <span className="news-src">{n.source}</span>
                <span className={'news-hl' + (aged ? ' aged' : '')}>{n.headline}</span>
              </div>
            );
            return n.url ? (
              <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="news-hl" style={{ display: 'block' }}>
                {inner}
              </a>
            ) : (
              inner
            );
          })}
        </div>
      )}
    </>
  );
}

/** TOP — top headlines. */
export function TopFn(_: FnProps) {
  return <NewsList sec={null} title="TOP · Top News" sub="global market headlines, newest first" />;
}

/** NI — topic-coded news: NI FED, NI TECH, NI CRYPTO… */
export const NI_CODES: Record<string, { name: string; words: string[] }> = {
  FED: { name: 'Federal Reserve', words: ['fed', 'fomc', 'powell', 'rate', 'policy'] },
  CEN: { name: 'Central Banks', words: ['fed', 'ecb', 'boj', 'boe', 'central bank', 'rate'] },
  ECO: { name: 'Economy', words: ['gdp', 'inflation', 'cpi', 'jobs', 'payroll', 'economy', 'labor'] },
  BON: { name: 'Bonds & Rates', words: ['bond', 'treasur', 'yield', 'duration', 'credit'] },
  CRE: { name: 'Credit', words: ['credit', 'spread', 'default', 'high yield', 'downgrade', 'upgrade'] },
  FRX: { name: 'FX', words: ['dollar', 'euro', 'yen', 'currency', 'fx'] },
  TECH: { name: 'Technology', words: ['tech', 'chip', 'semiconductor', 'software', 'ai', 'cloud'] },
  ENE: { name: 'Energy', words: ['oil', 'crude', 'gas', 'opec', 'energy', 'brent'] },
  MET: { name: 'Metals', words: ['gold', 'silver', 'copper', 'metal'] },
  AGR: { name: 'Agriculture', words: ['corn', 'wheat', 'soy', 'crop', 'grain', 'coffee', 'sugar'] },
  CRYPTO: { name: 'Digital Assets', words: ['bitcoin', 'crypto', 'ethereum', 'etf demand', 'token'] },
  MNA: { name: 'M&A', words: ['merger', 'acquisition', 'takeover', 'deal', 'strategic options', 'm&a'] },
  IPO: { name: 'New Issues', words: ['ipo', 'listing', 'offering', 'debut'] },
  EQT: { name: 'Equities', words: ['stock', 'shares', 'equit', 'earnings', 's&p', 'nasdaq'] },
  ERN: { name: 'Earnings', words: ['earnings', 'guidance', 'profit', 'beat', 'miss', 'estimates'] },
  VOL: { name: 'Volatility', words: ['volatility', 'vix', 'options', 'swings', 'hedg'] },
  FLOW: { name: 'Fund Flows', words: ['flows', 'inflow', 'outflow', 'etf', 'rotation'] },
  EM: { name: 'Emerging Markets', words: ['emerging', 'em ', 'india', 'brazil', 'china'] },
  CHINA: { name: 'China', words: ['china', 'beijing', 'yuan', 'shanghai'] },
  INDIA: { name: 'India', words: ['india', 'rupee', 'nifty', 'mumbai', 'sensex'] },
  JAPAN: { name: 'Japan', words: ['japan', 'yen', 'boj', 'nikkei', 'tokyo'] },
  EU: { name: 'Europe', words: ['europe', 'ecb', 'euro', 'german', 'france'] },
  TRADE: { name: 'Trade & Tariffs', words: ['tariff', 'trade', 'export', 'import', 'supply chain'] },
  ESG: { name: 'ESG & Climate', words: ['climate', 'carbon', 'esg', 'renewable', 'grid'] },
  REGS: { name: 'Regulation', words: ['regulat', 'sec ', 'antitrust', 'probe', 'lawsuit'] },
};

export function NiFn({ arg, panel }: FnProps) {
  const { news } = useNews(null);
  const code = (arg ?? '').trim().toUpperCase();
  const topic = NI_CODES[code];
  if (!topic) {
    return (
      <>
        <ScreenTitle fn="NI · Topic News" sub="usage: NI <code> — the news taxonomy" />
        <table className="grid" style={{ maxWidth: 560 }}>
          <thead><tr><th style={{ textAlign: 'left' }}>Code</th><th style={{ textAlign: 'left' }}>Topic</th></tr></thead>
          <tbody>
            {Object.entries(NI_CODES).map(([c, t]) => (
              <tr key={c} className="rowlink" onClick={() => panel.execute(`NI ${c}`)}>
                <td className="ticker-cell">NI {c}</td>
                <td style={{ textAlign: 'left' }}>{t.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }
  const matches = news.filter((n) => {
    const h = n.headline.toLowerCase();
    return topic.words.some((w) => h.includes(w));
  });
  return (
    <>
      <ScreenTitle fn={`NI ${code} · ${topic.name}`} sub={`${matches.length} stories on the tape`} />
      {matches.length === 0 ? (
        <div className="empty-hint">Nothing tagged {code} on the current tape — try TOP for everything.</div>
      ) : (
        matches.map((n) => {
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

/** CN — company/security news. */
export function CnFn({ sec }: FnProps) {
  if (!sec)
    return (
      <div className="empty-hint">
        Load a security first — e.g. <span className="gold">AAPL CN</span> ⏎
      </div>
    );
  return <NewsList sec={sec} title={`CN · News · ${sec.ticker}`} sub={sec.name} />;
}
