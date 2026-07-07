import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { MenuItem, Security } from './types';
import { resolveCommand } from './parser';
import { getSecurity } from '../data/universe';

export interface Frame {
  fn: string; // mnemonic
  secId: string | null;
  arg?: string;
}

export interface PanelState {
  frames: Frame[];
  pos: number;
  error: string | null;
}

export type Layout = 1 | 2 | 4;

interface TerminalCtx {
  panels: PanelState[];
  active: number;
  layout: Layout;
  lastCommands: string[];
  setActive: (i: number) => void;
  setLayout: (l: Layout) => void;
  execute: (panelIdx: number, input: string) => void;
  back: (panelIdx: number) => void;
  setMenu: (panelIdx: number, items: MenuItem[]) => void;
  clearError: (panelIdx: number) => void;
}

const Ctx = createContext<TerminalCtx | null>(null);

const HOME: Frame = { fn: 'MAIN', secId: null };

function initialPanels(): PanelState[] {
  return [0, 1, 2, 3].map((i) => ({
    frames: [
      i === 0
        ? HOME
        : i === 1
          ? { fn: 'WEI', secId: null }
          : i === 2
            ? { fn: 'TOP', secId: null }
            : { fn: 'GP', secId: 'SPX Index' },
    ],
    pos: 0,
    error: null,
  }));
}

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<PanelState[]>(initialPanels);
  const [active, setActive] = useState(0);
  const [layout, setLayout] = useState<Layout>(2);
  const [lastCommands, setLastCommands] = useState<string[]>([]);
  // Numbered-menu registrations, per panel, kept in a ref (no re-render needed).
  const menus = useRef<MenuItem[][]>([[], [], [], []]);

  const pushFrame = useCallback((panelIdx: number, frame: Frame) => {
    setPanels((ps) =>
      ps.map((p, i) => {
        if (i !== panelIdx) return p;
        const frames = p.frames.slice(0, p.pos + 1);
        frames.push(frame);
        return { frames, pos: frames.length - 1, error: null };
      }),
    );
  }, []);

  const setError = useCallback((panelIdx: number, error: string | null) => {
    setPanels((ps) => ps.map((p, i) => (i === panelIdx ? { ...p, error } : p)));
  }, []);

  const execute = useCallback(
    (panelIdx: number, input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      const r = resolveCommand(trimmed);

      if (r.kind === 'menu') {
        const items = menus.current[panelIdx];
        const item = items[r.index - 1];
        if (item) {
          execute(panelIdx, item.cmd);
        } else {
          setError(panelIdx, `No menu item ${r.index} on this screen`);
        }
        return;
      }

      setLastCommands((h) => [trimmed.toUpperCase(), ...h.filter((x) => x !== trimmed.toUpperCase())].slice(0, 40));

      setPanels((ps) => {
        const p = ps[panelIdx];
        const current = p.frames[p.pos];
        let frame: Frame | null = null;
        if (r.kind === 'fn') {
          frame = { fn: r.fn.mnemonic, secId: current?.secId ?? null, arg: r.arg };
        } else if (r.kind === 'sec-fn') {
          frame = { fn: r.fn.mnemonic, secId: r.sec.id, arg: r.arg };
        } else if (r.kind === 'sec') {
          frame = { fn: 'SMEN', secId: r.sec.id };
        }
        if (!frame) {
          return ps.map((pp, i) =>
            i === panelIdx ? { ...pp, error: `${trimmed.toUpperCase()} — not a valid command. Try HELP <GO>.` } : pp,
          );
        }
        return ps.map((pp, i) => {
          if (i !== panelIdx) return pp;
          const frames = pp.frames.slice(0, pp.pos + 1);
          frames.push(frame!);
          return { frames, pos: frames.length - 1, error: null };
        });
      });
    },
    [setError],
  );

  const back = useCallback((panelIdx: number) => {
    setPanels((ps) =>
      ps.map((p, i) => (i === panelIdx && p.pos > 0 ? { ...p, pos: p.pos - 1, error: null } : p)),
    );
  }, []);

  const setMenu = useCallback((panelIdx: number, items: MenuItem[]) => {
    menus.current[panelIdx] = items;
  }, []);

  const clearError = useCallback((panelIdx: number) => setError(panelIdx, null), [setError]);

  const value = useMemo<TerminalCtx>(
    () => ({ panels, active, layout, lastCommands, setActive, setLayout, execute, back, setMenu, clearError }),
    [panels, active, layout, lastCommands, execute, back, setMenu, clearError],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTerminal(): TerminalCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTerminal outside provider');
  return ctx;
}

export function frameSecurity(frame: Frame): Security | null {
  return frame.secId ? (getSecurity(frame.secId) ?? null) : null;
}
