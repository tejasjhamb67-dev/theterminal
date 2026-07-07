import { useEffect, useState } from 'react';
import { useTerminal } from '../core/context';
import { useDataMode } from '../data/hooks';
import { allFns, liveFnCount } from '../core/registry';
import { Panel } from './Panel';
import { onAlertToast, startAlertLoop, type PriceAlert } from '../core/alerts';
import { fmtPx } from '../core/fmt';

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const utc = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const local = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return (
    <span className="clock">
      {utc} UTC <span className="faint">· {local} LOCAL</span>
    </span>
  );
}

function AlertToasts() {
  const [toasts, setToasts] = useState<PriceAlert[]>([]);
  useEffect(() => {
    startAlertLoop();
    return onAlertToast((a) => {
      setToasts((ts) => [...ts, a]);
      setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== a.id)), 9000);
    });
  }, []);
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', right: 14, bottom: 40, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--accent-dim)',
            borderRadius: 6,
            padding: '10px 14px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            minWidth: 260,
          }}
        >
          <div className="gold" style={{ fontSize: 10, letterSpacing: '0.16em', marginBottom: 3 }}>⚑ PRICE ALERT</div>
          <div style={{ fontSize: 12.5 }}>
            {t.secId} traded {t.op} {fmtPx(t.level)} — last {fmtPx(t.triggeredPx)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Shell() {
  const { layout, setLayout, active, setActive } = useTerminal();
  const mode = useDataMode();

  // Ctrl+1..4 → switch panel focus; Ctrl+\ cycles layout.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        setActive(parseInt(e.key, 10) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setActive]);

  const visible = layout === 1 ? [active] : layout === 2 ? [0, 1] : [0, 1, 2, 3];

  return (
    <div className="app">
      <div className="topbar">
        <span className="brand">
          THE TERMINAL<small>MARKET WORKSTATION</small>
        </span>
        <div className="topbar-right">
          <span className={`mode-badge ${mode}`}>
            {mode === 'live' ? '● LIVE DATA' : mode === 'sim' ? '◐ SIMULATED DATA' : '… CONNECTING'}
          </span>
          <div className="layout-switch">
            {[1, 2, 4].map((l) => (
              <button key={l} className={layout === l ? 'on' : ''} onClick={() => setLayout(l as 1 | 2 | 4)}>
                {l}
              </button>
            ))}
          </div>
          <Clock />
        </div>
      </div>
      <div className={`panel-grid l${layout}`}>
        {visible.map((i) => (
          <Panel key={i} idx={i} />
        ))}
      </div>
      <AlertToasts />
      <div className="statusbar">
        <span className="sb-item">
          PANEL <b>{active + 1}</b>
        </span>
        <span className="sb-item">
          FUNCTIONS <b>{liveFnCount()}</b> LIVE · <b>{allFns().length}</b> REGISTERED · TARGET <b>44,000</b>
        </span>
        <span className="sb-item faint">TYPE HELP ⏎ FOR THE DIRECTORY · CTRL+1..4 SWITCHES PANELS</span>
        <div className="sb-right">
          <span className="sb-item">
            DATA <b>{mode.toUpperCase()}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
