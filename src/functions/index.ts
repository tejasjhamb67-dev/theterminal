import { registerFn } from '../core/registry';
import { HelpFn, LastFn, MainFn, SecMenuFn, SecfFn } from './system';
import { BqFn, DesFn, GipFn, GpFn, HpFn } from './security';
import { CrypFn, EqsFn, FxcFn, GlcoFn, MostFn, WbFn, WcrFn, WeiFn } from './markets';
import { CnFn, TopFn } from './news';
import { EcoFn } from './eco';
import { NoteFn, WatchFn } from './personal';
import { buildStubDefs } from './stubs';

export function registerAll(): void {
  // ── System / navigation ──────────────────────────────────────
  registerFn({ mnemonic: 'MAIN', name: 'Home Menu', category: 'System', description: 'Top-level menu of market dashboards and tools.', aliases: ['HOME', 'EASY'], component: MainFn });
  registerFn({ mnemonic: 'HELP', name: 'Function Directory', category: 'System', description: 'Browse and search every registered function. HELP <FN> shows one function in detail.', component: HelpFn });
  registerFn({ mnemonic: 'SMEN', name: 'Security Menu', category: 'System', description: 'Menu of functions for the loaded security.', requiresSecurity: true, component: SecMenuFn });
  registerFn({ mnemonic: 'SECF', name: 'Security Finder', category: 'System', description: 'Search the instrument universe across all asset classes.', aliases: ['TK'], component: SecfFn });
  registerFn({ mnemonic: 'LAST', name: 'Recent Commands', category: 'System', description: 'Recently executed commands — click to re-run.', component: LastFn });

  // ── Single security ──────────────────────────────────────────
  registerFn({ mnemonic: 'DES', name: 'Security Description', category: 'Markets', description: 'Profile, classification and key statistics for the loaded security.', requiresSecurity: true, component: DesFn });
  registerFn({ mnemonic: 'GP', name: 'Price Chart', category: 'Charting', description: 'Interactive candlestick/line chart with ranges and volume.', requiresSecurity: true, aliases: ['G', 'CHART'], component: GpFn });
  registerFn({ mnemonic: 'GIP', name: 'Intraday Chart', category: 'Charting', description: 'Intraday price chart of the current session.', requiresSecurity: true, component: GipFn });
  registerFn({ mnemonic: 'HP', name: 'Historical Prices', category: 'Markets', description: 'Historical OHLCV table with period changes.', requiresSecurity: true, component: HpFn });
  registerFn({ mnemonic: 'BQ', name: 'Quote Board', category: 'Markets', description: 'Session detail: OHLC, range position, and recent intraday bars.', requiresSecurity: true, aliases: ['Q', 'QR'], component: BqFn });
  registerFn({ mnemonic: 'CN', name: 'Company News', category: 'News', description: 'Headlines for the loaded security.', requiresSecurity: true, component: CnFn });

  // ── Market dashboards ────────────────────────────────────────
  registerFn({ mnemonic: 'WEI', name: 'World Equity Indices', category: 'Markets', description: 'Global benchmark dashboard grouped by region, with intraday sparklines.', component: WeiFn });
  registerFn({ mnemonic: 'WB', name: 'Rates & Bonds', category: 'Fixed Income', description: 'US treasury yield complex plus duration and volatility proxies.', component: WbFn });
  registerFn({ mnemonic: 'WCR', name: 'World Currencies', category: 'FX', description: 'Major and EM currencies against the dollar.', component: WcrFn });
  registerFn({ mnemonic: 'FXC', name: 'FX Cross Matrix', category: 'FX', description: 'Cross-rate matrix for G7 currencies computed from live USD legs.', component: FxcFn });
  registerFn({ mnemonic: 'GLCO', name: 'Global Commodities', category: 'Commodities', description: 'Front-month futures across energy, metals and agriculture.', aliases: ['NRG', 'METL'], component: GlcoFn });
  registerFn({ mnemonic: 'CRYP', name: 'Digital Assets', category: 'Crypto', description: 'Major cryptocurrencies with live pricing.', component: CrypFn });
  registerFn({ mnemonic: 'MOST', name: 'Market Movers', category: 'Markets', description: 'Leaders and laggards ranked by % move.', aliases: ['MOV'], component: MostFn });
  registerFn({ mnemonic: 'EQS', name: 'Equity Screener', category: 'Equities', description: 'Filter the equity universe by sector, direction and price; sortable columns.', component: EqsFn });

  // ── News & economics ─────────────────────────────────────────
  registerFn({ mnemonic: 'TOP', name: 'Top News', category: 'News', description: 'Global market headlines, newest first.', aliases: ['N', 'NH'], component: TopFn });
  registerFn({ mnemonic: 'ECO', name: 'Economic Calendar', category: 'Economics', description: 'This week’s economic releases with survey, prior and actuals.', component: EcoFn });

  // ── Personal ─────────────────────────────────────────────────
  registerFn({ mnemonic: 'W', name: 'Watchlist', category: 'Portfolio', description: 'Personal streaming monitor, persisted locally.', aliases: ['MON', 'WL'], component: WatchFn });
  registerFn({ mnemonic: 'NOTE', name: 'Notepad', category: 'System', description: 'Personal scratchpad, autosaved locally.', component: NoteFn });

  // ── Roadmap stubs from the feature inventory ─────────────────
  for (const def of buildStubDefs()) registerFn(def);
}
