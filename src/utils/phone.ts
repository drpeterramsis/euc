/**
 * Normalizes any Egyptian phone number to international format.
 *
 * Input examples:
 *   "201069993301"   → "+201069993301"
 *   "01069993301"    → "+201069993301"
 *   "+201069993301"  → "+201069993301"
 *   "1069993301"     → "+201069993301"
 *
 * Rules:
 *   1. Strip all non-digit characters
 *   2. If starts with "20"  → prepend "+"
 *   3. If starts with "0"   → replace leading "0" with "+20"
 *   4. If starts with "1"   → prepend "+20"
 *   5. Otherwise            → prepend "+" as-is
 */
export function normalizePhone(raw: string | undefined | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("20"))  return `+${digits}`;
  if (digits.startsWith("0"))   return `+2${digits}`;
  if (digits.startsWith("1"))   return `+20${digits}`;
  return `+${digits}`;
}

/**
 * Returns a tel: href for direct phone call
 * e.g. "tel:+201069993301"
 */
export function callHref(raw: string | undefined | null): string {
  const normalized = normalizePhone(raw);
  return normalized ? `tel:${normalized}` : "#";
}

/**
 * Returns a wa.me URL for WhatsApp direct chat
 * e.g. "https://wa.me/201069993301"
 * Note: wa.me does NOT use the "+" prefix — digits only
 */
export function whatsappHref(raw: string | undefined | null): string {
  const normalized = normalizePhone(raw);
  if (!normalized) return "#";
  const digits = normalized.replace("+", ""); // remove "+" for wa.me
  return `https://wa.me/${digits}`;
}

/**
 * Returns display-friendly formatted number
 * e.g. "+20 106 999 3301"
 */
export function displayPhone(raw: string | undefined | null): string {
  const normalized = normalizePhone(raw);
  if (!normalized) return "";
  // Format: +20 1XX XXX XXXX
  const digits = normalized.replace("+", "");
  if (digits.length === 12 && digits.startsWith("20")) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return normalized;
}
