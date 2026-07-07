# Architecture

How theterminal is built, how to add functions, and how it scales toward the
full [feature inventory](BLOOMBERG_TERMINAL_FEATURES.md).

## Layers

```
┌────────────────────────────────────────────────────────────┐
│ Shell (src/components)                                     │
│ 4-panel workspace · per-panel command line · autocomplete  │
│ breadcrumbs · numbered menus · status bar                  │
├────────────────────────────────────────────────────────────┤
│ Command engine (src/core)                                  │
│ parser: SECURITY? FUNCTION? ARG? grammar → registry lookup │
│ registry: pluggable FunctionDef map (live + stub tiers)    │
│ context: panel state, frame history, sticky security       │
├────────────────────────────────────────────────────────────┤
│ Function screens (src/functions)                           │
│ each mnemonic = one React component receiving FnProps      │
├────────────────────────────────────────────────────────────┤
│ Data layer (src/data)                                      │
│ service: facade w/ TTL cache + live→sim failover           │
│ providers: yahoo (live) · sim (deterministic market)       │
│ universe: security master (ticker ontology, yellow keys)   │
├────────────────────────────────────────────────────────────┤
│ Integrations (mcp/)                                        │
│ MCP stdio server exposing quotes/history/search/news       │
└────────────────────────────────────────────────────────────┘
```

## The command grammar

`resolveCommand` in `src/core/parser.ts` implements Bloomberg's interaction
model:

| Input | Resolution |
|---|---|
| `WEI` | run function market-wide |
| `AAPL` | load security → security menu (SMEN) |
| `AAPL GP` | load security + run function |
| `AAPL US Equity GP` | full canonical form with yellow key |
| `HELP GP` | function + argument |
| `3` | numbered-menu selection on the active screen |

The loaded security is **sticky per panel**: running `GP` after `AAPL DES`
charts Apple.

## Adding a function (the path to 44,000)

Every screen is a plug-in. To add one:

1. Create a component in `src/functions/` receiving `FnProps`
   (`{ sec, arg, panel }`; `panel.execute()` lets rows/menus chain commands).
2. Register it in `src/functions/index.ts`:

```ts
registerFn({
  mnemonic: 'YAS',
  name: 'Yield & Spread Analysis',
  category: 'Fixed Income',
  description: '…',
  requiresSecurity: true,
  component: YasFn,
});
```

That's it — the command line, autocomplete, HELP directory, numbered menus
and status-bar counters pick it up automatically. Functions not yet built
are registered as **stubs** (`src/functions/stubs.tsx`) so the command
surface already knows the whole spec; building a function = replacing its
stub with a real component.

## Data connectors

`src/data/service.ts` is the only thing screens talk to. It:

- probes the live connector at startup → sets global **LIVE / SIM** mode
  (shown in the top bar);
- falls back **per request**, so a flaky connector never blanks a screen;
- caches with per-type TTLs (quotes 10s, bars 60s, news 120s).

Current connectors:

| Connector | Data | Transport |
|---|---|---|
| `providers/yahoo.ts` | quotes, OHLCV, news, all asset classes | `/yf` dev proxy → query1.finance.yahoo.com |
| `providers/sim.ts` | deterministic simulated market | in-process |

The sim deserves a note: it seeds a PRNG per security, builds 5 years of
daily bars anchored to a realistic base price, pre-fills the current
session minute-by-minute, and then **keeps ticking** while the app is open
— so charts, monitors and tick-flashes all behave like a live market even
fully offline.

To add a connector (FRED, CoinGecko, Polygon, IEX, …): implement the same
`getQuote/getBars/getNews`-shaped functions, add a proxy route in
`vite.config.ts` if the API lacks CORS, and slot it into the failover chain
in `service.ts`. In production, terminate the proxy routes at your own
gateway instead of Vite's dev server.

## MCP integration

`mcp/server.mjs` is a stdio MCP server exposing the data layer as tools —
`get_quote`, `get_history`, `search_symbols`, `get_news` — so any
MCP-capable agent can use the terminal's connectors:

```
claude mcp add theterminal -- node /path/to/theterminal/mcp/server.mjs
```

Planned: an MCP tool per terminal function (run `EQS` screens, read `W`
watchlists), and inbound MCP so agents can drive panels.

## Phase roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Feature inventory / spec | ✅ |
| 1 | Shell, command engine, data layer, 23 live functions, MCP server | ✅ |
| 2 | Equity analytics: FA, EE, ANR, DVD, EQRV comps, COMP charts | next |
| 3 | Fixed income & rates: YAS calculator, GC curves, WIRP | |
| 4 | Derivatives: OMON chains, OVME pricer (Black-Scholes), SKEW | |
| 5 | Portfolio: PORT, PRTU, position upload, ALRT alerts engine | |
| 6 | News expansion: NSE search, NI topic codes, NLRT alerts | |
| 7 | Launchpad-style linked components, GRAB, themes (PDFS) | |
| 8+ | Function-count grind toward the full inventory | |
