import { AppConfig } from "../context/AppContext";

// ─────────────────────────────────────────────
// FILE: src/utils/pageAccess.ts
// PURPOSE: Role-based navigation and page access guards.
// ─────────────────────────────────────────────

export type AccessResult = "active" | "coming-soon" | "hidden";

function normalizeRole(role: string | undefined | null): string {
  return role?.trim().toLowerCase() ?? "";
}

export function getPageAccess(
  pageKey: string,
  role: string | undefined,
  appConfig: AppConfig | null
): AccessResult {
  // ✅ ADMIN — UNCONDITIONAL FULL ACCESS
  const r = normalizeRole(role);
  if (r === "admin") return "active";

  // Fallback — appConfig flags
  if (!appConfig) return "active";

  const pageConf = appConfig?.pages?.[pageKey];
  if (pageConf?.visible === false) return "hidden";
  if (pageConf?.comingSoon === true) return "coming-soon";

  return "active";
}

export function isNavVisible(
  pageKey: string,
  role: string | undefined,
  appConfig: AppConfig | null
): boolean {
  const access = getPageAccess(pageKey, role, appConfig);
  return access !== "hidden";
}
