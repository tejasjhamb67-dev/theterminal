import { registerFn } from '../core/registry';
import { HelpFn, LastFn, MainFn, SecMenuFn, SecfFn } from './system';
import { BqFn, DesFn, GipFn, GpFn, HpFn } from './security';
import { CrypFn, EqsFn, FxcFn, GlcoFn, MostFn, WbFn, WcrFn, WeiFn } from './markets';
import { CnFn, TopFn } from './news';
import { EcoFn } from './eco';
import { NoteFn, WatchFn } from './personal';
import { AnrFn, DvdFn, EeFn, EqrvFn, FaFn } from './equity';
import { CompFn, CorrFn, TechFn } from './charting2';
import { GcFn, WirpFn, YasFn } from './fi';
import { OmonFn, OvmeFn, SkewFn } from './derivs';
import { AlrtFn, PortFn, PrtuFn } from './portfolio';
import { BriefFn, IqFn, NseFn } from './intel';
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

  // ── Equity analytics ─────────────────────────────────────────
  registerFn({ mnemonic: 'FA', name: 'Financial Analysis', category: 'Equities', description: 'Income statement, balance sheet, margins and ratios by fiscal year.', requiresSecurity: true, component: FaFn });
  registerFn({ mnemonic: 'EE', name: 'Earnings & Estimates', category: 'Equities', description: 'Next report, consensus estimates and 8-quarter beat/miss history.', requiresSecurity: true, aliases: ['ERN', 'EM'], component: EeFn });
  registerFn({ mnemonic: 'ANR', name: 'Analyst Recommendations', category: 'Equities', description: 'Consensus stance, price targets and firm-by-firm coverage.', requiresSecurity: true, component: AnrFn });
  registerFn({ mnemonic: 'DVD', name: 'Dividends', category: 'Equities', description: 'Indicated yield, payout and distribution history.', requiresSecurity: true, component: DvdFn });
  registerFn({ mnemonic: 'EQRV', name: 'Relative Valuation', category: 'Equities', description: 'Multiples comps versus sector peers, with premium/discount read.', requiresSecurity: true, aliases: ['RV'], component: EqrvFn });

  // ── Advanced charting & quant ────────────────────────────────
  registerFn({ mnemonic: 'COMP', name: 'Comparative Returns', category: 'Charting', description: 'Indexed total-return overlay vs peers and benchmark. COMP <tickers> to customize.', component: CompFn });
  registerFn({ mnemonic: 'CORR', name: 'Correlation Matrix', category: 'Charting', description: '1Y daily-return correlation grid. CORR <tickers> to customize.', component: CorrFn });
  registerFn({ mnemonic: 'TECH', name: 'Technical Studies', category: 'Charting', description: 'SMA/RSI/MACD/Bollinger dashboard with a plain-language signal summary.', requiresSecurity: true, component: TechFn });

  // ── Fixed income ─────────────────────────────────────────────
  registerFn({ mnemonic: 'YAS', name: 'Yield & Spread Analysis', category: 'Fixed Income', description: 'Treasury calculator: price↔yield, duration, DV01, convexity, rate scenarios.', component: YasFn });
  registerFn({ mnemonic: 'GC', name: 'Treasury Curve', category: 'Fixed Income', description: 'Live constant-maturity curve with 2s10s/5s30s spreads and shape read.', aliases: ['CRVF'], component: GcFn });
  registerFn({ mnemonic: 'WIRP', name: 'Implied Policy Path', category: 'Fixed Income', description: 'Meeting-by-meeting cut/hold/hike probabilities and implied rate path.', component: WirpFn });

  // ── Derivatives ──────────────────────────────────────────────
  registerFn({ mnemonic: 'OMON', name: 'Option Monitor', category: 'Derivatives', description: 'Option chain with Black–Scholes theoreticals, greeks and smile IVs on live spot.', requiresSecurity: true, component: OmonFn });
  registerFn({ mnemonic: 'OVME', name: 'Option Valuation', category: 'Derivatives', description: 'Interactive Black–Scholes pricer: greeks, breakeven and spot ladder.', requiresSecurity: true, aliases: ['OV'], component: OvmeFn });
  registerFn({ mnemonic: 'SKEW', name: 'Volatility Smile', category: 'Derivatives', description: 'Implied-vol smile by expiry, anchored to realized vol.', requiresSecurity: true, component: SkewFn });

  // ── Portfolio & risk ─────────────────────────────────────────
  registerFn({ mnemonic: 'PORT', name: 'Portfolio & Risk', category: 'Portfolio', description: 'Positions, P&L, weights, beta, volatility, VaR and allocation.', component: PortFn });
  registerFn({ mnemonic: 'PRTU', name: 'Portfolio Setup', category: 'Portfolio', description: 'Add, average-in and remove positions; persisted locally.', component: PrtuFn });
  registerFn({ mnemonic: 'ALRT', name: 'Price Alerts', category: 'Portfolio', description: 'Arm above/below price alerts checked against the streaming tape.', component: AlrtFn });

  // ── Intelligence ─────────────────────────────────────────────
  registerFn({ mnemonic: 'IQ', name: 'Security Intelligence', category: 'Markets', description: 'Plain-language quantitative read: trend, momentum, vol regime, sentiment.', requiresSecurity: true, component: IqFn });
  registerFn({ mnemonic: 'BRIEF', name: 'Market Brief', category: 'News', description: 'Auto-generated cross-asset narrative from the live tape.', aliases: ['MB'], component: BriefFn });
  registerFn({ mnemonic: 'NSE', name: 'News Search', category: 'News', description: 'Full-text news search with per-headline sentiment tags.', component: NseFn });

  // ── Roadmap stubs from the feature inventory ─────────────────
  for (const def of buildStubDefs()) registerFn(def);
}
