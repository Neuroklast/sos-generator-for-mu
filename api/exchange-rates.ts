/**
 * Vercel Edge Function — Exchange Rates Proxy
 *
 * Proxies the Frankfurter API (ECB reference rates) server-side so that
 * browser clients are not affected by CORS restrictions on the upstream API.
 *
 * Route:  GET /api/exchange-rates
 * Route:  GET /api/exchange-rates?start=YYYY-MM&end=YYYY-MM
 *
 * Without query parameters the function returns the latest ECB rates in the
 * standard Frankfurter shape: `{ base, date, rates }`.
 *
 * With `start` and `end` query parameters (ISO month format, e.g. "2023-01")
 * the function fetches the full daily time series for that range, aggregates
 * the daily rates to **monthly averages**, and returns:
 * `{ base: "EUR", rates: { "YYYY-MM": { USD: N, ... }, ... } }`
 *
 * Why monthly averages?
 * The ECB only publishes rates on business days.  Averaging over all
 * available trading days within each calendar month produces the standard
 * monthly reference rate used in accounting for retrospective statements.
 *
 * Why an edge function and not a direct browser fetch?
 * The Frankfurter API does not reliably send the required
 * `Access-Control-Allow-Origin` header from every origin, causing CORS
 * errors in production. Running the fetch on the edge bypasses the
 * same-origin policy entirely because the request originates from
 * Vercel's infrastructure, not the user's browser.
 *
 * Cache strategy:
 * - Latest rates: 1 hour (rates update once per ECB business day).
 * - Historical time-series: 24 hours (historical data never changes once
 *   published, so a long TTL is safe and reduces upstream traffic).
 */

export const config = { runtime: 'edge' }

/** Shape returned by the Frankfurter time-series endpoint. */
interface FrankfurterTimeSeries {
  base: string
  start_date: string
  end_date: string
  rates: Record<string, Record<string, number>>
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const startMonth = url.searchParams.get('start') // e.g. "2023-01"
    const endMonth = url.searchParams.get('end')     // e.g. "2023-12"

    // ── Historical time-series mode ──────────────────────────────────────────
    if (startMonth && endMonth) {
      // Validate format to prevent injection into the upstream URL.
      const MONTH_RE = /^\d{4}-(?:0[1-9]|1[0-2])$/
      if (!MONTH_RE.test(startMonth) || !MONTH_RE.test(endMonth)) {
        return new Response(
          JSON.stringify({ error: 'Invalid date format — expected YYYY-MM' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const startDate = `${startMonth}-01`

      // Compute the last calendar day of the end month.
      const [endYear, endMonthNum] = endMonth.split('-').map(Number)
      const lastDay = new Date(endYear, endMonthNum, 0).getDate()
      const endDate = `${endMonth}-${String(lastDay).padStart(2, '0')}`

      const upstream = await fetch(
        `https://api.frankfurter.app/${startDate}..${endDate}?from=EUR`,
        { signal: AbortSignal.timeout(15000) },
      )

      if (!upstream.ok) {
        return new Response(
          JSON.stringify({ error: `Upstream returned HTTP ${upstream.status}` }),
          { status: upstream.status, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const data = await upstream.json() as FrankfurterTimeSeries

      // Aggregate daily rates to monthly averages.
      // data.rates is keyed by "YYYY-MM-DD"; group by "YYYY-MM".
      const monthlyTotals: Record<string, Record<string, number>> = {}
      const monthlyCounts: Record<string, number> = {}

      for (const [dateString, dailyRates] of Object.entries(data.rates)) {
        const monthKey = dateString.substring(0, 7) // "YYYY-MM"

        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = {}
          monthlyCounts[monthKey] = 0
        }

        monthlyCounts[monthKey]++

        for (const [currency, rate] of Object.entries(dailyRates)) {
          monthlyTotals[monthKey][currency] =
            (monthlyTotals[monthKey][currency] ?? 0) + rate
        }
      }

      // Divide accumulated totals by trading-day count to get the average.
      const monthlyRates: Record<string, Record<string, number>> = {}
      for (const [monthKey, totals] of Object.entries(monthlyTotals)) {
        const count = monthlyCounts[monthKey]
        monthlyRates[monthKey] = {}
        for (const [currency, total] of Object.entries(totals)) {
          monthlyRates[monthKey][currency] = Number((total / count).toFixed(4))
        }
      }

      return new Response(JSON.stringify({ base: 'EUR', rates: monthlyRates }), {
        headers: {
          'Content-Type': 'application/json',
          // Historical rates never change — cache aggressively at the edge.
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
        },
      })
    }

    // ── Latest-rates mode (original behaviour) ───────────────────────────────
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
