export type PageAccess = { enabled: boolean; comingSoon: boolean }

export function getPageAccess(
  settings: any,
  userId: string,
  pageName: string,
  role?: string
): PageAccess {
  const base: PageAccess = settings?.pages?.[pageName] 
    ?? { enabled: true, comingSoon: false }
  
  // Checking user override first
  const userOverride = settings?.userOverrides?.[userId]?.pages?.[pageName]
  
  // Checking role override
  const roleOverride = role ? settings?.roleOverrides?.[role]?.pages?.[pageName] : undefined
  
  return userOverride ?? roleOverride ?? base
}
