# theterminal

A Bloomberg-Terminal-class market workstation with a modern, refined design —
command-line-first navigation, multi-panel workspace, streaming quotes,
charts, news, and an MCP server so agents can use it too.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftejasjhamb67-dev%2Ftheterminal)

![functions](https://img.shields.io/badge/functions-46_live_·_257_registered-d4b476) ![coverage](https://img.shields.io/badge/coverage-whole_market_via_live_search-0a0d13)

## Try it

- **Hosted demo (simulated market):** https://tejasjhamb67-dev.github.io/theterminal/ — auto-deployed
  from this branch by GitHub Actions.
- **Vercel (LIVE data) — recommended:** click the Deploy button above, or run `npx vercel` in a
  clone — `vercel.json` + `api/yf.js` proxy the market connector server-side, so a Vercel
  deployment runs in **● LIVE DATA** mode with whole-market symbol search.
- Static hosts (Pages, artifacts) have no `/yf` proxy, so they run on the built-in simulated
  market — same UI, deterministic streaming ticks.

## Quick start

```bash
npm install
npm run dev        # → http://localhost:5173 (LIVE via dev proxy)
```

With internet access the top bar shows **● LIVE DATA** (Yahoo Finance
connector). Without it, a deterministic simulated market keeps every screen
streaming — same UI, same ticks.

## How to drive it

Everything is the command line. Click a panel, type, hit ⏎:

| Type | Get |
|---|---|
| `AAPL` | load Apple → its function menu |
| `AAPL GP` | candlestick chart |
| `NVDA DES` | security description |
| `EURUSD Curncy GIP` | intraday FX chart |
| `WEI` | world equity indices dashboard |
| `GLCO` `WCR` `FXC` `CRYP` `WB` | commodities · currencies · FX matrix · crypto · rates |
| `TOP` / `CN` | market news / company news |
| `EQS` `MOST` `ECO` | screener · movers · economic calendar |
| `BRIEF` / `NVDA IQ` | auto-generated market brief · plain-language security read |
| `AAPL FA` `EE` `ANR` `DVD` `EQRV` | financials · earnings · analyst recs · dividends · peer comps |
| `TSLA TECH` / `COMP` / `CORR` | technical signals · relative returns · correlation matrix |
| `YAS` `GC` `WIRP` | bond calculator · treasury curve · policy path |
| `AAPL OMON` `OVME` `SKEW` | option chain · Black–Scholes pricer · vol smile |
| `PORT` `PRTU` `ALRT` | portfolio risk (beta/vol/VaR) · positions · price alerts |
| `NSE fed` / `NI FED` | news search · topic-coded news (25 codes) |
| `AAPL FLDS` / `BDP TSLA RSI_14D` | live field dictionary · single-field formula pulls |
| `TATAMOTORS DES` | whole-market coverage — any listed symbol on any exchange resolves |
| `W` `NOTE` `LAST` | watchlist · notepad · command history |
| `HELP` | the full function directory |
| `3` | select item 3 on any numbered menu |

The loaded security sticks to the panel — `TSLA DES` then `GP` charts Tesla.
`Ctrl+1..4` switches panels; the `1 / 2 / 4` buttons change the layout.

## MCP server

Expose the terminal's data connectors to any MCP-capable agent:

```bash
claude mcp add theterminal -- node mcp/server.mjs
```

Tools: `get_quote`, `get_history`, `search_symbols`, `get_news`.

## Docs

- **[docs/BLOOMBERG_TERMINAL_FEATURES.md](docs/BLOOMBERG_TERMINAL_FEATURES.md)** —
  the complete Bloomberg Terminal feature inventory (the build spec).
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — layers, command grammar,
  how to add functions/connectors, phase roadmap.

## Design

Not Bloomberg-amber-depressing: deep ink surfaces, warm ivory type,
champagne-gold accents, soft emerald/coral for up/down, tabular numerals,
tick-flash animations. Dense, quiet, classy.
