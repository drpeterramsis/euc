/// <reference types="vite/client" />
// ─────────────────────────────────────────────
// FILE: src/utils/github.ts
// PURPOSE: Handles read/write operations with caching.
// ─────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function readJSON(fileName: string): Promise<any[]> {
  const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const REPO = import.meta.env.VITE_GITHUB_REPO;
  const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

  if (TOKEN && REPO) {
    try {
      const res = await fetchWithTimeout(`https://api.github.com/repos/${REPO}/contents/data/${fileName}?ref=${BRANCH}&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github.v3+json" },
      });
      if (res.ok) {
        const data = await res.json();
        const b64 = data.content;
        const bin = atob(b64);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        const text = new TextDecoder("utf-8").decode(bytes);
        return JSON.parse(text);
      }
    } catch (err) { console.warn(`GitHub API failed for ${fileName}`); }
  }

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/${fileName}?t=${Date.now()}`);
    if (res.ok) {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return [];
      }
    }
  } catch (err) { 
    // silent fallback
  }
  return [];
}

/**
 * Robustly updates a file on GitHub contents API.
 * 1) GET file SHA with cache-buster
 * 2) PUT with new content and current SHA
 * 3) If 409/422 conflict, re-fetch SHA with a fresh cache-buster and retry once
 */
export async function githubUpdateFile(
  path: string,
  content: string,
  commitMessage: string
): Promise<void> {
  const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const REPO = import.meta.env.VITE_GITHUB_REPO;
  const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

  if (!TOKEN || !REPO) {
    console.warn("No GitHub credentials — write skipped");
    throw new Error("No VITE_GITHUB_TOKEN or VITE_GITHUB_REPO credentials configured.");
  }

  // Get current file SHA (with anti-cache query param)
  const getSha = async (): Promise<string> => {
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (getRes.ok) {
        const fileData = await getRes.json();
        return fileData.sha || "";
      }
    } catch (e) {
      console.warn(`Failed to retrieve file SHA for ${path}:`, e);
    }
    return "";
  };

  let sha = await getSha();
  const base64Content = btoa(unescape(encodeURIComponent(content)));

  const doPut = async (currentSha: string) => {
    const putRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          sha: currentSha || undefined,
          branch: BRANCH,
        }),
      }
    );
    return putRes;
  };

  let putRes = await doPut(sha);

  // If SHA was stale (409) or validation issue (422), catch and retry ONCE with a fresh SHA query
  if (!putRes.ok && (putRes.status === 409 || putRes.status === 422)) {
    console.warn(`Initial GitHub write returned ${putRes.status} for ${path}, retrying with a fresh SHA fetch...`);
    sha = await getSha();
    putRes = await doPut(sha);
  }

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({ message: putRes.statusText }));
    throw new Error(`GitHub write failed: ${err.message || "Unknown Git API error"}`);
  }
}

/**
 * Wrapper function for backwards compatibility with pre-existing modules.
 */
export async function writeJSON(fileName: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await githubUpdateFile(`data/${fileName}`, content, `Update ${fileName} via EUC Admin Panel`);
}
