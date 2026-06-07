export type PageAccess = { enabled: boolean; comingSoon: boolean }

export function getPageAccess(
  userId: string,
  role: string,
  pageName: string,
  settings: any
): PageAccess {
  // Normalize role to lowercase for lookup consistency
  const normalizedRole = role?.toLowerCase() ?? "";

  // Helper to safely get page config, handling potential "pages" nesting
  const getPageConfig = (obj: any) => obj?.pages?.[pageName] ?? obj?.[pageName];

  // 1. User Override (Highest priority)
  const userOverride = getPageConfig(settings?.userOverrides?.[userId]);
  if (userOverride !== undefined) return userOverride;

  // 2. Role Override
  const roleOverride = getPageConfig(settings?.roleOverrides?.[normalizedRole]);
  if (roleOverride !== undefined) return roleOverride;

  // 3. Global Default (Baseline)
  const globalDefault = getPageConfig(settings);
  if (globalDefault !== undefined) return globalDefault;

  // Absolute fallback
  return { enabled: true, comingSoon: false };
}
