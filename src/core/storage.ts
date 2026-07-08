/**
 * Safe storage: localStorage when available, in-memory fallback otherwise
 * (sandboxed iframes and some hosted contexts deny storage access).
 */

const mem = new Map<string, string>();

function available(): boolean {
  try {
    const k = '__tt_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const hasLocal = typeof window !== 'undefined' && available();

export function storageGet(key: string): string | null {
  try {
    if (hasLocal) return window.localStorage.getItem(key);
  } catch { /* fall through */ }
  return mem.get(key) ?? null;
}

export function storageSet(key: string, value: string): void {
  try {
    if (hasLocal) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch { /* fall through */ }
  mem.set(key, value);
}
