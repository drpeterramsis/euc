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

export async function writeJSON(filePath: string, content: any) {
  const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const REPO = import.meta.env.VITE_GITHUB_REPO;
  const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";
  if (!TOKEN || !REPO) throw new Error("GitHub配置 missing");
  
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/data/${filePath}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  
  await fetch(`https://api.github.com/repos/${REPO}/contents/data/${filePath}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Update ${filePath}`,
      content: btoa(JSON.stringify(content, null, 2)),
      sha: data.sha,
      branch: BRANCH
    })
  });
}
