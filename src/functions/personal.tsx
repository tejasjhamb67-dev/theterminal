import { useEffect, useMemo, useState } from 'react';
import type { FnProps, Security } from '../core/types';
import { QuoteRow, ScreenTitle } from '../components/widgets';
import { useQuotes } from '../data/hooks';
import { resolveSecurity } from '../core/parser';
import { getSecurity } from '../data/universe';
import { storageGet, storageSet } from '../core/storage';

const WATCH_KEY = 'theterminal.watchlist';
const NOTE_KEY = 'theterminal.notes';

function loadWatch(): string[] {
  try {
    const raw = storageGet(WATCH_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return ['AAPL US Equity', 'NVDA US Equity', 'SPX Index', 'EURUSD Curncy', 'GC1 Comdty', 'XBT Crypto'];
}

/** W — personal watchlist monitor (persisted locally). */
export function WatchFn({ panel }: FnProps) {
  const [ids, setIds] = useState<string[]>(loadWatch);
  const [add, setAdd] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    storageSet(WATCH_KEY, JSON.stringify(ids));
  }, [ids]);

  const secs = useMemo(
    () => ids.map((id) => getSecurity(id)).filter((s): s is Security => !!s),
    [ids],
  );
  const quotes = useQuotes(secs);

  const submitAdd = () => {
    const sec = resolveSecurity(add);
    if (!sec) {
      setErr(`Can't resolve "${add}"`);
      return;
    }
    setErr('');
    setAdd('');
    setIds((xs) => (xs.includes(sec.id) ? xs : [...xs, sec.id]));
  };

  return (
    <>
      <ScreenTitle fn="W · Watchlist" sub="personal monitor — persisted on this machine" />
      <div className="filter-bar">
        <label>ADD</label>
        <input
          value={add}
          onChange={(e) => setAdd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
          placeholder="ticker…"
          style={{ width: 200 }}
        />
        <button className="btn" onClick={submitAdd}>ADD ⏎</button>
        {err && <span className="down">{err}</span>}
      </div>
      {secs.length === 0 ? (
        <div className="empty-hint">Watchlist is empty — add a ticker above.</div>
      ) : (
        <table className="grid">
          <thead>
            <tr><th>Ticker</th><th style={{ textAlign: 'left' }}>Name</th><th>Last</th><th>Chg</th><th>%Chg</th><th /></tr>
          </thead>
          <tbody>
            {secs.map((s) => (
              <QuoteRow
                key={s.id}
                sec={s}
                q={quotes.get(s.id)}
                onOpen={(x) => panel.execute(`${x.id} DES`)}
                extra={
                  <td>
                    <button
                      className="btn"
                      style={{ padding: '0 6px', fontSize: 10 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIds((xs) => xs.filter((id) => id !== s.id));
                      }}
                    >
                      ✕
                    </button>
                  </td>
                }
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/** NOTE — personal scratchpad (persisted locally). */
export function NoteFn(_: FnProps) {
  const [text, setText] = useState(() => storageGet(NOTE_KEY) ?? '');
  useEffect(() => {
    const t = setTimeout(() => storageSet(NOTE_KEY, text), 300);
    return () => clearTimeout(t);
  }, [text]);
  return (
    <>
      <ScreenTitle fn="NOTE · Notepad" sub="autosaved locally" />
      <textarea
        className="note-area"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Trade ideas, levels, reminders…"
        spellCheck={false}
      />
    </>
  );
}
