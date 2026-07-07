import { useMemo } from 'react';
import { frameSecurity, useTerminal } from '../core/context';
import { getFn } from '../core/registry';
import type { MenuItem, PanelApi } from '../core/types';
import { CommandLine } from './CommandLine';

export function Panel({ idx }: { idx: number }) {
  const { panels, active, setActive, execute, back, setMenu, clearError } = useTerminal();
  const state = panels[idx];
  const frame = state.frames[state.pos];
  const def = getFn(frame.fn);
  const sec = frameSecurity(frame);

  const api = useMemo<PanelApi>(
    () => ({
      execute: (cmd: string) => execute(idx, cmd),
      setMenu: (items: MenuItem[]) => setMenu(idx, items),
    }),
    [execute, setMenu, idx],
  );

  const Comp = def?.component;

  return (
    <div className={'panel' + (active === idx ? ' active' : '')} onMouseDown={() => setActive(idx)}>
      <div className="panel-head">
        <span className="panel-num">{idx + 1}</span>
        <CommandLine panelIdx={idx} focused={active === idx} onFocus={() => setActive(idx)} onSubmit={(cmd) => execute(idx, cmd)} />
      </div>
      {state.error && (
        <div className="panel-error" onClick={() => clearError(idx)}>
          ✕ {state.error}
        </div>
      )}
      <div className="breadcrumb">
        {state.pos > 0 && <button onClick={() => back(idx)}>‹ MENU</button>}
        <span className="bc-fn">{def?.mnemonic ?? frame.fn}</span>
        <span>·</span>
        <span>{def?.name}</span>
        {sec && (
          <>
            <span>·</span>
            <span className="bc-sec">{sec.id}</span>
          </>
        )}
      </div>
      <div className="panel-body">
        {Comp ? (
          <Comp sec={sec} arg={frame.arg} panel={api} />
        ) : (
          <div className="empty-hint">Unknown function {frame.fn}</div>
        )}
      </div>
    </div>
  );
}
