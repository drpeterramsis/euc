import { AppConfig } from "../context/AppContext";

export type AccessResult = "active" | "coming-soon" | "hidden";

// Pages that doctors see as "Coming Soon" regardless of appConfig
const DOCTOR_COMING_SOON_PAGES = ["schedule", "sessions", "media"];

// Pages that staff always see as active
const STAFF_ALWAYS_ACTIVE_PAGES = [
  "dashboard", "schedule", "sessions",
  "media", "directory", "profile"
];

/**
 * Normalizes role string — trims whitespace and lowercases.
 * Prevents "Admin", "ADMIN", "admin " from breaking role checks.
 */
function normalizeRole(role: string | undefined | null): string {
  return role?.trim().toLowerCase() ?? "";
}

/**
 * Returns the effective access level for a given page + role combination.
 * Role-based rules OVERRIDE appConfig flags for admin and staff.
 * Doctors are subject to role-based coming-soon rules first,
 * then fall through to appConfig flags.
 */
export function getPageAccess(
  pageKey: string,
  role: string | undefined,
  appConfig: AppConfig | null
): AccessResult {

  const r = normalizeRole(role);

  // ADMIN — everything always active, no restrictions
  if (r === "admin") return "active";

  // STAFF — always active for all standard pages
  if (r === "staff") {
    if (STAFF_ALWAYS_ACTIVE_PAGES.includes(pageKey)) return "active";
  }

  // DOCTOR — Coming Soon for restricted pages
  if (r === "doctor") {
    if (DOCTOR_COMING_SOON_PAGES.includes(pageKey)) return "coming-soon";
  }

  // Fallback — check global appConfig flags
  const pageConf = appConfig?.pages?.[pageKey];
  if (pageConf?.visible === false) return "hidden";
  if (pageConf?.comingSoon === true) return "coming-soon";

  return "active";
}

/**
 * Returns whether a nav item should be visible in the sidebar
 * for the given role. Hidden pages are removed from sidebar.
 * Coming-soon pages ARE shown in sidebar (with "Soon" badge).
 */
export function isNavVisible(
  pageKey: string,
  role: string | undefined,
  appConfig: AppConfig | null
): boolean {
  const access = getPageAccess(pageKey, role, appConfig);
  // Hidden pages are removed from nav entirely
  if (access === "hidden") return false;
  // coming-soon and active both appear in nav
  return true;
}
