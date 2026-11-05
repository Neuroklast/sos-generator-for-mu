import { describe, expect, it } from 'vitest'
import { processingConfigFingerprint } from '../processing-config-fingerprint'

const base = {
  compilationFilters: [],
  artistMappings: [],
  splitFees: [{ artist: 'Extize', percentage: 70 }],
  manualRevenues: [],
  labelArtists: [{ id: 'a', name: 'Extize' }, { id: 'b', name: 'Agnis' }],
  trackRevenueAssignments: [{
    id: 'satisfaction',
    trackTitle: 'Satisfaction',
    owners: [
      { artist: 'Extize', percentage: 100 },
      { artist: 'Agnis', percentage: 0 },
    ],
  }],
}

describe('SOS worker configuration fingerprint', () => {
  it('changes when existing featuring percentages change without changing rule IDs', () => {
    const original = processingConfigFingerprint(base, { USD: 1.1 }, null)
    const modified = {
      ...base,
      trackRevenueAssignments: [{
        ...base.trackRevenueAssignments[0],
        owners: [
          { artist: 'Extize', percentage: 60 },
          { artist: 'Agnis', percentage: 40 },
        ],
      }],
    }
    expect(processingConfigFingerprint(modified, { USD: 1.1 }, null)).not.toBe(original)
  })

  it('changes when the compilation identifier, a split, or a currency rate changes', () => {
    const original = processingConfigFingerprint(base, { USD: 1.1 }, null)
    expect(processingConfigFingerprint({
      ...base, compilationFilters: [{ id: '1', type: 'ean', identifier: '123', label: 'Test' }],
    }, { USD: 1.1 }, null)).not.toBe(original)
    expect(processingConfigFingerprint({
      ...base, splitFees: [{ artist: 'Extize', percentage: 80 }],
    }, { USD: 1.1 }, null)).not.toBe(original)
    expect(processingConfigFingerprint(base, { USD: 1.2 }, null)).not.toBe(original)
  })

  it('stays stable for the same persisted configuration values', () => {
    expect(processingConfigFingerprint(base, {}, null))
      .toBe(processingConfigFingerprint(JSON.parse(JSON.stringify(base)), {}, null))
  })
})
