import { AppConfig } from "../context/AppContext";

// ─────────────────────────────────────────────
// FILE: src/utils/pageAccess.ts
// PURPOSE: Role-based navigation and page access guards.
// ─────────────────────────────────────────────

export type AccessResult = "active" | "coming-soon" | "hidden";

const DOCTOR_COMING_SOON_PAGES = ["schedule", "sessions", "media"];

const STAFF_ALWAYS_ACTIVE_PAGES = [
  "dashboard", "schedule", "sessions",
  "media", "directory", "profile"
];

function normalizeRole(role: string | undefined | null): string {
  return role?.trim().toLowerCase() ?? "";
}

export function getPageAccess(
  pageKey: string,
  role: string | undefined,
  appConfig: AppConfig | null
): AccessResult {
  const r = normalizeRole(role);

  // ✅ ADMIN — UNCONDITIONAL FULL ACCESS — nothing can override this
  if (r === "admin") return "active";

  // ✅ STAFF — UNCONDITIONAL FULL ACCESS — nothing can override this
  if (r === "staff") return "active";

  // 🔒 DOCTOR — Coming Soon for restricted pages
  if (r === "doctor" && DOCTOR_COMING_SOON_PAGES.includes(pageKey)) {
    return "coming-soon";
  }

  // Fallback — appConfig flags (only reached by doctor/unknown roles)
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
