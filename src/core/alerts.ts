import type { Quote, Security } from './types';
import { getSecurity } from '../data/universe';
import { getQuote } from '../data/service';
import { storageGet, storageSet } from './storage';

/** Price-alert engine: localStorage persistence, background polling, toasts. */

export interface PriceAlert {
  id: string;
  secId: string;
  op: 'above' | 'below';
  level: number;
  note?: string;
  state: 'armed' | 'triggered';
  createdAt: number;
  triggeredAt?: number;
  triggeredPx?: number;
}

const KEY = 'theterminal.alerts';

let alerts: PriceAlert[] = load();
const listeners = new Set<() => void>();
const toastListeners = new Set<(a: PriceAlert) => void>();

function load(): PriceAlert[] {
  try {
    const raw = storageGet(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function save() {
  storageSet(KEY, JSON.stringify(alerts));
  listeners.forEach((cb) => cb());
}

export function getAlerts(): PriceAlert[] {
  return alerts;
}

export function onAlertsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function onAlertToast(cb: (a: PriceAlert) => void): () => void {
  toastListeners.add(cb);
  return () => toastListeners.delete(cb);
}

export function addAlert(sec: Security, op: PriceAlert['op'], level: number, note?: string): void {
  alerts = [
    ...alerts,
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      secId: sec.id,
      op,
      level,
      note,
      state: 'armed',
      createdAt: Date.now(),
    },
  ];
  save();
}

export function removeAlert(id: string): void {
  alerts = alerts.filter((a) => a.id !== id);
  save();
}

export function rearmAlert(id: string): void {
  alerts = alerts.map((a) => (a.id === id ? { ...a, state: 'armed', triggeredAt: undefined, triggeredPx: undefined } : a));
  save();
}

function crossed(a: PriceAlert, q: Quote): boolean {
  return a.op === 'above' ? q.price >= a.level : q.price <= a.level;
}

let loopStarted = false;

/** Started once by the Shell; checks armed alerts against streaming quotes. */
export function startAlertLoop(): void {
  if (loopStarted) return;
  loopStarted = true;
  const tick = async () => {
    const armed = alerts.filter((a) => a.state === 'armed');
    for (const a of armed) {
      const sec = getSecurity(a.secId);
      if (!sec) continue;
      try {
        const q = await getQuote(sec);
        if (crossed(a, q)) {
          alerts = alerts.map((x) =>
            x.id === a.id ? { ...x, state: 'triggered' as const, triggeredAt: Date.now(), triggeredPx: q.price } : x,
          );
          save();
          const fired = alerts.find((x) => x.id === a.id);
          if (fired) toastListeners.forEach((cb) => cb(fired));
        }
      } catch { /* connector hiccup — retry next tick */ }
    }
  };
  setInterval(tick, 5000);
  tick();
}
