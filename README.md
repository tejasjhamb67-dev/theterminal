# theterminal

A Bloomberg-Terminal-class market workstation with a modern, refined design —
command-line-first navigation, multi-panel workspace, streaming quotes,
charts, news, and an MCP server so agents can use it too.

![status](https://img.shields.io/badge/phase-7-d4b476) ![functions](https://img.shields.io/badge/functions-43_live_·_94_registered-0a0d13)

## Quick start

```bash
npm install
npm run dev        # → http://localhost:5173
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
| `NSE fed` | news search with sentiment tags |
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
