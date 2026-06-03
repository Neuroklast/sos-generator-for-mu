import { describe, it, expect, vi } from 'vitest'
import {
  uploadStatementPdf,
  isValidArtistId,
  isValidPeriod,
  type SosUploadRequest,
} from './sosWebhook'

const VALID_REQUEST: SosUploadRequest = {
  artistId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  filename: 'Statement_Q1-2024_BinaryDivision.pdf',
  period: 'Q1-2024',
  amountEur: 1250.5,
}

const SMALL_PDF = new Blob(['%PDF-1.4 fake content'], { type: 'application/pdf' })

function makeMockFetch(...responses: Array<{ ok: boolean; status?: number; json?: () => Promise<unknown>; text?: () => Promise<string> }>) {
  let callCount = 0
  return vi.fn().mockImplementation(() => {
    const response = responses[callCount++] ?? { ok: true }
    return Promise.resolve({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      json: response.json ?? (() => Promise.resolve({})),
      text: response.text ?? (() => Promise.resolve('')),
    })
  })
}

// ---------------------------------------------------------------------------

describe('uploadStatementPdf', () => {
  it('completes the 3-step flow and returns { success: true }', async () => {
    const mockFetch = makeMockFetch(
      // Step 1: presign
      { ok: true, json: async () => ({ uploadUrl: 'https://r2.example.com/upload', r2Key: 'statements/key.pdf' }) },
      // Step 2: R2 PUT
      { ok: true },
      // Step 3: confirm
      { ok: true, json: async () => ({ statementId: 'stmt-123' }) },
    )

    const result = await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'test-api-key',
      mockFetch as unknown as typeof fetch,
    )

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('sends correct Authorization header in step 1 and 3', async () => {
    const mockFetch = makeMockFetch(
      { ok: true, json: async () => ({ uploadUrl: 'https://r2.example.com/upload', r2Key: 'key.pdf' }) },
      { ok: true },
      { ok: true },
    )

    await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'secret-key-123',
      mockFetch as unknown as typeof fetch,
    )

    const calls = mockFetch.mock.calls
    expect((calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer ' + 'secret-key-123' })
    expect((calls[2][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer ' + 'secret-key-123' })
  })

  it('appends /confirm to webhookUrl without trailing slash', async () => {
    const mockFetch = makeMockFetch(
      { ok: true, json: async () => ({ uploadUrl: 'https://r2.example.com/upload', r2Key: 'key.pdf' }) },
      { ok: true },
      { ok: true },
    )

    await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      mockFetch as unknown as typeof fetch,
    )

    const confirmCallUrl = mockFetch.mock.calls[2][0] as string
    expect(confirmCallUrl).toBe('https://darktunes.com/api/webhooks/sos/confirm')
  })

  it('appends confirm to webhookUrl with trailing slash', async () => {
    const mockFetch = makeMockFetch(
      { ok: true, json: async () => ({ uploadUrl: 'https://r2.example.com/upload', r2Key: 'key.pdf' }) },
      { ok: true },
      { ok: true },
    )

    await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos/',
      'key',
      mockFetch as unknown as typeof fetch,
    )

    const confirmCallUrl = mockFetch.mock.calls[2][0] as string
    expect(confirmCallUrl).toBe('https://darktunes.com/api/webhooks/sos/confirm')
  })

  it('returns error when artistId is not a valid UUID', async () => {
    const result = await uploadStatementPdf(
      { ...VALID_REQUEST, artistId: 'not-a-uuid' },
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      vi.fn() as unknown as typeof fetch,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/artistId/)
  })

  it('returns error when period format is invalid', async () => {
    const result = await uploadStatementPdf(
      { ...VALID_REQUEST, period: '2024' },
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      vi.fn() as unknown as typeof fetch,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/period/)
  })

  it('returns error when PDF exceeds 10 MB', async () => {
    const bigPdf = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'application/pdf' })

    const result = await uploadStatementPdf(
      VALID_REQUEST,
      bigPdf,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      vi.fn() as unknown as typeof fetch,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/10 MB limit/)
  })

  it('returns error when step 1 (presign) returns non-ok', async () => {
    const mockFetch = makeMockFetch(
      { ok: false, status: 401, text: async () => 'Unauthorized' },
    )

    const result = await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'bad-key',
      mockFetch as unknown as typeof fetch,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/401/)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns error when step 1 returns payload without uploadUrl', async () => {
    const mockFetch = makeMockFetch(
      { ok: true, json: async () => ({ r2Key: 'key.pdf' }) },
    )

    const result = await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      mockFetch as unknown as typeof fetch,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/uploadUrl/)
  })

  it('returns error when R2 upload (step 2) fails', async () => {
    const mockFetch = makeMockFetch(
      { ok: true, json: async () => ({ uploadUrl: 'https://r2.example.com/upload', r2Key: 'key.pdf' }) },
      { ok: false, status: 403 },
    )

    const result = await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      mockFetch as unknown as typeof fetch,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/R2 upload failed/)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns error when confirm (step 3) fails', async () => {
    const mockFetch = makeMockFetch(
      { ok: true, json: async () => ({ uploadUrl: 'https://r2.example.com/upload', r2Key: 'key.pdf' }) },
      { ok: true },
      { ok: false, status: 500, text: async () => 'Internal server error' },
    )

    const result = await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      mockFetch as unknown as typeof fetch,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/confirmation failed/)
  })

  it('handles network errors gracefully in step 1', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('fetch failed'))

    const result = await uploadStatementPdf(
      VALID_REQUEST,
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      mockFetch as unknown as typeof fetch,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Network error/)
  })

  it('accepts YYYY-MM period format', async () => {
    const mockFetch = makeMockFetch(
      { ok: true, json: async () => ({ uploadUrl: 'https://r2.example.com/upload', r2Key: 'key.pdf' }) },
      { ok: true },
      { ok: true },
    )

    const result = await uploadStatementPdf(
      { ...VALID_REQUEST, period: '2024-03' },
      SMALL_PDF,
      'https://darktunes.com/api/webhooks/sos',
      'key',
      mockFetch as unknown as typeof fetch,
    )

    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------

describe('isValidArtistId', () => {
  it('accepts valid v4 UUID', () => {
    expect(isValidArtistId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true)
  })

  it('rejects plain strings', () => {
    expect(isValidArtistId('not-a-uuid')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidArtistId('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------

describe('isValidPeriod', () => {
  it('accepts YYYY-MM format', () => {
    expect(isValidPeriod('2024-03')).toBe(true)
  })

  it('accepts Q{N}-YYYY format', () => {
    expect(isValidPeriod('Q1-2024')).toBe(true)
    expect(isValidPeriod('Q4-2023')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(isValidPeriod('2024')).toBe(false)
    expect(isValidPeriod('March 2024')).toBe(false)
    expect(isValidPeriod('')).toBe(false)
    expect(isValidPeriod('Q5-2024')).toBe(false)
  })
})
