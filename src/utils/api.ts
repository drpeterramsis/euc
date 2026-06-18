/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ─────────────────────────────────────────────
// FILE: src/utils/api.ts
// PURPOSE: Central helper for building API paths without extension mappings.
// ─────────────────────────────────────────────

export function apiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  // Ensure the endpoint has no leading flash or .ts/.js extensions
  const cleanEndpoint = endpoint
    .replace(/^\//, "")
    .replace(/\.(ts|js)$/, "");

  const url = `/api/${cleanEndpoint}`;

  if (!params) {
    return url;
  }

  const queryParts = Object.entries(params)
    .filter(([_, val]) => val !== undefined && val !== null)
    .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);

  return queryParts.length > 0 ? `${url}?${queryParts.join("&")}` : url;
}
