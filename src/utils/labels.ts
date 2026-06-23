import { AppConfig } from "../context/AppContext";

export const DEFAULT_LABELS = {
  dashboard:  "Home Page",
  schedule:   "Schedule",
  sessions:   "Sessions",
  media:      "Gallery",
  directory:  "Staff Directory",
  staff:      "Staff Directory", // ← LEGACY BACKWARD-COMPATIBILITY LOCK
  profile:    "My Profile",
};

/**
 * Utility to get the dynamic label for a nav item from appConfig.
 * If appConfig is not yet loaded or doesn't have the label, it returns a default.
 */
export function getLabel(
  appConfig: AppConfig | null,
  key: keyof typeof DEFAULT_LABELS
): string {
  return appConfig?.navLabels?.[key] ?? DEFAULT_LABELS[key];
}

/**
 * Maps feature keys used in FeatureRoute/ComingSoon to label keys.
 */
export function featureToLabelKey(featureKey: string): keyof typeof DEFAULT_LABELS {
  if (featureKey === "photoGallery") return "media";
  if (featureKey === "sessions") return "sessions";
  if (featureKey === "schedule") return "schedule";
  if (featureKey === "directory") return "directory";
  if (featureKey === "staff") return "staff";
  return featureKey as keyof typeof DEFAULT_LABELS;
}
