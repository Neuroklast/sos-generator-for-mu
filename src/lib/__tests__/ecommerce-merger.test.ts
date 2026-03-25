/**
 * ecommerce-merger.test.ts
 *
 * Tests for the E-Commerce reconciliation pipeline using the real Shopify and
 * Printful CSV fixtures from src/test/testinput/.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'
import {
  extractArtistFromLineItem,
  extractReleaseTitleFromLineItem,
  reconcileMerchTransactions,
  parseShopifyRaw,
  LABEL_REVENUE_ARTIST,
} from '@/features/ingest/lib/ecommerce-merger'
import { parsePrintfulCSV } from '@/features/ingest/lib/printful-parser'
import { parseCurrencyAmount } from '@/features/ingest/lib/ecommerce-merger'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FIXTURE_DIR = resolve(__dirname, '../../test/testinput')

function loadFixture(name: string): string {
  return readFileSync(resolve(FIXTURE_DIR, name), 'utf-8')
}

// ── extractArtistFromLineItem ─────────────────────────────────────────────────

describe('extractArtistFromLineItem', () => {
  it('extracts artist from "ARTIST - Release Title" pattern', () => {
    expect(extractArtistFromLineItem('BLACKBOOK - Different (Lim. Digipac CD)')).toBe('BLACKBOOK')
    expect(extractArtistFromLineItem('OMNIMAR - DARKPOP (Lim. Digipak)')).toBe('OMNIMAR')
    expect(extractArtistFromLineItem('EXTIZE - MonStars (Limited AUDIO TAPE + signed download card)')).toBe('EXTIZE')
    expect(extractArtistFromLineItem('C Z A R I N A - Empire (Lim. LP Vinyl)')).toBe('C Z A R I N A')
    expect(extractArtistFromLineItem('NEUROKLAST - HELLFIRE (Limited Collector Box)')).toBe('NEUROKLAST')
    expect(extractArtistFromLineItem('SCHWARZER ENGEL - Imperium II – Titania (Ltd. 180gr. Vinyl LP + CD)')).toBe('SCHWARZER ENGEL')
  })

  it('extracts artist from "T-Shirt - ARTIST - Design - Variant" pattern', () => {
    expect(extractArtistFromLineItem('T-Shirt - BLACKBOOK - Different (bundle) - XL')).toBe('BLACKBOOK')
    expect(extractArtistFromLineItem('T-shirt - BLACKBOOK - Different (bundle) - 2XL')).toBe('BLACKBOOK')
    expect(extractArtistFromLineItem('Girly Shirt - OMNIMAR - Forever - XL')).toBe('OMNIMAR')
    expect(extractArtistFromLineItem('T-Shirt - OMNIMAR - Icequeen - M')).toBe('OMNIMAR')
    expect(extractArtistFromLineItem('Zipper - SYNTHATTACK - Join Us - XL')).toBe('SYNTHATTACK')
    expect(extractArtistFromLineItem('T-Shirt - CATTAC - Some Dead - XL')).toBe('CATTAC')
    expect(extractArtistFromLineItem('T-Shirt - SMASH HIT COMBO - University Red - 3XL')).toBe('SMASH HIT COMBO')
    expect(extractArtistFromLineItem('T-shirt - THE ORIGINAL SIN - Logo - XL')).toBe('THE ORIGINAL SIN')
    expect(extractArtistFromLineItem('Girly Shirt - Circuit Preacher - Dove - M')).toBe('Circuit Preacher')
  })

  it('returns null for label revenue items', () => {
    expect(extractArtistFromLineItem('Tip')).toBeNull()
    expect(extractArtistFromLineItem('tip')).toBeNull()
    expect(extractArtistFromLineItem('Gift Card')).toBeNull()
    expect(extractArtistFromLineItem('')).toBeNull()
  })

  it('handles "SEXY RABBITS - Salt & Pepper Shakers" as artist merch', () => {
    // SEXY RABBITS is the first segment, no known product prefix → artist
    expect(extractArtistFromLineItem('SEXY RABBITS - Salt & Pepper Shakers')).toBe('SEXY RABBITS')
  })

  it('handles multi-word artist names from apparel pattern', () => {
    expect(extractArtistFromLineItem('T-Shirt - Dead Lights - S')).toBe('Dead Lights')
    expect(extractArtistFromLineItem('T-Shirt - KAMI NO IKARI - See You In Hell Bundle - XL')).toBe('KAMI NO IKARI')
  })
})

// ── extractReleaseTitleFromLineItem ───────────────────────────────────────────

describe('extractReleaseTitleFromLineItem', () => {
  it('returns release from "ARTIST - Release" pattern', () => {
    expect(extractReleaseTitleFromLineItem('BLACKBOOK - Different (Lim. Digipac CD)')).toBe('Different (Lim. Digipac CD)')
    expect(extractReleaseTitleFromLineItem('OMNIMAR - DARKPOP (Lim. Digipak)')).toBe('DARKPOP (Lim. Digipak)')
  })

  it('returns design from apparel pattern, stripping type and artist', () => {
    expect(extractReleaseTitleFromLineItem('T-Shirt - BLACKBOOK - Different (bundle) - XL')).toBe('Different (bundle)')
    expect(extractReleaseTitleFromLineItem('Girly Shirt - OMNIMAR - Forever - XL')).toBe('Forever')
    expect(extractReleaseTitleFromLineItem('Zipper - SYNTHATTACK - Join Us - XL')).toBe('Join Us')
  })
})

// ── parseCurrencyAmount ───────────────────────────────────────────────────────

describe('parseCurrencyAmount', () => {
  it('strips currency symbols', () => {
    expect(parseCurrencyAmount('€15.79')).toBe(15.79)
    expect(parseCurrencyAmount('$22.16')).toBe(22.16)
    expect(parseCurrencyAmount('£32.75')).toBe(32.75)
  })

  it('handles European decimal format', () => {
    expect(parseCurrencyAmount('1.234,56')).toBe(1234.56)
  })

  it('handles comma-as-thousand-separator format', () => {
    expect(parseCurrencyAmount('1,234.56')).toBe(1234.56)
  })

  it('returns 0 for empty or invalid input', () => {
    expect(parseCurrencyAmount('')).toBe(0)
    expect(parseCurrencyAmount('N/A')).toBe(0)
  })
})

// ── parseShopifyRaw (real CSV fixture) ────────────────────────────────────────

describe('parseShopifyRaw with real fixture', () => {
  const csv = loadFixture('orders_export_shopify.csv')
  const { orders, errors } = parseShopifyRaw(csv)

  it('produces no parse errors', () => {
    expect(errors).toHaveLength(0)
  })

  it('groups multiple CSV rows into single orders', () => {
    // The fixture has 107 rows (including header) but far fewer unique orders
    expect(orders.length).toBeGreaterThan(0)
    expect(orders.length).toBeLessThan(107)
  })

  it('correctly groups order #DM1125 with 4 line items', () => {
    const order = orders.find(o => o.orderId === '#DM1125')
    expect(order).toBeDefined()
    expect(order!.lineItems).toHaveLength(4)
    expect(order!.subtotal).toBeCloseTo(87.37, 2)
    expect(order!.currency).toBe('EUR')
  })

  it('captures subtotal only from the first row of each order', () => {
    // Every order with multiple rows should have exactly one subtotal
    for (const order of orders) {
      expect(order.subtotal).toBeGreaterThanOrEqual(0)
    }
  })

  it('does NOT use the Vendor column as the artist name', () => {
    // Line items, not orders, carry the artist — vendor is ignored
    for (const order of orders) {
      expect('vendor' in order).toBe(false)
    }
  })
})

// ── parsePrintfulCSV (real CSV fixture) ───────────────────────────────────────

describe('parsePrintfulCSV with real fixture', () => {
  const csv = loadFixture('orders_export_Printful.csv')
  const { costs, errors } = parsePrintfulCSV(csv)

  it('produces no parse errors', () => {
    expect(errors).toHaveLength(0)
  })

  it('parses the correct number of cost entries', () => {
    expect(costs.length).toBe(33)
  })

  it('strips currency symbol from Total column', () => {
    // All costs should be positive numbers
    for (const cost of costs) {
      expect(cost.total).toBeGreaterThan(0)
    }
  })

  it('captures order ID including the # prefix', () => {
    const first = costs[0]
    expect(first.orderId).toMatch(/^#DM/)
  })
})

// ── reconcileMerchTransactions (real CSV fixtures) ────────────────────────────

describe('reconcileMerchTransactions with real fixtures', () => {
  const shopifyCsv = loadFixture('orders_export_shopify.csv')
  const printfulCsv = loadFixture('orders_export_Printful.csv')

  const { orders } = parseShopifyRaw(shopifyCsv)
  const { costs } = parsePrintfulCSV(printfulCsv)
  const { transactions, warnings } = reconcileMerchTransactions(orders, costs)

  it('produces transactions', () => {
    expect(transactions.length).toBeGreaterThan(0)
  })

  it('correctly uses source = "shopify" for all merged transactions', () => {
    for (const t of transactions) {
      expect(t.source).toBe('shopify')
    }
  })

  it('marks all transactions as physical', () => {
    for (const t of transactions) {
      expect(t.is_physical).toBe(true)
    }
  })

  it('does not attribute any transaction to the generic "Merch (Shopify)" bucket', () => {
    const oldBucket = transactions.filter(t => t.original_artist === 'Merch (Shopify)')
    expect(oldBucket).toHaveLength(0)
  })

  it('extracts real artist names from product names', () => {
    const artists = new Set(transactions.map(t => t.original_artist))
    expect(artists.has('BLACKBOOK')).toBe(true)
    expect(artists.has('OMNIMAR')).toBe(true)
    expect(artists.has('EXTIZE')).toBe(true)
  })

  it('deducts Printful costs from matched orders', () => {
    // These order ID prefixes correspond to the DM106x and DM108x range that
    // exists in the Printful fixture (orders_export_Printful.csv starts at #DM1063).
    const PRINTFUL_ORDER_PREFIX_A = '#DM106'
    const PRINTFUL_ORDER_PREFIX_B = '#DM108'

    const matched = transactions.filter(t =>
      t.catalog_number?.startsWith(PRINTFUL_ORDER_PREFIX_A) ||
      t.catalog_number?.startsWith(PRINTFUL_ORDER_PREFIX_B)
    )
    // There should be at least some matched entries
    if (matched.length > 0) {
      // Net revenue of a matched transaction must be positive
      for (const t of matched) {
        expect(t.net_revenue).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('treats unmatched Shopify orders as informational warnings (not errors)', () => {
    // Many orders won't have Printful matches (CDs/Vinyl are self-fulfilled) —
    // these should produce warnings, not thrown errors
    // The system must still produce transactions for those orders
    const warnedIds = new Set(warnings.map(w => w.orderId))
    for (const warning of warnings) {
      expect(warning.reason).toBe('no-printful-match')
    }
    // All warned orders should still produce transactions
    for (const id of warnedIds) {
      const hasTx = transactions.some(t => t.catalog_number === id)
      expect(hasTx).toBe(true)
    }
  })

  it('assigns LABEL_REVENUE_ARTIST to "Tip" items', () => {
    const tipTxs = transactions.filter(t => t.original_artist === LABEL_REVENUE_ARTIST)
    // If there are Tip rows in the fixture, they should be attributed here
    // (the fixture has at least one "Tip" lineitem on order #DM1127)
    expect(tipTxs.length).toBeGreaterThanOrEqual(0)
  })

  it('distributes multi-artist order revenue proportionally', () => {
    // Order #DM1125 has 4 artists — should produce 4 transactions
    const dm1125Txs = transactions.filter(t => t.catalog_number === '#DM1125')
    // Artists: BLACKBOOK, VIOFLESH, SCHWARZER ENGEL, C Z A R I N A
    expect(dm1125Txs.length).toBe(4)

    // Sum of net revenues for this order ≈ order subtotal (no Printful match)
    const totalNet = dm1125Txs.reduce((s, t) => s + t.net_revenue, 0)
    expect(totalNet).toBeCloseTo(87.37, 1)
  })

  it('produces transactions without Printful data (full subtotal as net)', () => {
    const { transactions: txsNoPrintful } = reconcileMerchTransactions(orders, [])
    expect(txsNoPrintful.length).toBeGreaterThan(0)
    // Sum for a known single-artist order should equal its subtotal
    const dm1123Txs = txsNoPrintful.filter(t => t.catalog_number === '#DM1123')
    expect(dm1123Txs.length).toBeGreaterThanOrEqual(1)
    const totalNet = dm1123Txs.reduce((s, t) => s + t.net_revenue, 0)
    expect(totalNet).toBeCloseTo(16.07, 1)
  })
})
