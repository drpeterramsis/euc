// ─────────────────────────────────────────────
// FILE: src/utils/github.ts
// PURPOSE: Handles read/write operations to
// JSON data files hosted on GitHub via
// the GitHub REST API, with localStorage caching.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * readJSON()
 * Fetches JSON content from a specified file path in the GitHub repository.
 * Returns the parsed JSON data from cache if available and fresh.
 * Falls back to GitHub API, then to local fallback /data/ folder if GitHub fails.
 */
export async function readJSON(fileName: string): Promise<any> {
  const cacheKey = `euc_${fileName.replace(".json","")}_cache`;
  const cacheTimeKey = `${cacheKey}_time`;

  // Check cache first
  const cached = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(cacheTimeKey);

  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < CACHE_DURATION) {
      console.log(`Using cached data for ${fileName}`);
      return JSON.parse(cached);
    }
  }

  // Try GitHub API first
  const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const REPO = import.meta.env.VITE_GITHUB_REPO;
  const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

  if (TOKEN && REPO) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/contents/data/${fileName}?ref=${BRANCH}`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(atob(data.content));
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
        return parsed;
      }
    } catch (err) {
      console.warn(`GitHub API failed for ${fileName}, using local fallback`);
    }
  }

  // Fallback to local /data/ folder
  try {
    const res = await fetch(`/data/${fileName}`);
    if (res.ok) {
      const parsed = await res.json();
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
      return parsed;
    }
  } catch (err) {
    console.error(`Local fallback also failed for ${fileName}`);
  }

  return [];
}

/**
 * writeJSON()
 * Updates JSON content in a specified file path in the GitHub repository.
 * Requires the file's current SHA for the update to succeed.
 */
export async function writeJSON(filePath: string, content: any, sha: string) {
  const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const REPO = import.meta.env.VITE_GITHUB_REPO;
  const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";
  
  if (!TOKEN || !REPO) throw new Error("GitHub configuration missing");
  
  // Updates file with base64 encoded string
  await fetch(`https://api.github.com/repos/${REPO}/contents/data/${filePath}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Update ${filePath}`,
      content: btoa(JSON.stringify(content, null, 2)),
      sha,
      branch: BRANCH
    })
  });
  
  // Clear cache after successful write
  localStorage.removeItem(`euc_${filePath.replace(".json","")}_cache`);
  localStorage.removeItem(`euc_${filePath.replace(".json","")}_cache_time`);
}
