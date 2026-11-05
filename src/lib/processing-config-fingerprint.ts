/**
 * Fingerprint the complete accounting settings, not only rule IDs.
 *
 * Feature ownership and split amounts can change in persisted workspace data
 * without an ID change. A stale key prevented the worker from recalculating
 * the artist-specific original-report sheets in that case.
 */
export function processingConfigFingerprint(
  config: unknown,
  exchangeRates: unknown,
  historicalRates: unknown,
): string {
  return JSON.stringify({ config, exchangeRates, historicalRates })
}
