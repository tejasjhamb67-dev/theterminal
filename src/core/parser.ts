import type { FunctionDef, Security } from './types';
import { getFn } from './registry';
import { getByTicker, getSecurity, searchSecurities } from '../data/universe';

export type Resolved =
  | { kind: 'fn'; fn: FunctionDef; arg?: string }
  | { kind: 'sec-fn'; sec: Security; fn: FunctionDef; arg?: string }
  | { kind: 'sec'; sec: Security }
  | { kind: 'menu'; index: number }
  | { kind: 'unknown'; input: string };

const YELLOW_KEYS = new Set([
  'EQUITY', 'INDEX', 'CURNCY', 'CRNCY', 'COMDTY', 'CMDTY', 'GOVT', 'CORP', 'CRYPTO',
]);

/**
 * Resolve a security expression like "AAPL", "AAPL US Equity", "aapl equity",
 * "EURUSD Curncy" or a fuzzy name like "apple".
 */
export function resolveSecurity(text: string): Security | null {
  const raw = text.trim();
  if (!raw) return null;
  const exact = getSecurity(raw);
  if (exact) return exact;

  // Strip a trailing yellow key if present.
  const tokens = raw.toUpperCase().split(/\s+/);
  let core = tokens;
  if (tokens.length > 1 && YELLOW_KEYS.has(tokens[tokens.length - 1])) {
    core = tokens.slice(0, -1);
  }
  // "AAPL US" → ticker AAPL (country codes are part of the canonical id).
  const withCountry = getByTicker(core.join(' '));
  if (withCountry) return withCountry;
  const first = getByTicker(core[0]);
  if (first && core.length <= 2) return first;

  const fuzzy = searchSecurities(raw, 1);
  return fuzzy[0] ?? null;
}

/** Full command resolution implementing SECURITY? FUNCTION? ARG? grammar. */
export function resolveCommand(input: string): Resolved {
  const raw = input.trim().replace(/\s+/g, ' ');
  if (!raw) return { kind: 'unknown', input };

  // Bare number → numbered-menu selection on the active screen.
  if (/^\d{1,3}$/.test(raw)) return { kind: 'menu', index: parseInt(raw, 10) };

  const tokens = raw.split(' ');

  // 1) Whole input is a function.
  const whole = getFn(raw);
  if (whole) return { kind: 'fn', fn: whole };

  // 2) First token is a function → rest is an argument (e.g. "HELP GP", "NI TECH").
  const firstFn = getFn(tokens[0]);
  if (firstFn && tokens.length > 1) {
    return { kind: 'fn', fn: firstFn, arg: tokens.slice(1).join(' ') };
  }

  // 3) Last token is a function → prefix is a security ("AAPL US Equity GP").
  const lastFn = getFn(tokens[tokens.length - 1]);
  if (lastFn && tokens.length > 1) {
    const sec = resolveSecurity(tokens.slice(0, -1).join(' '));
    if (sec) return { kind: 'sec-fn', sec, fn: lastFn, arg: undefined };
  }

  // 4) Whole input resolves to a security → open its menu.
  const sec = resolveSecurity(raw);
  if (sec) return { kind: 'sec', sec };

  return { kind: 'unknown', input: raw };
}
