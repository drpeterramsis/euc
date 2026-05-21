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
 * ALWAYS fetches the latest SHA right before writing.
 * Retries once on 409/422 conflicts.
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

  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;

  // ALWAYS get fresh SHA right before writing
  let sha: string | undefined;
  const getRes = await fetch(`${url}?ref=${BRANCH}&t=${Date.now()}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  if (getRes.ok) {
    const getData = await getRes.json();
    sha = getData.sha;
  }

  const base64Content = btoa(unescape(encodeURIComponent(content)));
  const body: any = {
    message: commitMessage,
    content: base64Content,
    branch: BRANCH
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({ message: putRes.statusText }));
    // If SHA conflict — retry once with fresh SHA
    if (putRes.status === 409 || putRes.status === 422) {
      console.warn(`Initial GitHub write returned ${putRes.status} for ${path}, retrying with a fresh SHA fetch...`);
      const retryGet = await fetch(`${url}?ref=${BRANCH}&t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      if (retryGet.ok) {
        const retryData = await retryGet.json();
        body.sha = retryData.sha;
        const retryPut = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify(body),
        });
        if (!retryPut.ok) {
          throw new Error(`GitHub write failed after retry: ${path}`);
        }
        return;
      }
    }
    throw new Error(`GitHub write failed: ${err.message || "Unknown Git API error"}`);
  }
}

/**
 * Uploads a picture as a separate raw file in the repository (not base64 inside JSON).
 * Path: data/photos/{albumId}/{fileName}
 */
export async function githubUploadPhoto(
  albumId: string,
  fileName: string,
  base64Content: string, // raw base64, no data:image prefix
  commitMessage: string
): Promise<string> {
  const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const REPO = import.meta.env.VITE_GITHUB_REPO;
  const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

  if (!TOKEN || !REPO) {
    console.warn("No GitHub credentials — photo upload skipped");
    throw new Error("No VITE_GITHUB_TOKEN or VITE_GITHUB_REPO credentials configured.");
  }

  const path = `data/photos/${albumId}/${fileName}`;
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;

  // Check if file already exists (to get SHA if needed)
  let sha: string | undefined;
  try {
    const check = await fetch(`${url}?ref=${BRANCH}&t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (check.ok) {
      const data = await check.json();
      sha = data.sha;
    }
  } catch (_) {}

  const body: any = {
    message: commitMessage,
    content: base64Content,
    branch: BRANCH
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Photo upload failed: ${err.message || "Unknown error"}`);
  }

  // Return the raw URL to use in gallery.json
  return `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
}

/**
 * Wrapper function for backwards compatibility with pre-existing modules.
 */
export async function writeJSON(fileName: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await githubUpdateFile(`data/${fileName}`, content, `Update ${fileName} via EUC Admin Panel`);
}
