/** Case- and whitespace-insensitive key for original report attribution. */
export function normalizeArtistNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '')
}
