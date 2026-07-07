import type { ComponentType } from 'react';

/** Bloomberg-style yellow-key market sector. */
export type YellowKey =
  | 'Equity'
  | 'Index'
  | 'Curncy'
  | 'Comdty'
  | 'Govt'
  | 'Corp'
  | 'Crypto';

export type SecurityKind =
  | 'stock'
  | 'etf'
  | 'index'
  | 'fx'
  | 'commodity'
  | 'rate'
  | 'crypto';

export interface Security {
  /** Canonical id, e.g. "AAPL US Equity" */
  id: string;
  ticker: string;
  yellowKey: YellowKey;
  kind: SecurityKind;
  name: string;
  /** Symbol used by the Yahoo Finance connector. */
  yahoo: string;
  currency: string;
  country?: string;
  sector?: string;
  description?: string;
  /** Approximate base price used to seed the simulated market. */
  simBase: number;
  /** Annualized volatility used by the simulator (e.g. 0.25). */
  simVol: number;
}

export interface Quote {
  secId: string;
  price: number;
  chg: number;
  chgPct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume?: number;
  time: number; // epoch ms
  source: 'live' | 'sim';
}

export interface Bar {
  time: number; // epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type ChartRange = '1D' | '5D' | '1M' | '6M' | '1Y' | '5Y';

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: number; // epoch ms
  url?: string;
  secIds?: string[];
  topic?: string;
}

/** API given to function screens so they can drive their panel. */
export interface PanelApi {
  execute: (command: string) => void;
  setMenu: (items: MenuItem[]) => void;
}

export interface MenuItem {
  label: string;
  cmd: string;
  detail?: string;
}

export interface FnProps {
  sec: Security | null;
  arg?: string;
  panel: PanelApi;
}

export type FnCategory =
  | 'System'
  | 'Markets'
  | 'Equities'
  | 'Fixed Income'
  | 'FX'
  | 'Commodities'
  | 'Crypto'
  | 'Economics'
  | 'News'
  | 'Charting'
  | 'Portfolio'
  | 'Derivatives'
  | 'Communication'
  | 'Trading';

export interface FunctionDef {
  mnemonic: string;
  name: string;
  category: FnCategory;
  description: string;
  /** Function needs a loaded security to be meaningful. */
  requiresSecurity?: boolean;
  /** Registered from the spec but not yet implemented. */
  stub?: boolean;
  aliases?: string[];
  component: ComponentType<FnProps>;
}
