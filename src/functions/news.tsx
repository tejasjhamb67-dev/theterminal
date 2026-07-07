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
