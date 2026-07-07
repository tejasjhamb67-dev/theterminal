import type { FunctionDef } from './types';

const registry = new Map<string, FunctionDef>();
const aliasMap = new Map<string, string>();

export function registerFn(def: FunctionDef): void {
  registry.set(def.mnemonic.toUpperCase(), def);
  for (const a of def.aliases ?? []) aliasMap.set(a.toUpperCase(), def.mnemonic.toUpperCase());
}

export function getFn(mnemonic: string): FunctionDef | undefined {
  const key = mnemonic.toUpperCase();
  return registry.get(key) ?? registry.get(aliasMap.get(key) ?? '');
}

export function allFns(): FunctionDef[] {
  return [...registry.values()].sort((a, b) => a.mnemonic.localeCompare(b.mnemonic));
}

export function liveFnCount(): number {
  return allFns().filter((f) => !f.stub).length;
}

export function searchFns(q: string, limit = 8): FunctionDef[] {
  const t = q.trim().toUpperCase();
  if (!t) return [];
  const scored: Array<[number, FunctionDef]> = [];
  for (const f of registry.values()) {
    let score = -1;
    if (f.mnemonic === t) score = 100;
    else if (f.mnemonic.startsWith(t)) score = 80 - f.mnemonic.length;
    else if (f.name.toUpperCase().startsWith(t)) score = 60;
    else if (f.name.toUpperCase().includes(t)) score = 40;
    else if (f.description.toUpperCase().includes(t)) score = 20;
    if (score >= 0) scored.push([score + (f.stub ? -15 : 0), f]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, limit).map(([, f]) => f);
}
