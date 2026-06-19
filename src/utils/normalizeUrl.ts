/**
 * Normalizes a URL by trimming whitespace and automatically prefixing "https://"
 * if it does not already start with "http://" or "https://".
 * Empty values are preserved.
 */
export function normalizeUrl(url: string): string {
  if (url === undefined || url === null) return "";
  const trimmed = url.trim();
  if (trimmed === "") return "";
  if (trimmed.toLowerCase().startsWith("http://") || trimmed.toLowerCase().startsWith("https://")) {
    return trimmed;
  }
  return "https://" + trimmed;
}
