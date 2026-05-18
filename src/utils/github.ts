// ─────────────────────────────────────────────
// FILE: src/utils/github.ts
// PURPOSE: Handles read/write operations to
// JSON data files hosted on GitHub via
// the GitHub REST API.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GitHub environment variables
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const REPO = import.meta.env.VITE_GITHUB_REPO;
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";
const BASE = "https://api.github.com";

if (!TOKEN || !REPO) {
  console.warn("GitHub env variables missing — using local JSON fallback");
}

/**
 * readJSON()
 * Fetches JSON content from a specified file path in the GitHub repository.
 * Returns the parsed JSON data.
 * Falls back to local /data/users.json if fetch fails or config missing.
 */
export async function readJSON(filePath: string) {
  if (TOKEN && REPO) {
    try {
      const res = await fetch(`${BASE}/repos/${REPO}/contents/data/${filePath}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Data in GitHub contents API is base64 encoded
        return JSON.parse(atob(data.content));
      }
    } catch (error) {
      console.error("GitHub fetch failed, using local fallback:", error);
    }
  }

  // Fallback to local files
  console.log(`Loading fallback local file: /data/${filePath}`);
  const res = await fetch(`/data/${filePath}`);
  return await res.json();
}

/**
 * writeJSON()
 * Updates JSON content in a specified file path in the GitHub repository.
 * Requires the file's current SHA for the update to succeed.
 */
export async function writeJSON(filePath: string, content: any, sha: string) {
  if (!TOKEN || !REPO) throw new Error("GitHub configuration missing");
  
  // Updates file with base64 encoded string
  await fetch(`${BASE}/repos/${REPO}/contents/data/${filePath}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Update ${filePath}`,
      content: btoa(JSON.stringify(content, null, 2)),
      sha,
      branch: BRANCH
    })
  });
}
