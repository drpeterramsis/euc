export type PageAccess = { enabled: boolean; comingSoon: boolean }

export function getPageAccess(
  userId: string,
  role: string,
  pageName: string,
  settings: any
): PageAccess {
  // Normalize role to lowercase for lookup consistency
  const normalizedRole = role?.toLowerCase() ?? "";

  // 1. User Override (Highest priority)
  const userOverride = settings?.userOverrides?.[userId]?.pages?.[pageName];
  if (userOverride !== undefined) return userOverride;

  // 2. Role Override
  const roleOverride = settings?.roleOverrides?.[normalizedRole]?.pages?.[pageName];
  if (roleOverride !== undefined) return roleOverride;

  // 3. Global Default (Baseline)
  const globalDefault = settings?.pages?.[pageName];
  if (globalDefault !== undefined) return globalDefault;

  // Absolute fallback
  return { enabled: true, comingSoon: false };
}
