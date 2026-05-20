import { useApp } from "../context/AppContext";

export type FeatureStatus = "active" | "coming_soon" | "disabled";

export function getFeatureStatus(
  user: any,
  featureKey: string
): FeatureStatus {
  // ─── ADMIN and STAFF OVERRIDE ───
  // Unconditional full access for admin and staff roles (case-insensitive)
  const userRole = user?.role?.trim().toLowerCase();
  if (userRole === "admin" || userRole === "staff") {
    return "active";
  }

  // If user is admin, they usually have access to everything, 
  // but we can still respect the status set by global flags.
  
  const f = user?.featureAccess?.[featureKey];
  
  // If f is boolean (legacy), convert to object-like behavior
  if (f === false) return "disabled";
  if (f === true) return "active";
  if (f === "coming_soon") return "coming_soon";
  
  // If f is an object
  if (f && typeof f === 'object') {
    if (f.access === false) return "disabled";
    if (f.status === "coming_soon") return "coming_soon";
    return "active";
  }

  // Default to disabled if no info
  return "disabled";
}
