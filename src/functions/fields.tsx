import { useEffect, useState } from 'react';
import type { FnProps } from '../core/types';
import { QuoteHead, ScreenTitle } from '../components/widgets';
import { FIELDS, getField } from '../data/fields';
import { resolveSecurity } from '../core/parser';
import { resolveMarketSecurity } from '../data/dynamic';

/** FLDS — live field dictionary for the loaded security. */
export function FldsFn({ sec }: FnProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!sec) return;
    let dead = false;
    setValues({});
    const applicable = FIELDS.filter((f) => !f.stockOnly || sec.kind === 'stock');
    applicable.forEach((f) => {
      f.resolve(sec)
        .then((v) => !dead && setValues((m) => ({ ...m, [f.id]: v })))
        .catch(() => !dead && setValues((m) => ({ ...m, [f.id]: '—' })));
    });
    const iv = setInterval(() => {
      applicable
        .filter((f) => f.category === 'Price' || f.category === 'Session')
        .forEach((f) => f.resolve(sec).then((v) => !dead && setValues((m) => ({ ...m, [f.id]: v }))).catch(() => {}));
    }, 5000);
    return () => {
      dead = true;
      clearInterval(iv);
    };
  }, [sec?.id]);

  if (!sec)
    return (
      <div className="empty-hint">
        Load a security first — e.g. <span className="gold">AAPL FLDS</span> ⏎
      </div>
    );
  const cats = [...new Set(FIELDS.map((f) => f.category))];
  return (
    <>
      <QuoteHead sec={sec} />
      <div className="prose" style={{ marginBottom: 8 }}>
        Every field is a pull formula: <span className="gold">BDP {sec.ticker} PX_LAST</span> ⏎ fetches one
        value; Excel-style <span className="gold">BDP("{sec.id}","FIELD")</span> is the same contract.
      </div>
      {cats.map((cat) => (
        <div key={cat}>
          <div className="menu-section">{cat}</div>
          <table className="grid">
            <tbody>
              {FIELDS.filter((f) => f.category === cat && (!f.stockOnly || sec.kind === 'stock')).map((f) => (
                <tr key={f.id}>
                  <td className="ticker-cell" style={{ width: 170 }}>{f.id}</td>
                  <td style={{ textAlign: 'left', width: 170 }}>{f.name}</td>
                  <td style={{ textAlign: 'left' }} className="name-cell">{f.description}</td>
                  <td className="gold" style={{ width: 120 }}>{values[f.id] ?? '…'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

/** BDP — single-field data pull: BDP <ticker> <field>. */
export function BdpFn({ sec, arg, panel }: FnProps) {
  const [result, setResult] = useState<{ secId: string; field: string; value: string } | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let dead = false;
    setResult(null);
    setErr('');
    const run = async () => {
      if (!arg) return;
      const tokens = arg.trim().split(/\s+/);
      const fieldTok = tokens[tokens.length - 1];
      const field = getField(fieldTok);
      if (!field) {
        setErr(`Unknown field "${fieldTok.toUpperCase()}" — see FLDS for the dictionary.`);
        return;
      }
      const secText = tokens.slice(0, -1).join(' ');
      let target = secText ? resolveSecurity(secText) : sec;
      if (!target && secText) target = await resolveMarketSecurity(secText);
      if (!target) {
        setErr(`Can't resolve "${secText}".`);
        return;
      }
      try {
        const value = await field.resolve(target);
        if (!dead) setResult({ secId: target.id, field: field.id, value });
      } catch {
        if (!dead) setErr('Field resolution failed.');
      }
    };
    run();
    return () => {
      dead = true;
    };
  }, [arg, sec?.id]);

  return (
    <>
      <ScreenTitle fn="BDP · Data Point Pull" sub="usage: BDP <ticker> <field> — e.g. BDP TSLA VOLATILITY_30D" />
      {err && <div className="down" style={{ marginBottom: 10 }}>{err}</div>}
      {result ? (
        <div style={{ marginTop: 12 }}>
          <div className="faint" style={{ fontSize: 11, letterSpacing: '0.14em' }}>
            BDP("{result.secId}","{result.field}")
          </div>
          <div className="gold" style={{ fontSize: 42, fontWeight: 600, fontVariantNumeric: 'tabular-nums', margin: '6px 0' }}>
            {result.value}
          </div>
          <button className="btn" onClick={() => panel.execute(`${result.secId} FLDS`)}>ALL FIELDS ⏎</button>
        </div>
      ) : !err && !arg ? (
        <div className="prose">
          Pull any single field for any security in the market. Try{' '}
          <span className="gold">BDP AAPL PX_LAST</span>, <span className="gold">BDP NVDA RSI_14D</span>,{' '}
          <span className="gold">BDP EURUSD VOLATILITY_30D</span>. The field dictionary lives in{' '}
          <span className="linkish" onClick={() => panel.execute('FLDS')}>FLDS</span>.
        </div>
      ) : !err ? (
        <div className="empty-hint">resolving…</div>
      ) : null}
    </>
  );
}
