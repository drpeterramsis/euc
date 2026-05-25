// ─────────────────────────────────────────────
// FILE: src/utils/countdownUtils.ts
// PURPOSE: Merges schedule.json events with custom timeline entries to find the next event and calculate relative times.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { localToUtc } from "./timezone";

export interface TimelineEvent {
  id: string;
  label: string;
  datetime: string; // UTC ISO string
  icon: string;
  color: "yellow" | "green" | "blue" | "red" | "gray";
  source: "schedule" | "custom";
  isPast: boolean;
  isToday: boolean;
  isSoon: boolean; // within 24 hours
  diff: number; // ms from now
  timezoneDisplay?: "both" | "prague" | "cairo";
}

// Helper to get UTC from event data
function getUtcFromEvent(event: any): string {
  if (event.datetime_utc) return event.datetime_utc;
  let local;
  if (event.type === "flight") {
    local = `${event.details.date}T${event.details.time ?? "00:00"}`;
  } else if (event.type === "hotel") {
    local = `${event.details.checkInDate}T${event.details.checkInTime || "14:00"}`;
  } else if (event.datetime) {
    local = event.datetime;
  } else {
    local = `${event.date}T${event.time ?? "00:00"}`;
  }
  return localToUtc(local, "Africa/Cairo");
}

// Build unified timeline from schedule.json + custom entries
export function buildTimeline(
  scheduleItems: any[],
  customEntries: any[],
): TimelineEvent[] {
  const now = Date.now();
  const events: TimelineEvent[] = [];

  function stripLeadingEmoji(str: string): string {
    if (!str) return "";
    return str
      .replace(
        /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}\s]+/gu,
        "",
      )
      .trim();
  }

  // ── From schedule.json ──────────────────────────────────
  scheduleItems.forEach((item) => {
    if (item.type === "flight") {
      const dt = getUtcFromEvent(item);
      events.push({
        id: item.id,
        label: stripLeadingEmoji(item.title),
        datetime: dt,
        icon: item.direction === "outbound" ? "\u2708\uFE0F" : "\uD83D\uDEEC",
        color: item.direction === "outbound" ? "yellow" : "green",
        source: "schedule",
        isPast: new Date(dt).getTime() < now,
        isToday: isToday(dt),
        isSoon: isSoon(dt, now),
        diff: new Date(dt).getTime() - now,
        timezoneDisplay: item.timezoneDisplay ?? item.details?.timezoneDisplay,
      });
    }
    if (item.type === "hotel") {
      const dt = getUtcFromEvent(item);
      events.push({
        id: item.id + "_checkin",
        label: `Check-in: ${item.details.hotelName}`,
        datetime: dt,
        icon: "\uD83C\uDFE8",
        color: "blue",
        source: "schedule",
        isPast: new Date(dt).getTime() < now,
        isToday: isToday(dt),
        isSoon: isSoon(dt, now),
        diff: new Date(dt).getTime() - now,
        timezoneDisplay: item.timezoneDisplay ?? item.details?.timezoneDisplay,
      });
      const itemOut = {
        ...item,
        type: "hotel",
        details: {
          ...item.details,
          checkInDate: item.details.checkOutDate,
          checkInTime: item.details.checkOutTime || "12:00",
        },
      };
      const dtOut = getUtcFromEvent(itemOut);
      events.push({
        id: item.id + "_checkout",
        label: `Check-out: ${item.details.hotelName}`,
        datetime: dtOut,
        icon: "\uD83C\uDFE8",
        color: "gray",
        source: "schedule",
        isPast: new Date(dtOut).getTime() < now,
        isToday: isToday(dtOut),
        isSoon: isSoon(dtOut, now),
        diff: new Date(dtOut).getTime() - now,
        timezoneDisplay: item.timezoneDisplay ?? item.details?.timezoneDisplay,
      });
    }
  });

  // ── From customTimelineEntries ───────────────────────────
  (customEntries || []).forEach((entry) => {
    const dt = getUtcFromEvent(entry);
    const ts = new Date(dt).getTime();
    events.push({
      id: entry.id,
      label: stripLeadingEmoji(entry.label),
      datetime: dt,
      icon: entry.icon ?? "\uD83D\uDCCC",
      color: entry.color ?? "gray",
      source: "custom",
      isPast: ts < now,
      isToday: isToday(dt),
      isSoon: isSoon(dt, now),
      diff: ts - now,
      timezoneDisplay: entry.timezoneDisplay,
    });
  });

  // Sort chronologically
  return events.sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );
}

// Get the NEXT upcoming event (soonest non-past)
export function getNextEvent(events: TimelineEvent[]): TimelineEvent | null {
  return events.find((e) => !e.isPast) ?? null;
}

// Helpers
function isToday(dt: string): boolean {
  const d = new Date(dt);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function isSoon(dt: string, now: number): boolean {
  const diff = new Date(dt).getTime() - now;
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

// Format relative time label
export function formatRelativeTime(diff: number): string {
  if (diff < 0) return "Past";
  const totalSecs = Math.floor(diff / 1000);
  const totalMins = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 1) return `In ${totalDays} days`;
  if (totalDays === 1) return "Tomorrow";
  if (totalHours > 1) return `In ${totalHours} hours`;
  if (totalMins > 1) return `In ${totalMins} minutes`;
  return "Now!";
}
