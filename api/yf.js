// Vercel serverless proxy for the Yahoo Finance connector.
// The SPA calls /yf/<path>?<query>; vercel.json rewrites that here.
// This is what makes a Vercel deployment run in LIVE data mode.

export default async function handler(req, res) {
  const { path = '', ...rest } = req.query;
  const qs = new URLSearchParams(rest).toString();
  const url = `https://query1.finance.yahoo.com/${path}${qs ? `?${qs}` : ''}`;
  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' },
      signal: AbortSignal.timeout(8000),
    });
    res.status(upstream.status);
    res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json');
    res.setHeader('cache-control', 's-maxage=10, stale-while-revalidate=60');
    res.send(await upstream.text());
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
