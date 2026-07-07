#!/usr/bin/env node
// theterminal MCP server — exposes the terminal's data layer as MCP tools
// so agents (Claude Code, Claude Desktop, anything MCP-capable) can pull
// quotes, history and news through the same connectors the UI uses.
//
// Register in Claude Code:
//   claude mcp add theterminal -- node /path/to/theterminal/mcp/server.mjs
//
// Note: runs server-side (no CORS), talking straight to the upstream APIs.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const YF = 'https://query1.finance.yahoo.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' };

async function yf(path) {
  const res = await fetch(`${YF}${path}`, { headers: UA, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);
  return res.json();
}

const text = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

const server = new McpServer({ name: 'theterminal', version: '0.1.0' });

server.tool(
  'get_quote',
  'Latest price quote for a symbol (Yahoo Finance notation, e.g. AAPL, EURUSD=X, GC=F, BTC-USD, ^GSPC).',
  { symbol: z.string().describe('Yahoo Finance symbol') },
  async ({ symbol }) => {
    const j = await yf(`/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`);
    const meta = j?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error(`No data for ${symbol}`);
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    return text({
      symbol,
      name: meta.longName ?? meta.shortName ?? symbol,
      price: meta.regularMarketPrice,
      previousClose: prev,
      changePct: prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : null,
      currency: meta.currency,
      exchange: meta.exchangeName,
      marketTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    });
  },
);

server.tool(
  'get_history',
  'OHLCV price history for a symbol.',
  {
    symbol: z.string().describe('Yahoo Finance symbol'),
    range: z.enum(['1d', '5d', '1mo', '6mo', '1y', '5y']).default('6mo'),
    interval: z.enum(['5m', '30m', '1d', '1wk']).default('1d'),
  },
  async ({ symbol, range, interval }) => {
    const j = await yf(`/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`);
    const r = j?.chart?.result?.[0];
    if (!r?.timestamp) throw new Error(`No history for ${symbol}`);
    const q = r.indicators.quote[0];
    const bars = r.timestamp
      .map((t, i) => ({
        date: new Date(t * 1000).toISOString(),
        open: q.open?.[i],
        high: q.high?.[i],
        low: q.low?.[i],
        close: q.close?.[i],
        volume: q.volume?.[i],
      }))
      .filter((b) => b.close != null);
    return text({ symbol, range, interval, bars });
  },
);

server.tool(
  'search_symbols',
  'Search instruments by name or ticker fragment.',
  { query: z.string() },
  async ({ query }) => {
    const j = await yf(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`);
    return text(
      (j?.quotes ?? []).map((s) => ({
        symbol: s.symbol,
        name: s.longname ?? s.shortname,
        exchange: s.exchange,
        type: s.quoteType,
      })),
    );
  },
);

server.tool(
  'get_news',
  'Recent market/company news headlines for a query or symbol.',
  { query: z.string().describe('Symbol or topic, e.g. AAPL or "federal reserve"') },
  async ({ query }) => {
    const j = await yf(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=0&newsCount=15`);
    return text(
      (j?.news ?? []).map((n) => ({
        headline: n.title,
        publisher: n.publisher,
        published: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : null,
        url: n.link,
      })),
    );
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
