import { useMemo, useState } from 'react';
import type { FnProps, MenuItem } from '../core/types';
import { MenuList, QuoteHead, ScreenTitle } from '../components/widgets';
import { allFns, getFn, searchFns } from '../core/registry';
import { useTerminal } from '../core/context';
import { UNIVERSE, searchSecurities } from '../data/universe';

/** MAIN — home menu. */
export function MainFn({ panel }: FnProps) {
  const items: MenuItem[] = [
    { label: 'WEI', cmd: 'WEI', detail: 'World equity indices — global market dashboard' },
    { label: 'TOP', cmd: 'TOP', detail: 'Top news headlines' },
    { label: 'MOST', cmd: 'MOST', detail: 'Biggest movers in the coverage universe' },
    { label: 'GLCO', cmd: 'GLCO', detail: 'Global commodities dashboard' },
    { label: 'WCR', cmd: 'WCR', detail: 'World currencies vs the dollar' },
    { label: 'FXC', cmd: 'FXC', detail: 'FX cross-rate matrix' },
    { label: 'CRYP', cmd: 'CRYP', detail: 'Cryptocurrency market board' },
    { label: 'WB', cmd: 'WB', detail: 'World bond markets — treasury yields' },
    { label: 'ECO', cmd: 'ECO', detail: 'Economic release calendar' },
    { label: 'EQS', cmd: 'EQS', detail: 'Equity screener' },
    { label: 'W', cmd: 'W', detail: 'Personal watchlist monitor' },
    { label: 'HELP', cmd: 'HELP', detail: 'Function directory & documentation' },
  ];
  return (
    <>
      <ScreenTitle fn="Home" sub="type a ticker, a function, or a menu number — then hit ⏎" />
      <div className="prose" style={{ marginBottom: 10 }}>
        Load a security by typing its ticker (<span className="gold">AAPL</span>,{' '}
        <span className="gold">EURUSD Curncy</span>, <span className="gold">GC1 Comdty</span>) or chain it
        with a function: <span className="gold">TSLA GP</span> charts Tesla,{' '}
        <span className="gold">NVDA DES</span> describes NVIDIA. The loaded security sticks to the panel.
      </div>
      <div className="menu-section">Market overview</div>
      <MenuList items={items} panel={panel} />
    </>
  );
}

/** HELP — function directory, or HELP <FN> for a single function. */
export function HelpFn({ panel, arg }: FnProps) {
  const [q, setQ] = useState('');
  const target = arg ? getFn(arg) : undefined;
  const fns = useMemo(() => (q ? searchFns(q, 50) : allFns()), [q]);

  if (target) {
    return (
      <>
        <ScreenTitle fn={`Help · ${target.mnemonic}`} sub={target.name} />
        <div className="stat-grid">
          <div className="stat"><span className="k">MNEMONIC</span><span className="v gold">{target.mnemonic}</span></div>
          <div className="stat"><span className="k">CATEGORY</span><span className="v">{target.category}</span></div>
          <div className="stat"><span className="k">STATUS</span><span className="v">{target.stub ? 'ROADMAP' : 'LIVE'}</span></div>
          <div className="stat"><span className="k">NEEDS SECURITY</span><span className="v">{target.requiresSecurity ? 'YES' : 'NO'}</span></div>
        </div>
        <div className="prose">{target.description}</div>
        <div style={{ marginTop: 14 }}>
          <button className="btn" onClick={() => panel.execute(target.mnemonic)}>
            RUN {target.mnemonic} ⏎
          </button>
        </div>
      </>
    );
  }

  const live = fns.filter((f) => !f.stub);
  const stubs = fns.filter((f) => f.stub);
  return (
    <>
      <ScreenTitle fn="Help" sub={`${live.length} live functions · ${stubs.length} on the roadmap`} />
      <div className="filter-bar">
        <label>SEARCH</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="mnemonic, name or keyword…" style={{ width: 260 }} />
      </div>
      <table className="grid">
        <thead>
          <tr><th>Mnemonic</th><th style={{ textAlign: 'left' }}>Name</th><th style={{ textAlign: 'left' }}>Category</th><th style={{ textAlign: 'left' }}>Description</th><th>Status</th></tr>
        </thead>
        <tbody>
          {[...live, ...stubs].map((f) => (
            <tr key={f.mnemonic} className="rowlink" onClick={() => panel.execute(f.stub ? `HELP ${f.mnemonic}` : f.mnemonic)}>
              <td className="ticker-cell" style={{ textAlign: 'left' }}>{f.mnemonic}</td>
              <td style={{ textAlign: 'left' }}>{f.name}</td>
              <td style={{ textAlign: 'left' }} className="dim">{f.category}</td>
              <td style={{ textAlign: 'left' }} className="name-cell" >{f.description}</td>
              <td>{f.stub ? <span className="pill">SOON</span> : <span className="pill gold">LIVE</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/** SMEN — security menu (shown when a bare security is loaded). */
export function SecMenuFn({ sec, panel }: FnProps) {
  if (!sec) return <div className="empty-hint">Load a security first — e.g. AAPL ⏎</div>;
  const items: MenuItem[] = [
    { label: 'DES', cmd: 'DES', detail: 'Security description & key statistics' },
    { label: 'GP', cmd: 'GP', detail: 'Price chart — candles, ranges, volume' },
    { label: 'GIP', cmd: 'GIP', detail: 'Intraday chart' },
    { label: 'HP', cmd: 'HP', detail: 'Historical price table' },
    { label: 'BQ', cmd: 'BQ', detail: 'Quote board & session detail' },
    { label: 'CN', cmd: 'CN', detail: 'News on this security' },
    { label: 'RV', cmd: 'MOST', detail: 'Movers in the wider universe' },
  ];
  return (
    <>
      <QuoteHead sec={sec} />
      {sec.description && <div className="prose" style={{ marginBottom: 8 }}>{sec.description}</div>}
      <div className="menu-section">Functions for {sec.ticker}</div>
      <MenuList items={items} panel={panel} />
    </>
  );
}

/** SECF — security finder. */
export function SecfFn({ panel }: FnProps) {
  const [q, setQ] = useState('');
  const list = q ? searchSecurities(q, 40) : UNIVERSE;
  return (
    <>
      <ScreenTitle fn="SECF · Security Finder" sub={`${list.length} of ${UNIVERSE.length} instruments in the coverage universe`} />
      <div className="filter-bar">
        <label>FIND</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ticker or name…" style={{ width: 260 }} autoFocus />
      </div>
      <table className="grid">
        <thead><tr><th>Security</th><th style={{ textAlign: 'left' }}>Name</th><th style={{ textAlign: 'left' }}>Kind</th><th style={{ textAlign: 'left' }}>Sector / Country</th><th>CCY</th></tr></thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id} className="rowlink" onClick={() => panel.execute(`${s.id} DES`)}>
              <td className="ticker-cell" style={{ textAlign: 'left' }}>{s.id}</td>
              <td style={{ textAlign: 'left' }}>{s.name}</td>
              <td style={{ textAlign: 'left' }} className="dim">{s.kind}</td>
              <td style={{ textAlign: 'left' }} className="dim">{[s.sector, s.country].filter(Boolean).join(' · ') || '—'}</td>
              <td>{s.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/** LAST — command history. */
export function LastFn({ panel }: FnProps) {
  const { lastCommands } = useTerminal();
  return (
    <>
      <ScreenTitle fn="LAST · Recent Commands" sub="click to re-run" />
      {lastCommands.length === 0 ? (
        <div className="empty-hint">No commands yet this session.</div>
      ) : (
        <MenuList
          items={lastCommands.slice(0, 20).map((c) => ({ label: c, cmd: c }))}
          panel={panel}
        />
      )}
    </>
  );
}
