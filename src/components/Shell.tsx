import { useEffect, useState } from 'react';
import { useTerminal } from '../core/context';
import { useDataMode } from '../data/hooks';
import { allFns, liveFnCount } from '../core/registry';
import { Panel } from './Panel';

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
