// Timezone identifiers
export const TZ_CAIRO = "Africa/Cairo";
export const TZ_PRAGUE = "Europe/Prague";

// Convert a UTC ISO string to a display time in a given timezone
// Returns: { time: "14:00", date: "Wed 25 Jun", label: "CEST" }
// COMMENT: Added exhaustive try/catch wrapper and fallback logic to protect against any invalid inputs (e.g. "Invalid Date" or corrupted items).
export function utcToDisplay(
  utcIso: string,
  timezone: string,
): { time: string; date: string; label: string } {
  try {
    let date = new Date(utcIso);
    if (isNaN(date.getTime())) {
      // Fallback to current date to prevent uncaught RangeError
      date = new Date();
    }
    const time = date.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const dateStr = date.toLocaleDateString("en-GB", {
      timeZone: timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const label = timezone === TZ_PRAGUE ? "CEST" : "EET";
    return { time, date: dateStr, label };
  } catch (err) {
    console.error("utcToDisplay: Error parsing date/time for timezone", timezone, utcIso, err);
    const label = timezone === TZ_PRAGUE ? "CEST" : "EET";
    return { time: "12:00 AM", date: "N/A", label };
  }
}

// Convert a "HH:mm" or "HH:mm:ss" string to AM/PM
// e.g. "14:30" → "2:30 PM"
export function formatTimeAmPm(timeStr: string): string {
  if (!timeStr) return "";
  if (/AM|PM/i.test(timeStr)) return timeStr;
  // Parse hours and minutes from the string
  const [hourStr, minuteStr] = timeStr.split(":");
  const hours   = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr ?? "0", 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Convert a local datetime string + chosen timezone to UTC ISO string
// Input: "2025-06-25T14:00" + "Europe/Prague"
// Output: "2025-06-25T12:00:00.000Z"
// COMMENT: Cleaned localDateTime strings of any range elements (like "09:00 - 10:30") and added safe try-catch wrapper.
export function localToUtc(localDatetime: string, timezone: string): string {
  try {
    let cleaned = localDatetime || "";
    // If we have a T separator, isolate date vs time
    if (cleaned.includes("T")) {
      const parts = cleaned.split("T");
      const datePart = parts[0].trim();
      let timePart = parts[1].trim();
      
      // Clean time limits, splitting by common range separators: dash (-), ndash (–), mdash (—), tilde (~), or word "to"
      const timeSubparts = timePart.split(/[\-\u2013\u2014~]|\bto\b/i);
      if (timeSubparts.length > 0) {
        timePart = timeSubparts[0].trim();
      }
      cleaned = `${datePart}T${timePart}`;
    }

    let localDate = new Date(cleaned);
    if (isNaN(localDate.getTime())) {
      // Use current date as baseline fallback
      localDate = new Date();
    }
    const tzOffset = getTimezoneOffsetMinutes(localDate, timezone);
    const utcMs = localDate.getTime() - tzOffset * 60 * 1000;
    return new Date(utcMs).toISOString();
  } catch (err) {
    console.error("localToUtc: Error converting local datetime:", localDatetime, err);
    return new Date().toISOString();
  }
}

// Get the UTC offset in minutes for a timezone at a given date
// COMMENT: Safeguarded to prevent invalid date formatting exceptions and return 0 on failure.
export function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  try {
    let checkDate = date;
    if (!checkDate || isNaN(checkDate.getTime())) {
      checkDate = new Date();
    }
    const utcStr = checkDate.toLocaleString("en-GB", { timeZone: "UTC" });
    const tzStr = checkDate.toLocaleString("en-GB", { timeZone: timezone });
    const utcDate = new Date(utcStr);
    const tzDate = new Date(tzStr);
    
    if (isNaN(utcDate.getTime()) || isNaN(tzDate.getTime())) {
      return 0;
    }
    return (tzDate.getTime() - utcDate.getTime()) / 60000;
  } catch (err) {
    console.error("getTimezoneOffsetMinutes: Error calculating offset for", timezone, err);
    return 0;
  }
}

// Get current live time in both timezones
export function getLiveClocks(): {
  cairo: { time: string; date: string };
  prague: { time: string; date: string };
} {
  const now = new Date();
  const fmt = (tz: string) => ({
    time: now.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    date: now.toLocaleDateString("en-GB", {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  });
  return {
    cairo: fmt(TZ_CAIRO),
    prague: fmt(TZ_PRAGUE),
  };
}

// Format countdown duration from now until a UTC ISO string
// Returns: "2d 03:25:10" or "03:25:10" or "Started" or "Passed"
export function formatCountdown(utcIso: string): string {
  const now = Date.now();
  const target = new Date(utcIso).getTime();
  const diff = target - now;
  if (diff <= 0) return "Started";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const hms = [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days}d ${hms}` : hms;
}

// Get UTC ISO string representation of any timeline or countdown event
export function getUtcFromEvent(event: any): string {
  if (event.datetime_utc) return event.datetime_utc;
  const local = event.datetime
    ? event.datetime
    : `${event.date}T${event.time ?? "00:00"}`;
  return localToUtc(local, "Africa/Cairo");
}

// Helper to convert a UTC ISO string to datetime-local field format ("YYYY-MM-DDTHH:MM") for a target timezone
export function utcToLocalInput(utcIso: string, timezone: string): string {
  try {
    const d = new Date(utcIso);
    if (isNaN(d.getTime())) return "";
    
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    
    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
    
    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = getPart("hour");
    const minute = getPart("minute");
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch (err) {
    console.error("utcToLocalInput: Error converting date:", utcIso, timezone, err);
    return "";
  }
}

