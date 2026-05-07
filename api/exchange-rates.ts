/**
 * Vercel Edge Function — Exchange Rates Proxy
 *
 * Proxies the Frankfurter API (ECB reference rates) server-side so that
 * browser clients are not affected by CORS restrictions on the upstream API.
 *
 * Route:  GET /api/exchange-rates
 * Upstream: https://api.frankfurter.app/latest?from=EUR
 *
 * Why an edge function and not a direct browser fetch?
 * The Frankfurter API does not reliably send the required
 * `Access-Control-Allow-Origin` header from every origin, causing CORS
 * errors in production. Running the fetch on the edge bypasses the
 * same-origin policy entirely because the request originates from
 * Vercel's infrastructure, not the user's browser.
 *
 * Cache strategy: responses are cached for 1 hour (3600 s). Exchange
 * rates update once per ECB business day, so a 1-hour TTL is a
 * reasonable balance between freshness and upstream request volume.
 */

export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  try {
    const upstream = await fetch('https://api.frankfurter.app/latest?from=EUR', {
      signal: AbortSignal.timeout(8000),
    })

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream returned HTTP ${upstream.status}` }),
        { status: upstream.status, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const data: unknown = await upstream.json()
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        // Cache at the CDN edge for 1 hour; browsers may revalidate every 5 min.
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('[exchange-rates] Failed to fetch upstream:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch exchange rates from upstream' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
