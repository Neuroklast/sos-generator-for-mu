/**
 * Currency conversion utilities using the Frankfurter API (ECB reference rates).
 *
 * The API returns rates relative to EUR as the base currency:
 *   { "base": "EUR", "rates": { "USD": 1.05, "GBP": 0.85, ... } }
 *
 * To convert X units of a foreign currency to EUR:
 *   eur_amount = foreign_amount / rates[currency]
 */

export type ExchangeRates = Record<string, number>

/**
 * Static fallback rates used when the Frankfurter API is unavailable.
 * These are approximate values and should only be used as a last resort.
 */
const FALLBACK_RATES: ExchangeRates = {
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.96,
  PLN: 4.25,
  CZK: 25.2,
  SEK: 11.5,
  DKK: 7.46,
  NOK: 11.8,
  HUF: 395.0,
  RON: 4.97,
  BGN: 1.96,
  HRK: 7.53,
  CAD: 1.46,
  AUD: 1.65,
  NZD: 1.80,
  JPY: 162.0,
  CNY: 7.82,
  BRL: 5.85,
  MXN: 18.5,
  RUB: 99.0,
  INR: 90.0,
  KRW: 1470.0,
  ZAR: 20.5,
  TRY: 35.0,
}

/**
 * Fetches current exchange rates from the Frankfurter API.
 * Falls back to static approximate rates on any network or parse error.
 *
 * @returns A map of currency code → EUR-base rate (1 EUR = N units of that currency).
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR', {
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      console.warn(`[currency] Frankfurter API returned ${response.status} — using fallback rates`)
      return FALLBACK_RATES
    }
    const data = await response.json() as { base: string; rates: Record<string, number> }
    if (!data?.rates || typeof data.rates !== 'object') {
      console.warn('[currency] Unexpected Frankfurter API response shape — using fallback rates')
      return FALLBACK_RATES
    }
    return data.rates
  } catch (err) {
    console.warn('[currency] Failed to fetch exchange rates:', err instanceof Error ? err.message : err, '— using fallback rates')
    return FALLBACK_RATES
  }
}

/**
 * Converts an amount in a foreign currency to EUR.
 *
 * @param amount   - Amount in the source currency.
 * @param currency - ISO 4217 currency code (e.g. "USD", "GBP").
 * @param rates    - Exchange rates map (1 EUR = N units of currency).
 * @returns The EUR-equivalent amount, or the original amount if the currency
 *          is already EUR or the rate is unavailable.
 */
export function convertToEur(amount: number, currency: string, rates: ExchangeRates): number {
  const code = currency.trim().toUpperCase()
  if (!code || code === 'EUR') return amount
  const rate = rates[code]
  if (!rate || rate <= 0) {
    // Rate unavailable — return 0 to avoid mixing currencies in EUR totals.
    // The missing rate will have been warned about at fetch time.
    console.warn(`[currency] No exchange rate for ${code} — amount excluded from EUR totals`)
    return 0
  }
  return amount / rate
}
