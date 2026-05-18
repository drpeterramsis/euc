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
        return JSON.parse(atob(data.content));
      }
    } catch (err) { console.warn(`GitHub API failed for ${fileName}`); }
  }

  try {
    const res = await fetch(`/data/${fileName}?t=${Date.now()}`);
    if (res.ok) return await res.json();
  } catch (err) { console.error(`Local fallback failed for ${fileName}`); }
  return [];
}

export async function writeJSON(fileName: string, data: any): Promise<void> {
  const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const REPO = import.meta.env.VITE_GITHUB_REPO;
  const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

  if (!TOKEN || !REPO) {
    console.warn("No GitHub credentials — write skipped");
    return;
  }

  // Step 1: Get current file SHA (required for GitHub API update)
  const getRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/${fileName}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  let sha = "";
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  // Step 2: Encode content to base64
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

  // Step 3: PUT to GitHub API
  const putRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/${fileName}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Update ${fileName} via EUC Admin Panel`,
        content,
        sha,
        branch: BRANCH,
      }),
    }
  );

  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(`GitHub write failed: ${err.message}`);
  }
}
