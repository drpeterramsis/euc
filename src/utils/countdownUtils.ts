// ─────────────────────────────────────────────
// FILE: src/utils/countdownUtils.ts
// PURPOSE: Merges schedule.json events with custom timeline entries to find the next event and calculate relative times.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TimelineEvent {
  id:       string;
  label:    string;
  datetime: string;   // ISO string
  icon:     string;
  color:    "yellow" | "green" | "blue" | "red" | "gray";
  source:   "schedule" | "custom";
  isPast:   boolean;
  isToday:  boolean;
  isSoon:   boolean;  // within 24 hours
  diff:     number;   // ms from now
}

// Build unified timeline from schedule.json + custom entries
export function buildTimeline(
  scheduleItems: any[],
  customEntries: any[]
): TimelineEvent[] {
  const now = Date.now();
  const events: TimelineEvent[] = [];

  // ── From schedule.json ──────────────────────────────────
  scheduleItems.forEach(item => {
    if (item.type === "flight") {
      const dt = `${item.details.date}T${item.details.time ?? "00:00"}:00`;
      events.push({
        id:       item.id,
        label:    item.title,
        datetime: dt,
        icon:     item.direction === "outbound" ? "\u2708\uFE0F" : "\uD83D\uDEEC",
        color:    item.direction === "outbound" ? "yellow" : "green",
        source:   "schedule",
        isPast:   new Date(dt).getTime() < now,
        isToday:  isToday(dt),
        isSoon:   isSoon(dt, now),
        diff:     new Date(dt).getTime() - now,
      });
    }
    if (item.type === "hotel") {
      const dt = `${item.details.checkInDate}T${item.details.checkInTime || "14:00"}:00`;
      events.push({
        id:       item.id + "_checkin",
        label:    `\uD83C\uDFE8 Check-in: ${item.details.hotelName}`,
        datetime: dt,
        icon:     "\uD83C\uDFE8",
        color:    "blue",
        source:   "schedule",
        isPast:   new Date(dt).getTime() < now,
        isToday:  isToday(dt),
        isSoon:   isSoon(dt, now),
        diff:     new Date(dt).getTime() - now,
      });
      const dtOut = `${item.details.checkOutDate}T${item.details.checkOutTime || "12:00"}:00`;
      events.push({
        id:       item.id + "_checkout",
        label:    `\uD83C\uDFE8 Check-out: ${item.details.hotelName}`,
        datetime: dtOut,
        icon:     "\uD83C\uDFE8",
        color:    "gray",
        source:   "schedule",
        isPast:   new Date(dtOut).getTime() < now,
        isToday:  isToday(dtOut),
        isSoon:   isSoon(dtOut, now),
        diff:     new Date(dtOut).getTime() - now,
      });
    }
  });

  // ── From customTimelineEntries ───────────────────────────
  (customEntries || []).forEach(entry => {
    const ts = new Date(entry.datetime).getTime();
    events.push({
      id:       entry.id,
      label:    entry.label,
      datetime: entry.datetime,
      icon:     entry.icon ?? "\uD83D\uDCCC",
      color:    entry.color ?? "gray",
      source:   "custom",
      isPast:   ts < now,
      isToday:  isToday(entry.datetime),
      isSoon:   isSoon(entry.datetime, now),
      diff:     ts - now,
    });
  });

  // Sort chronologically
  return events.sort((a, b) =>
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
}

// Get the NEXT upcoming event (soonest non-past)
export function getNextEvent(events: TimelineEvent[]): TimelineEvent | null {
  return events.find(e => !e.isPast) ?? null;
}

// Helpers
function isToday(dt: string): boolean {
  const d = new Date(dt);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() &&
         d.getMonth()    === n.getMonth()    &&
         d.getDate()     === n.getDate();
}

function isSoon(dt: string, now: number): boolean {
  const diff = new Date(dt).getTime() - now;
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

// Format relative time label
export function formatRelativeTime(diff: number): string {
  if (diff < 0) return "Past";
  const totalSecs  = Math.floor(diff / 1000);
  const totalMins  = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const totalDays  = Math.floor(totalHours / 24);

  if (totalDays > 1)  return `In ${totalDays} days`;
  if (totalDays === 1) return "Tomorrow";
  if (totalHours > 1) return `In ${totalHours} hours`;
  if (totalMins  > 1) return `In ${totalMins} minutes`;
  return "Now!";
}
