/** Adaptive price formatting: more decimals for small prices, fewer for big. */
export function fmtPx(v: number | undefined | null): string {
  if (v === undefined || v === null || !isFinite(v)) return '—';
  const a = Math.abs(v);
  const dp = a >= 10000 ? 0 : a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4;
  return v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function fmtPct(v: number | undefined | null, sign = true): string {
  if (v === undefined || v === null || !isFinite(v)) return '—';
  const s = sign && v > 0 ? '+' : '';
  return `${s}${v.toFixed(2)}%`;
}

export function fmtChg(v: number | undefined | null): string {
  if (v === undefined || v === null || !isFinite(v)) return '—';
  const s = v > 0 ? '+' : '';
  return s + fmtPx(v);
}

/** 1.23M / 45.6K style volume formatting. */
export function fmtBig(v: number | undefined | null): string {
  if (v === undefined || v === null || !isFinite(v) || v === 0) return '—';
  const a = Math.abs(v);
  if (a >= 1e12) return (v / 1e12).toFixed(2) + 'T';
  if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return String(Math.round(v));
}

export function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(ms: number): string {
  return `${fmtDate(ms)} ${fmtTime(ms)}`;
}

export function ago(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000) return `${Math.max(1, Math.floor(d / 1000))}s`;
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

export const upDown = (v: number | undefined | null): string =>
  v === undefined || v === null || v === 0 ? '' : v > 0 ? 'up' : 'down';
