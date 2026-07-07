import { useMemo, useState } from 'react';
import type { FnProps, Security } from '../core/types';
import { QuoteRow, ScreenTitle, Sparkline } from '../components/widgets';
import { useBars, useQuotes } from '../data/hooks';
import { fmtChg, fmtPct, fmtPx, upDown } from '../core/fmt';
import { UNIVERSE } from '../data/universe';

const byKind = (k: Security['kind']) => UNIVERSE.filter((s) => s.kind === k);

function MiniSpark({ sec }: { sec: Security }) {
  const { bars } = useBars(sec, '1D');
  return <Sparkline bars={bars} w={96} h={20} />;
}

/** Generic quote-board used by several dashboards. */
function QuoteBoard({
  title,
  sub,
  secs,
  panel,
  sparks = false,
  groupBy,
}: {
  title: string;
  sub: string;
  secs: Security[];
  panel: FnProps['panel'];
  sparks?: boolean;
  groupBy?: (s: Security) => string;
}) {
  const quotes = useQuotes(secs);
  const open = (s: Security) => panel.execute(`${s.id} DES`);
  const groups = useMemo(() => {
    if (!groupBy) return [['', secs]] as Array<[string, Security[]]>;
    const m = new Map<string, Security[]>();
    for (const s of secs) {
      const g = groupBy(s);
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(s);
    }
    return [...m.entries()];
  }, [secs, groupBy]);

  return (
    <>
      <ScreenTitle fn={title} sub={sub} />
      <table className="grid">
        <thead>
          <tr>
            <th>Ticker</th>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th>Last</th>
            <th>Chg</th>
            <th>%Chg</th>
            {sparks && <th style={{ textAlign: 'center' }}>Today</th>}
          </tr>
        </thead>
        <tbody>
          {groups.map(([g, list]) => (
            <FragmentRows key={g || 'all'} label={g} list={list} quotes={quotes} open={open} sparks={sparks} />
          ))}
        </tbody>
      </table>
    </>
  );
}

function FragmentRows({
  label,
  list,
  quotes,
  open,
  sparks,
}: {
  label: string;
  list: Security[];
  quotes: Map<string, import('../core/types').Quote>;
  open: (s: Security) => void;
  sparks: boolean;
}) {
  return (
    <>
      {label && (
        <tr>
          <td colSpan={sparks ? 6 : 5} className="menu-section" style={{ borderBottom: 'none', paddingTop: 10 }}>
            {label}
          </td>
        </tr>
      )}
      {list.map((s) => (
        <QuoteRow
          key={s.id}
          sec={s}
          q={quotes.get(s.id)}
          onOpen={open}
          extra={sparks ? <td style={{ padding: '1px 8px' }}><MiniSpark sec={s} /></td> : undefined}
        />
      ))}
    </>
  );
}

const REGION: Record<string, string> = {
  US: 'Americas', BR: 'Americas',
  GB: 'Europe', DE: 'Europe', FR: 'Europe', EU: 'Europe', CH: 'Europe',
  JP: 'Asia / Pacific', HK: 'Asia / Pacific', CN: 'Asia / Pacific', IN: 'Asia / Pacific', TW: 'Asia / Pacific',
};

/** WEI — world equity indices. */
export function WeiFn({ panel }: FnProps) {
  const secs = byKind('index').filter((s) => s.id !== 'VIX Index');
  return (
    <QuoteBoard
      title="WEI · World Equity Indices"
      sub="live global benchmark dashboard — click a row for DES"
      secs={secs}
      panel={panel}
      sparks
      groupBy={(s) => REGION[s.country ?? ''] ?? 'Other'}
    />
  );
}

/** WB — world bond markets (treasury yield complex + proxies). */
export function WbFn({ panel }: FnProps) {
  const secs = [...byKind('rate'), ...UNIVERSE.filter((s) => s.id === 'TLT US Equity' || s.id === 'VIX Index')];
  return (
    <QuoteBoard
      title="WB · Rates & Bond Markets"
      sub="US treasury yield complex, duration proxy and vol"
      secs={secs}
      panel={panel}
      sparks
    />
  );
}

/** WCR — world currencies. */
export function WcrFn({ panel }: FnProps) {
  return (
    <QuoteBoard
      title="WCR · World Currencies"
      sub="majors & EM vs USD — click for DES"
      secs={byKind('fx')}
      panel={panel}
      sparks
    />
  );
}

/** GLCO — global commodities. */
export function GlcoFn({ panel }: FnProps) {
  const groups: Record<string, string> = {
    'CL1 Comdty': 'Energy', 'CO1 Comdty': 'Energy', 'NG1 Comdty': 'Energy',
    'GC1 Comdty': 'Metals', 'SI1 Comdty': 'Metals', 'HG1 Comdty': 'Metals', 'PL1 Comdty': 'Metals',
  };
  return (
    <QuoteBoard
      title="GLCO · Global Commodities"
      sub="front-month futures across energy, metals and agriculture"
      secs={byKind('commodity')}
      panel={panel}
      sparks
      groupBy={(s) => groups[s.id] ?? 'Agriculture & Softs'}
    />
  );
}

/** CRYP — crypto board. */
export function CrypFn({ panel }: FnProps) {
  return (
    <QuoteBoard
      title="CRYP · Digital Assets"
      sub="major cryptocurrencies vs USD"
      secs={byKind('crypto')}
      panel={panel}
      sparks
    />
  );
}

/** FXC — FX cross matrix computed from USD legs. */
export function FxcFn({ panel }: FnProps) {
  const CCYS = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'] as const;
  const legs: Record<string, { sec: Security | undefined; invert: boolean }> = {
    EUR: { sec: UNIVERSE.find((s) => s.id === 'EURUSD Curncy'), invert: false },
    GBP: { sec: UNIVERSE.find((s) => s.id === 'GBPUSD Curncy'), invert: false },
    JPY: { sec: UNIVERSE.find((s) => s.id === 'USDJPY Curncy'), invert: true },
    CHF: { sec: UNIVERSE.find((s) => s.id === 'USDCHF Curncy'), invert: true },
    CAD: { sec: UNIVERSE.find((s) => s.id === 'USDCAD Curncy'), invert: true },
    AUD: { sec: UNIVERSE.find((s) => s.id === 'AUDUSD Curncy'), invert: false },
  };
  const secs = Object.values(legs).map((l) => l.sec).filter((x): x is Security => !!x);
  const quotes = useQuotes(secs);

  // usdPer[ccy] = USD value of 1 unit of ccy.
  const usdPer: Record<string, number | undefined> = { USD: 1 };
  for (const [ccy, leg] of Object.entries(legs)) {
    const q = leg.sec ? quotes.get(leg.sec.id) : undefined;
    usdPer[ccy] = q ? (leg.invert ? 1 / q.price : q.price) : undefined;
  }
  const cross = (base: string, quote: string): number | undefined => {
    const b = usdPer[base];
    const q = usdPer[quote];
    return b && q ? b / q : undefined;
  };

  return (
    <>
      <ScreenTitle fn="FXC · Cross-Rate Matrix" sub="rows = 1 unit of base currency, expressed in column currency" />
      <table className="grid">
        <thead>
          <tr>
            <th>BASE ↓</th>
            {CCYS.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {CCYS.map((base) => (
            <tr key={base}>
              <td className="ticker-cell" style={{ textAlign: 'left' }}>{base}</td>
              {CCYS.map((q) => (
                <td key={q} className={base === q ? 'faint' : ''}>
                  {base === q ? '—' : fmtPx(cross(base, q))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="menu-section">USD legs</div>
      <table className="grid">
        <thead><tr><th>Pair</th><th style={{ textAlign: 'left' }}>Name</th><th>Last</th><th>Chg</th><th>%Chg</th></tr></thead>
        <tbody>
          {secs.map((s) => (
            <QuoteRow key={s.id} sec={s} q={quotes.get(s.id)} onOpen={(x) => panel.execute(`${x.id} GP`)} />
          ))}
        </tbody>
      </table>
    </>
  );
}

/** MOST — biggest movers in the universe. */
export function MostFn({ panel }: FnProps) {
  const secs = UNIVERSE.filter((s) => s.kind === 'stock' || s.kind === 'etf');
  const quotes = useQuotes(secs);
  const ranked = useMemo(() => {
    return secs
      .map((s) => ({ s, q: quotes.get(s.id) }))
      .filter((x) => x.q)
      .sort((a, b) => Math.abs(b.q!.chgPct) - Math.abs(a.q!.chgPct));
  }, [secs, quotes]);
  const gainers = ranked.filter((x) => x.q!.chgPct >= 0).slice(0, 12);
  const losers = ranked.filter((x) => x.q!.chgPct < 0).slice(0, 12);
  const col = (list: typeof ranked, label: string) => (
    <div style={{ flex: '1 1 300px' }}>
      <div className="menu-section">{label}</div>
      <table className="grid">
        <thead><tr><th>Ticker</th><th style={{ textAlign: 'left' }}>Name</th><th>Last</th><th>%Chg</th></tr></thead>
        <tbody>
          {list.map(({ s, q }) => (
            <tr key={s.id} className="rowlink" onClick={() => panel.execute(`${s.id} DES`)}>
              <td className="ticker-cell" style={{ textAlign: 'left' }}>{s.ticker}</td>
              <td className="name-cell" style={{ textAlign: 'left' }}>{s.name}</td>
              <td>{fmtPx(q!.price)}</td>
              <td className={upDown(q!.chg)}>{fmtPct(q!.chgPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <>
      <ScreenTitle fn="MOST · Market Movers" sub="ranked by absolute % move across the equity universe" />
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {col(gainers, 'Leaders')}
        {col(losers, 'Laggards')}
      </div>
    </>
  );
}

/** EQS — equity screener. */
export function EqsFn({ panel }: FnProps) {
  const stocks = UNIVERSE.filter((s) => s.kind === 'stock');
  const quotes = useQuotes(stocks);
  const sectors = useMemo(() => ['All', ...new Set(stocks.map((s) => s.sector).filter(Boolean) as string[])], [stocks]);
  const [sector, setSector] = useState('All');
  const [dir, setDir] = useState<'all' | 'up' | 'down'>('all');
  const [minPx, setMinPx] = useState('');
  const [sortKey, setSortKey] = useState<'ticker' | 'px' | 'chg'>('chg');
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo(() => {
    let list = stocks
      .map((s) => ({ s, q: quotes.get(s.id) }))
      .filter((x) => x.q);
    if (sector !== 'All') list = list.filter((x) => x.s.sector === sector);
    if (dir === 'up') list = list.filter((x) => x.q!.chgPct >= 0);
    if (dir === 'down') list = list.filter((x) => x.q!.chgPct < 0);
    const mp = parseFloat(minPx);
    if (!isNaN(mp)) list = list.filter((x) => x.q!.price >= mp);
    list.sort((a, b) => {
      const va = sortKey === 'ticker' ? a.s.ticker : sortKey === 'px' ? a.q!.price : a.q!.chgPct;
      const vb = sortKey === 'ticker' ? b.s.ticker : sortKey === 'px' ? b.q!.price : b.q!.chgPct;
      const c = typeof va === 'string' ? (va as string).localeCompare(vb as string) : (va as number) - (vb as number);
      return sortAsc ? c : -c;
    });
    return list;
  }, [stocks, quotes, sector, dir, minPx, sortKey, sortAsc]);

  const sortBy = (k: typeof sortKey) => {
    if (k === sortKey) setSortAsc(!sortAsc);
    else {
      setSortKey(k);
      setSortAsc(k === 'ticker');
    }
  };

  return (
    <>
      <ScreenTitle fn="EQS · Equity Screener" sub={`${rows.length} matches — click headers to sort`} />
      <div className="filter-bar">
        <label>SECTOR</label>
        <select value={sector} onChange={(e) => setSector(e.target.value)}>
          {sectors.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label>DIRECTION</label>
        <select value={dir} onChange={(e) => setDir(e.target.value as typeof dir)}>
          <option value="all">All</option>
          <option value="up">Advancing</option>
          <option value="down">Declining</option>
        </select>
        <label>MIN PX</label>
        <input value={minPx} onChange={(e) => setMinPx(e.target.value)} style={{ width: 70 }} placeholder="0" />
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th className="sortable" onClick={() => sortBy('ticker')}>Ticker</th>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th style={{ textAlign: 'left' }}>Sector</th>
            <th className="sortable" onClick={() => sortBy('px')}>Last</th>
            <th>Chg</th>
            <th className="sortable" onClick={() => sortBy('chg')}>%Chg</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ s, q }) => (
            <tr key={s.id} className="rowlink" onClick={() => panel.execute(`${s.id} DES`)}>
              <td className="ticker-cell" style={{ textAlign: 'left' }}>{s.ticker}</td>
              <td className="name-cell" style={{ textAlign: 'left' }}>{s.name}</td>
              <td className="dim" style={{ textAlign: 'left' }}>{s.sector}</td>
              <td>{fmtPx(q!.price)}</td>
              <td className={upDown(q!.chg)}>{fmtChg(q!.chg)}</td>
              <td className={upDown(q!.chg)}>{fmtPct(q!.chgPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
