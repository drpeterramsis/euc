import { AppConfig } from "../context/AppContext";

export const DEFAULT_LABELS = {
  dashboard: "Home Page",
  schedule:  "Trip Schedule",
  sessions:  "Sessions",
  media:     "News Feed",
  staff:     "Staff Directory",
  profile:   "My Profile",
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
  // Fallback for others (like social_program etc if they were labels)
  // For now, these are the main ones we want to rename.
  return featureKey as keyof typeof DEFAULT_LABELS;
}
