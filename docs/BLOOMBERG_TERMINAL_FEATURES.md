# Bloomberg Terminal — Complete Feature & Functionality Inventory

> Master reference for building "theterminal". Every capability, nuance, and function
> mnemonic of the Bloomberg Professional Terminal, organized by domain. Functions are
> invoked as `MNEMONIC <GO>` — this inventory is the build spec.

---

## 1. Core Interaction Model (the "feel" of the Terminal)

The single most distinctive thing about Bloomberg is **command-line-first navigation**.
Everything below must be captured for an authentic clone:

- **Command line at top of every panel.** You type a command and press `<GO>` (Enter).
- **Command grammar:** `TICKER <YELLOW KEY> FUNCTION <GO>`
  e.g. `AAPL US Equity GP <GO>` → chart Apple. Parts are optional:
  - Function alone (`WEI <GO>`) runs against the loaded/last security or is market-wide.
  - Security alone (`AAPL US Equity <GO>`) opens the security's main menu.
- **Sticky security context:** the loaded security persists per panel; subsequent
  function calls apply to it until you load a new one.
- **Autocomplete / fuzzy search:** typing anything gives instant dropdown suggestions of
  securities, functions, people, and help pages ("Search All").
- **Numbered menus:** every screen is a menu; typing a number + `<GO>` drills into that
  item. `MENU <GO>` (or the Menu key) goes back one level (breadcrumb "back").
- **Multi-panel workspace:** classic setup is **4 independent terminal panels**
  (Panel 1–4) across monitors, each with its own command line, security context, and
  history. `PANEL <GO>` / keyboard toggles cycle between them.
- **Amber-on-black aesthetic:** black background, amber/orange primary text, green for
  up-ticks/positive, red for down-ticks/negative, blue for clickable links, white for
  data, flashing cell backgrounds on tick updates.
- **Everything is clickable AND typeable:** every on-screen element (tickers, headlines,
  menu rows) is mouse-clickable, but power users never leave the keyboard.
- **Command stacking / chaining:** `LAST <GO>` shows the last 8 functions run; up-arrow
  cycles command history; `G <GO>` #-shortcuts jump to saved charts (`G 1 <GO>`).
- **Help paradigm:** press `HELP` once on any screen → contextual documentation for that
  function; press `HELP HELP` (twice) → live 24/7 chat with a Bloomberg Analytics rep.
- **`<GO>` is Enter.** All docs and muscle memory revolve around it.

### 1.1 The Bloomberg Keyboard (hardware nuances worth emulating on-screen)

| Key | Color | Purpose |
|---|---|---|
| `<GO>` | Green | Execute command (Enter) |
| `<MENU>` | Red/Green | Back one screen / show related functions |
| `<PANEL>` | — | Cycle between the 4 panels |
| `<HELP>` | Green | 1x = docs, 2x = live help chat |
| `<NEWS>` | — | Jump to news (TOP) |
| `<GRAB>` | — | Screenshot current screen → email/message it |
| `<PRINT>` | — | Print current screen |
| `<CANCEL>` | Red | Clear command line / abort |
| `<CONN DFLT>` | Red | Login/logout |
| Yellow market-sector keys | Yellow | Asset-class qualifiers (see §2) |
| `F1–F12` | — | Mapped to the yellow keys + HELP |
| Volume/mute + speaker | — | Built-in speaker for squawk/audio |
| Fingerprint reader (B-Unit) | — | Biometric authentication |

### 1.2 Login / identity nuances

- Personal login follows the user to any terminal ("Bloomberg Anywhere") — settings,
  monitors, messages, defaults all roam.
- **B-Unit**: biometric second-factor device (fingerprint) for login.
- Two simultaneous sessions max; mobile app (BBG Anywhere) as companion.
- `GRAB`, `NOTE`, `MSG` etc. are tied to your identity — everything is attributable.

---

## 2. Yellow Keys — Asset-Class Market Sectors

Typing a ticker then a yellow key disambiguates the market. These are the Terminal's
top-level ontology:

| Key | Fn | Sector | Covers |
|---|---|---|---|
| `GOVT` | F2 | Government bonds | Sovereigns, agencies, T-bills, notes, bonds |
| `CORP` | F3 | Corporate debt | Corporate bonds, converts, CDS reference |
| `MTGE` | F4 | Mortgage securities | MBS pass-throughs, CMOs, ABS, CMBS |
| `M-MKT` | F5 | Money markets | CP, CDs, BAs, short-dated paper |
| `MUNI` | F6 | Municipal bonds | US municipal debt |
| `PFD` | F7 | Preferreds | Preferred shares |
| `EQUITY` | F8 | Equities | Stocks, ADRs, ETFs, mutual funds, options, warrants, rights, indices-as-equity |
| `CMDTY` | F9 | Commodities | Futures, options on futures, spot, weather, freight |
| `INDEX` | F10 | Indices | Equity/economic indices (SPX Index, VIX Index…) |
| `CRNCY` | F11 | Currencies | Spot FX, forwards, NDFs (EURUSD Crncy) |
| `CLIENT`/`ALPHA` | F12 | Portfolio/custom | User portfolios & custom securities |

Ticker construction nuance: `<name> <exchange/country code> <yellow key>` —
e.g. `VOD LN Equity`, `TSLA US Equity`, `USGG10YR Index`, `CL1 Comdty` (front-month
generic), `EURUSD Curncy`, `T 4.25 05/15/39 Govt` (bonds are quoted by coupon/maturity).
Generic contracts: `CL1`, `CL2`… roll continuously. `CUSIP/ISIN <yellow key>` also loads.

---

## 3. System, Navigation & Personalization Functions

| Mnemonic | Function |
|---|---|
| `EASY` | New-user onboarding home |
| `BPS` | Bloomberg cheat sheets / product docs by asset class |
| `DOCS` | Document & help search |
| `LAST` | Last 8 functions used |
| `MENU` | Back / related-function menu |
| `PDF` | Personal defaults (base currency, default exchange, chart settings…) |
| `PDFC` | Copy defaults between users |
| `CNFG` | Screen/panel configuration, fonts, colors |
| `TZDF` | Time-zone default |
| `LANG` | Language settings |
| `GRAB` | Screenshot → send by MSG |
| `PRTS` | Print settings; `PRNT` print |
| `NOTE` | Personal notepad; notes attachable to securities |
| `STO` / `RCL` | Copy the loaded security / paste it in another panel |
| `G` | Saved custom charts (G 1, G 2…) |
| `SECF` | Security Finder — master cross-asset search by name/type |
| `FLDS` | Field finder — every data field on a security (the data dictionary) |
| `HDSK` | Help desk tickets |
| `BLP` | Launchpad (see §4) |
| `BBU` | Bloomberg data upload (portfolios, custom data) |
| `TMSG` | Terminal message of the day / system status |
| `UUF` | User profile |
| `SPDL` | Speed dial / favorite contacts |
| `BU` | Bloomberg University — training courses & certification |
| `BMC` | Bloomberg Market Concepts (e-learning certification) |
| `PRPL` | Bloomberg résumé/CV for job hunting |
| `JOBS` | Job listings in finance |

Nuance: **hidden/legacy functions** exist that don't autocomplete (terminal lore —
e.g. `FLY` flight tracking, `POSH` classifieds-style marketplace, `DINE` restaurant
reviews, `WEA`/`WETR` weather, `BOAT` yacht listings, `GAME`/`FFM` fantasy football,
`SNOW` ski reports, `EROS` (old horoscope, retired)). These are part of the culture and
fun to include.

---

## 4. Launchpad (BLP) — the customizable workspace layer

Launchpad is a dashboard system of small always-on components docked around the panels:

- **Monitors** (watchlist grids with streaming prices, custom columns, conditional coloring)
- **Charts** (live mini-charts linked to monitors)
- **News panels** (filtered headline streams)
- **Quote boards / market maps**
- **IB chat windows** docked as tiles
- **Alert catchers** (pop-up toasts for price/news alerts)
- **Linking/grouping:** components are color-group linked — click a ticker in a monitor
  and every linked component (chart, news, DES…) retargets to it instantly
- **Pages persist** across sessions & roam with login; multiple named Launchpad "views"
- `LLP` — Launchpad landing; `MONI` — monitor manager

---

## 5. News & Research

| Mnemonic | Function |
|---|---|
| `TOP` | Top global news headlines (the canonical screen) |
| `N` | Main news home |
| `CN` | Company news for loaded security |
| `NH` | News on a topic/ticker |
| `NI <code>` | News by topic code (e.g. `NI TECH`, `NI FED`, `NI M&A`) — thousands of taxonomy codes |
| `NSE` | News search (full-text, with source/date/topic filters) |
| `NLRT` | News alerts setup (keyword/ticker → pop-up, msg, mobile) |
| `READ` | Most-read news (trending among all users) |
| `FIRS` | First Word — Bloomberg's fast, trader-oriented headline squawk |
| `TNI` | Combine two news topic codes |
| `NRR` | News-derived sentiment / relevance scores per security |
| `BRIEF` | Bloomberg Briefs newsletters |
| `RES` | Third-party & broker research portal |
| `BI` | Bloomberg Intelligence — in-house analyst research: industry dashboards, primers, comps, litigation & policy analysis |
| `BNEF` | BloombergNEF — energy-transition research |
| `DSCO` | Document search across filings/transcripts with keyword hits |
| `CF` | Company SEC/regulatory filings |
| `EDF` | Equity disclosure filings |
| `TWTR`/social | Curated social-media (X/Twitter) feed with velocity alerts |
| `LIVE` | Bloomberg TV live stream inside terminal |
| `AV` | Audio-visual: TV clips, event replays, podcasts, radio |
| `SQUAWK` | Live audio market commentary ("squawk box") |

News nuances: red **breaking-news banner** across all panels; headlines color-coded by
age (newest = white → older amber); every story tagged with tickers, people & topic
codes and cross-clickable; embargo/priority flags; "News Trends" heat over time (`NT`).

---

## 6. Communication & Community (the moat)

| Mnemonic | Function |
|---|---|
| `MSG` | Bloomberg Message — email-grade messaging to any terminal user; attachments; every user has `firstname.lastname@bloomberg.net` |
| `IB` | Instant Bloomberg — real-time chat: 1:1, group rooms, persistent chatrooms; the sell-side/buy-side standard |
| `IB Blast` | Broadcast a message to many chats (dealer runs get sent this way) |
| `PEOP` | People search — the directory of ~350k users |
| `BIO` | Person profile: employment history, education, board seats, comp (for execs) |
| `MGMT` | Company management & board with bios |
| `SPDL` | Speed dial |
| `MEET` | Meeting/roadshow scheduling |
| `EVTS` | Corporate event calendar (earnings calls, conferences) w/ dial-ins & transcripts |
| `VCON` | Voice/trade confirmations |
| `NOTE`/`NOTES` | Shared notes & collaboration |

Nuances: compliance archiving of all MSG/IB (firms can surveil); presence indicators;
disclaimers auto-appended; chat parsing (dealer-run prices in IB are machine-readable);
"share screen/GRAB into chat"; contact lists sync with trading functions (IOIs, axes).

---

## 7. Cross-Asset Market Overview Screens

| Mnemonic | Function |
|---|---|
| `WEI` | World Equity Indices — the classic global dashboard (futures %, movers, regional tabs) |
| `GMM` | Global Macro Movers — cross-asset biggest moves |
| `MOST` | Most-active stocks (volume/value/trades) |
| `MOV` | Index movers — contribution of members to index move |
| `IMAP` | Intraday market heat map by sector (treemap) |
| `WB` | World bond markets — sovereign yields & spreads matrix |
| `WCR` | World currency rates |
| `WBF` | World bond futures |
| `WIR` | World interest-rate futures |
| `GLCO` | Global commodity prices dashboard |
| `NRG` | Energy market overview |
| `BTMM` | Bloomberg Treasury & Money Markets — one-screen money-market cockpit per country |
| `FIT` | Fixed-income trading dashboard (live Treasury runs) |
| `MMR` | Money-market rates monitor |
| `IBOR`/`SOFR` pages | Benchmark rates dashboards |
| `ECST` | World economic statistics browser |
| `CBRT` | Central bank rates worldwide |
| `FOMC`/`FED` | Fed dashboards |
| `EPFR` | Fund-flow data |
| `MKTP` | Market map (globe visualization) |

---

## 8. Single-Security Core Functions (work on almost anything)

| Mnemonic | Function |
|---|---|
| `DES` | Security description — THE landing page for any instrument (multi-tab: profile, financials snapshot, id codes, capital structure) |
| `GP` | Line/candle price chart (interactive: zoom, drawing, events overlay) |
| `GIP` | Intraday price chart |
| `HP` | Historical price table (D/W/M, with volume, VWAP) |
| `HCP` | Historical close price w/ changes |
| `GF` | Graph fundamentals (chart any fundamental field over time) |
| `COMP` | Comparative total-return chart vs peers/index |
| `HS` | Historical spread between two securities |
| `HRA` | Historical regression/beta analysis |
| `CORR` | Correlation matrix |
| `QR` | Quote recap — tick-by-tick trade log |
| `QRM` | Quote/trade recap with market depth |
| `BQ` | Bloomberg Quote — composite quote montage, depth, brokers |
| `GM`/`MDM` | Market depth monitor (level 2 book) |
| `VWAP` | Volume-weighted average price analytics |
| `TSM` | Trade summary matrix (venue breakdown, dark vs lit) |
| `RV` | Relative value vs custom peer set |
| `CH` | Custom chart menu; `CHART` advanced charting home |
| `EV` | Event study (price reaction around events) |
| `GV` | Historical volatility chart |
| `SI` | Short interest |
| `CACS` | Corporate actions calendar (splits, dividends, spin-offs) |
| `WGT` | Index/portfolio membership weightings |

Charting nuances (`GP`/`CHART`): dozens of studies (RSI, MACD, Bollinger, Ichimoku,
Fibonacci, DMI, stochastics…), drawing/annotation tools, event flags (earnings, divs,
news) plotted on price, multi-security overlay, regression channel, save-as-`G#`,
export to Excel, right-click "copy data".

---

## 9. Equity-Specific Analytics

### 9.1 Company analysis
| Mnemonic | Function |
|---|---|
| `FA` | Financial Analysis — full statements (IS/BS/CF), ratios, segments, per-share, banking-specific tabs; quarterly/annual/LTM; as-reported vs adjusted |
| `MODL` | Company financial model (consensus-driven projections, detailed line items) |
| `EE` | Earnings estimates (consensus, surprise history) |
| `EEB` | Broker-by-broker estimate detail |
| `EM` | Estimate momentum / revisions trend |
| `ERN` | Earnings history vs estimates (beat/miss) |
| `EA` | Earnings analysis: implied move, options straddle pricing into print |
| `ANR` | Analyst recommendations (buy/hold/sell, price targets, per-analyst accuracy) |
| `BICS` | Bloomberg Industry Classification browser |
| `CAST` | Capital structure — debt stack visualization, maturity wall |
| `DDIS` | Debt distribution — maturity profile of issuer's debt |
| `ISSD` | Issuer description (credit-oriented company page) |
| `RELS` | Related securities (all bonds, options, ADRs, lines of one issuer) |
| `AGGD` | Aggregated debt view |
| `SPLC` | Supply chain analysis — customers/suppliers with revenue dependency % |
| `BMAP` | Map of company assets/facilities (also ships, rigs, pipelines) |
| `MGMT` | Management & board |
| `PHDC`/`HDS` | Holders — institutional/insider ownership, changes |
| `OWN` | Ownership summary; `INSD` insider transactions |
| `DVD` | Dividend history & projections (BDVD forecasts) |
| `WACC` | Weighted average cost of capital calc |
| `DDM` | Dividend discount model valuation |
| `GEO` | Geographic revenue segmentation |
| `CCB` | Credit profile of company |
| `LITI` | Litigation tracker |
| `ESG` | ESG scores, emissions data, disclosures, controversies |
| `BR` | Broker research for the company |
| `PBAR` | Peer bar chart comparisons |

### 9.2 Screening, comps & ideas
| Mnemonic | Function |
|---|---|
| `EQS` | Equity screening — build multi-criteria screens over global universe, save & backtest |
| `EQRV` | Equity relative valuation — auto comps table w/ percentile history of multiples |
| `RVC` | Relative value correlation |
| `GRR` | Group return ranking (sector/index total returns over periods) |
| `PPC` | Price/earnings band charts |
| `EQBT` | Backtest equity strategies on screens |
| `FSCO` | Factor scores |
| `IPO` | IPO/ECM calendar & league tables |
| `MA` | M&A deals database, league tables, deal pages w/ terms & arb spread |
| `PE` | Private equity/company database |
| `EVTS` | Event calendars across companies |
| `DRSK` | Bloomberg default-risk model (1-yr PD, credit health) for any company |

### 9.3 Funds & ETFs
| Mnemonic | Function |
|---|---|
| `FSRC` | Fund screening |
| `FREP` | Fund replication/holdings |
| `FPC` | Fund performance comparison |
| `ETF` | ETF hub — flows, creations, spreads, premium/discount |
| `HFND` | Hedge-fund database |
| `NAV` | Fund NAV history |

---

## 10. Fixed Income

### 10.1 Pricing & relative value
| Mnemonic | Function |
|---|---|
| `YAS` | Yield & Spread Analysis — THE bond calculator: price↔yield, G-spread, Z-spread, ASW, OAS, risk (DV01, duration, convexity), settlement math |
| `YASN` | Yield analysis for notes/structured |
| `ASW` | Asset-swap calculator |
| `OAS1` | Option-adjusted spread analytics for callables |
| `SP` | Bond spread to benchmark |
| `FIHZ` | Horizon/total-return analysis for bonds |
| `BVAL` | Bloomberg's evaluated pricing (with BVAL score confidence) |
| `ALLQ` | All quotes — every dealer's bid/ask on a bond, executable links |
| `TDH` | Trade history (TRACE prints) |
| `HZ`/`TRA` | Total-return & horizon scenarios |
| `CSHF` | Cash-flow schedule of a bond |
| `DES` (bond) | Coupon, maturity, covenants tabs, prospectus links, change-of-control puts, call schedule |
| `YTC/YTW` views | Yield-to-call/worst grids across the call schedule |

### 10.2 Curves & rates
| Mnemonic | Function |
|---|---|
| `CRVF` | Curve finder (all sovereign/swap/credit curves) |
| `GC` | Graph curves — plot any curve, historical evolution, butterflies |
| `FWCV` | Forward curve analysis (project forward rates) |
| `USSW` | US swap/rates composite page |
| `IRSB` | Interest-rate swap rates board |
| `WIRP`→`WIRA` | World interest-rate probabilities — implied central-bank hike/cut odds from futures/OIS (iconic function) |
| `GLC` | Global liquidity/curve monitors |
| `ILBE` | Inflation breakevens; `BTP`/`SOVM` sovereign monitors |
| `FOMC dots` | Dot-plot visualizations (`DOTS`) |

### 10.3 Credit
| Mnemonic | Function |
|---|---|
| `CDSW` | CDS pricing calculator (ISDA standard model) |
| `WCDS` | World CDS monitor — spreads across all names |
| `CDX/ITRX` pages | Credit index monitors, skew to intrinsics |
| `CRPR` | Credit ratings profile (Moody's/S&P/Fitch history) |
| `RATC` | Ratings-change feed (upgrades/downgrades stream) |
| `RATD` | Rating methodology definitions |
| `DIS` | Distressed-debt monitor |
| `NIM` | New-issue monitor (primary market calendar, pricing, books) |
| `PREL` | Preliminary deal announcements/pipeline |
| `SRCH` | Fixed-income search — screen the entire bond universe by any covenant/coupon/maturity/sector criteria |
| `LEAG` | Underwriting league tables |
| `DDIS` | Issuer maturity walls |
| `COVR` | Covenant analysis |
| `RESL` | Restructuring/liability-management tracker |

### 10.4 Munis, MBS/structured
| Mnemonic | Function |
|---|---|
| `MIFA` | Municipal issuer financial analysis |
| `DEAL` | New muni deal calendar |
| `MBWD` | Muni bond-wide data |
| `CLC` | MBS collateral composition |
| `CFT` | CMO cash-flow tables |
| `VALL` | Vector analysis (prepay scenarios) |
| `YT` | MBS yield table (price/yield across PSA/CPR speeds) |
| `CPH` | Prepayment history |
| `SPA` | Structured pay-down analytics |
| `CMO` | CMO deal explorer, tranche waterfalls |
| `DQRP` | Delinquency reports for deals |

### 10.5 Money markets & repo
`BTMM` (country money-market cockpit), `MMCV` (money-market curves), `RRRA` (repo
calculator), `BSR` (repo rates), `FXFM`/`FRA` pages, T-bill calculators (`BC` bond
calculators family), commercial-paper monitors.

---

## 11. Derivatives & Volatility

| Mnemonic | Function |
|---|---|
| `OMON` | Option monitor — full chains w/ greeks, IV, streaming |
| `OV`/`OVME` | Option valuation — price any vanilla/exotic, greeks, what-if |
| `OSA` | Option scenario analysis — position P&L surfaces vs spot/vol/time |
| `OVML` | FX option pricing (vanilla, barriers, digitals) |
| `OVSN` | Structured-note pricing |
| `SKEW` | Vol skew/smile charts by expiry |
| `HIVG` | Historical implied vol graph |
| `GV` | Realized-vs-implied vol comparison |
| `VCUB` | Volatility cube (swaptions/caps surfaces) |
| `CT` | Futures contract table (all expiries) |
| `CTM` | Contract table menu across all futures markets |
| `EXS` | Expiration schedule |
| `DLV` | Cheapest-to-deliver analysis for bond futures |
| `SWPM` | Swap Manager — price/risk any swap: IRS, OIS, basis, XCCY, caps/floors, swaptions; curve bootstrapping, DV01 ladders (flagship) |
| `SWPR` | Swap rates monitor |
| `DSWP` | Swap curve dashboards |
| `MARS` | Multi-Asset Risk System — portfolio-level derivatives risk, scenarios, stress tests |
| `XLTP` | Excel template library for derivative pricing |
| `HVT` | Historical volatility table |
| `TRMS` | Term-structure monitors (VIX futures curve etc.) |

---

## 12. FX

| Mnemonic | Function |
|---|---|
| `FXGO` (`FXIP` home) | FX trading platform — multi-dealer RFQ/streaming for spot, forwards, swaps, NDFs, options; free with terminal |
| `WCR` | World currency ranking/rates |
| `FXC` | FX cross-rate matrix |
| `FRD` | FX forward calculator (points, outrights, implied yields) |
| `FXFC` | FX forecasts (bank-by-bank composite) |
| `BFIX` | Bloomberg FX fixings |
| `XCCY` | Cross-currency basis monitors |
| `FXCT` | FX carry-trade analytics |
| `CIX` | Custom index builder (e.g. baskets, spreads as tickable series) |
| `REGN` | Real effective exchange rates |
| `EMFX` pages | Emerging-market FX dashboards |

---

## 13. Commodities

| Mnemonic | Function |
|---|---|
| `GLCO` | Global commodity dashboard |
| `NRG` | Energy hub (crude, products, gas, power) |
| `METL` | Metals hub; `AGS` agriculture hub |
| `CTM` | All futures contract tables |
| `FWCM` | Forward curve matrix for commodities |
| `SEAG` | Seasonality charts |
| `COSY` | Inventory/supply-demand data (EIA, API releases) |
| `WETR` | Weather dashboards (temps, storms, models) — traders live on this |
| `FRHT` | Freight rates (Baltic indices, tanker rates) |
| `SHIP` | Ship tracking on maps (AIS data) |
| `BMAP` | Commodity infrastructure maps: pipelines, refineries, tankers, LNG cargos |
| `OILP` | Oil market snapshot |
| `CARB` | Carbon/emissions markets |

---

## 14. Economics

| Mnemonic | Function |
|---|---|
| `ECO` | Economic calendar — releases w/ survey median, prior, actual, relevance score; real-time flash on release |
| `WECO` | World economic calendar matrix |
| `ECOF` | Economic data finder (browse all series) |
| `ECST` | Country statistical dashboards (GDP, CPI, unemployment trees) |
| `ECFC` | Economist forecasts by bank, composite |
| `ECOS` | Economist estimates detail |
| `GEW` | Global economic watch |
| `ECWB` | Economics workbench (chart/transform any macro series) |
| `TAYL` | Taylor-rule calculator |
| `FED`/`BOE`/`ECB`/`BOJ` | Central-bank hubs (statements, minutes, speakers, balance sheets) |
| `CBRT` | All central-bank rates |
| `GPCA` | Global PMI/cycle analysis |
| `NSDX` | Nowcasts / alternative data (news-derived GDP tracking) |
| `COUN` | Country risk profile pages |
| `SOVR` | Sovereign ratings & CDS overview |

---

## 15. Portfolio, Risk & Buy-Side Workflow

| Mnemonic | Function |
|---|---|
| `PORT` | Portfolio & Risk Analytics — holdings, characteristics, performance **attribution** (Brinson/factor), tracking error decomposition, scenario/stress testing, VaR, optimizer; vs any benchmark |
| `PRTU` | Portfolio setup/admin (create, upload positions) |
| `BBU` | Position upload from files |
| `PLST` | Portfolio list |
| `RSK` | Risk models detail |
| `MARS` | Multi-asset derivative risk & margin |
| `LQA` | Liquidity Assessment — liquidation cost/time per position |
| `AIM` | Bloomberg AIM — buy-side OMS (orders, compliance, allocations, ops) |
| `PMF` | Portfolio monitor functions in Launchpad |
| `HFA` | Historical fund analysis (returns-based style analysis) |
| `PC` | Performance calculation pages |
| `BRC` | Reconciliation tools |
| `CACT` | Corporate-action processing for portfolios |

---

## 16. Trading & Execution (the transactional layer)

| Mnemonic | Function |
|---|---|
| `EMSX` | Equity Execution Management System — route orders to 1,300+ broker algos, baskets, TCA |
| `TSOX` | Fixed-income/derivatives EMS — RFQ to dealers, list trading |
| `FXGO` | FX execution (RFQ, streaming, algos) |
| `FIT` | Fixed-income trading hub (govvies: click-to-trade dealer streams) |
| `BOLT` | Bloomberg's bond ATS / all-to-all trading |
| `BMTF` | Bloomberg MTF/SEF regulated venues (swaps, CDS execution) |
| `TOMS` | Trade Order Management (sell-side inventory, axes, P&L) |
| `IOIA` | Indications of interest / advertised flow from brokers |
| `AXES` | Dealer axes aggregated |
| `VCON` | Voice-trade confirmation matching |
| `CTM/STP` | Straight-through processing, FIX network, allocations |
| `TCA` | Transaction-cost analysis |
| `RULE` | Pre-trade compliance rules (in AIM) |
| `EMIR/CFTC` reporting | Regulatory trade-reporting gateways |

Nuances: executable prices light up blue/green when tradable; "click-to-trade" from
ALLQ/FIT; order tickets pre-fill from the loaded security; positions & blotters
integrate back into PORT/TOMS; all activity compliance-logged.

---

## 17. Alerts & Automation

- `ALRT` — price/level alerts on any security field (crossing, % move, volume spike)
- `NLRT` — news keyword/topic alerts
- Ratings-change, estimate-change, filing alerts per security or portfolio
- Delivery: terminal pop-up (alert catcher), MSG, mobile push
- `EVTS`/`ECO` release reminders
- Scheduled reports: auto-run PORT/screens emailed daily

---

## 18. Data Access, API & Programmability

| Surface | What it is |
|---|---|
| Excel Add-in | `BDP` (point), `BDH` (history), `BDS` (bulk sets), `BQL` (query language) formulas; template library `XLTP`; drag-and-drop from terminal to Excel |
| Office integration | PowerPoint/Word live-linked charts |
| Desktop API (DAPI) | Local API for apps on the terminal PC (COM/.NET/Python `blpapi`) |
| Server API / B-PIPE | Enterprise real-time feeds |
| Data License | Bulk reference/pricing data delivery |
| `BQNT` | BQuant — hosted Python/Jupyter research environment against Bloomberg data |
| `BQL` | Bloomberg Query Language — server-side screening/analytics language |
| `FLDS` | Field explorer (the schema for all of the above) |
| Export nuances | Nearly every grid has "Output to Excel"; charts copy as images; `GRAB` everywhere |

---

## 19. Specialized Verticals

- `BLAW` — Bloomberg Law (cases, dockets, statutes) crossover
- `BGOV` — government/policy analysis, lobbying, contracts
- `BNEF` — new energy finance research & data
- `BI` — Bloomberg Intelligence dashboards per industry (500+ analysts)
- `ESG`/`RSCR` — ESG scores, regulatory disclosure data, carbon estimates
- `KYC` — Entity Exchange for onboarding docs
- `VDR` — virtual data rooms
- `DRQS` — data request system (ask Bloomberg to add/fix data)
- Indices business: `IN` Bloomberg index browser (BBG Barclays Agg etc.), `PORT`-linked benchmarks
- Real estate, insurance (`INSU`), banks (`BANK`) industry-specific dashboards

---

## 20. Iconic Little Nuances Checklist (authenticity details)

- [ ] `<GO>` suffix shown in all documentation and on-screen hints (`Hit <GO>`)
- [ ] Panel header strip: security name • function name • page N/N • help hint
- [ ] Red/green flashing cell on every tick; amber default text
- [ ] Numbered clickable menu rows (`1)` `2)` `3)` …) on every screen
- [ ] Breadcrumb "Related Functions" bar under the command line
- [ ] Message counter + IB chat tabs always visible in the app frame
- [ ] Blinking cursor in the always-focused command line
- [ ] Ticker syntax parsing with yellow-key disambiguation and fuzzy autocomplete
- [ ] `HELP` twice → live chat trope
- [ ] Function chaining memory (`LAST`, panel history, sticky security)
- [ ] Keyboard-first: every action reachable without the mouse
- [ ] 4-panel model with linked color groups
- [ ] "44,000 functions" lore; menu-of-menus discoverability
- [ ] Terminal beep on alerts; breaking-news red banner
- [ ] Login screen with username + biometric flavor
- [ ] The green/amber/red/blue/white color semantic system
- [ ] Monospaced, dense, zero-whitespace grids; data > chrome
- [ ] Easter eggs: `FLY`, `POSH`, `DINE`, `WETR`, `BOAT`, fantasy football

---

## 21. Suggested Build Priority for the Clone

1. **Shell & command engine** — panels, command line, `<GO>`, autocomplete, menu system, security context, amber/black theme (§1, §20)
2. **Reference & quotes** — `DES`, `BQ`/quote montage, ticker ontology w/ yellow keys (§2, §8)
3. **Charts** — `GP`, `GIP`, `HP`, `COMP` with studies (§8)
4. **Monitors & Launchpad-style watchlists** — `WEI`, `MOST`, custom monitors (§4, §7)
5. **News** — `TOP`, `N`, `CN`, `NI` codes, alerts (§5)
6. **Equity analytics** — `FA`, `EQS`, `ANR`, `EE`, `RV` (§9)
7. **Fixed income & rates** — `YAS`, `WB`, `GC`, `WIRP` (§10)
8. **Derivatives/FX/Commodities** — `OMON`, `OVME`, `FXC`, `GLCO` (§11–13)
9. **Economics** — `ECO`, `ECST` (§14)
10. **Portfolio** — `PORT`, `PRTU` (§15)
11. **Messaging simulation** — `MSG`, `IB` (§6)
12. **Alerts, Excel-style export, easter eggs** (§17, §18, §20)
