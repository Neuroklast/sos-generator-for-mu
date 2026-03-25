/**
 * Shopify Order CSV Parser
 *
 * Parses Shopify export CSVs (orders) and maps line items to SalesTransaction
 * objects so they can flow through the existing revenue pipeline.
 *
 * Expected Shopify CSV columns (case-insensitive matching):
 *   Name / Order / Order ID / order_name  → orderId
 *   Created at / Date / Paid at           → sales_month
 *   Lineitem name / Product / Title        → release_title (product name)
 *   Lineitem sku / SKU                     → isrc used as sku
 *   Lineitem quantity / Quantity           → quantity
 *   Lineitem price / Price / Subtotal      → net_revenue (per-unit price)
 *   Currency                               → currency
 *
 * Artists are not present in Shopify exports; all merch transactions are
 * attributed to a synthetic "Merch" artist so they appear as a separate
 * revenue stream in the dashboard.
 */

import type { SalesTransaction } from './csv-parser'
import { normalizeDateToMonth } from './streaming-csv-parser'
import Papa from 'papaparse'

export interface ShopifyParseResult {
  transactions: SalesTransaction[]
  errors: Array<{ row: number; reason: string; data: string }>
}

/** Normalise a header string for comparison. */
function normalise(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Returns the value for the first header key (case-insensitive / punctuation-stripped)
 * that matches one of the provided candidates.
 */
function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const [h, v] of Object.entries(row)) {
    if (candidates.some(c => normalise(h) === normalise(c))) return v ?? ''
  }
  return ''
}

function parseNumber(raw: string): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[^\d.,-]/g, '').trim()
  // European format: "1.234,56"
  if (/\d\.\d{3},/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0
  }
  // Standard: "1,234.56"
  return parseFloat(cleaned.replace(/,/g, '')) || 0
}

/**
 * Parses a Shopify orders CSV export and returns SalesTransaction objects
 * attributed to the "Merch (Shopify)" artist.
 */
export function parseShopifyCSV(content: string): ShopifyParseResult {
  const stripped = content.startsWith('\uFEFF') ? content.slice(1) : content

  const parsed = Papa.parse<Record<string, string>>(stripped.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  const transactions: SalesTransaction[] = []
  const errors: ShopifyParseResult['errors'] = []

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i]

    try {
      const rawDate = findCol(row, ['Created at', 'Date', 'Paid at', 'created_at', 'paid_at'])
      const salesMonth = normalizeDateToMonth(rawDate) || 'Unknown'

      const productName = findCol(row, [
        'Lineitem name', 'lineitem_name', 'Product', 'Title', 'Name', 'item name',
      ]).trim()

      if (!productName) {
        // Skip rows without a product name (e.g. summary / shipping rows)
        continue
      }

      const sku = findCol(row, ['Lineitem sku', 'lineitem_sku', 'SKU', 'sku']).trim()
      const rawQty = findCol(row, ['Lineitem quantity', 'lineitem_quantity', 'Quantity', 'quantity'])
      const quantity = parseNumber(rawQty) || 1
      const rawPrice = findCol(row, [
        'Lineitem price', 'lineitem_price', 'Price', 'Subtotal', 'Total', 'Item Price',
      ])
      const unitPrice = parseNumber(rawPrice)
      const netRevenue = unitPrice * quantity

      const currency = findCol(row, ['Currency', 'currency', 'Paid Currency']).toUpperCase() || 'EUR'
      const orderId = findCol(row, ['Name', 'Order', 'Order ID', 'order_name', 'id']).trim()

      transactions.push({
        id: crypto.randomUUID(),
        source: 'shopify',
        sales_month: salesMonth,
        platform: 'Shopify',
        country: findCol(row, ['Billing Country', 'billing_address_country', 'Shipping Country', 'Country']).trim() || 'Unknown',
        main_artist: 'Merch (Shopify)',
        original_artist: 'Merch (Shopify)',
        release_title: orderId ? `${productName} [Order ${orderId}]` : productName,
        track_title: productName,
        upc_ean: '',
        isrc: sku,
        catalog_number: sku,
        quantity,
        net_revenue: netRevenue,
        currency,
        is_physical: true,
      })
    } catch (err) {
      errors.push({
        row: i + 2,
        reason: err instanceof Error ? err.message : 'Unknown error',
        data: JSON.stringify(row),
      })
    }
  }

  return { transactions, errors }
}
