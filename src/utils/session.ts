// ─────────────────────────────────────────────
// FILE: src/utils/session.ts
// PURPOSE: Persistent auto-login for installed PWA.
// ─────────────────────────────────────────────

const SESSION_KEY = "euc_user_session";

export interface StoredSession {
  userId: string;
  role: string;
  savedAt: number; // Date.now()
}

// Save session to localStorage
export function saveSession(userId: string, role: string): void {
  const session: StoredSession = {
    userId,
    role,
    savedAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// Load session from localStorage
export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (!session.userId || !session.role) return null;
    return session;
  } catch {
    return null;
  }
}

// Clear session (on logout)
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Check if session exists
export function hasSession(): boolean {
  return loadSession() !== null;
}

/**
 * Deterministically finds the default/selected session date from available dates.
 * 1. If today's date exists, returns today's date.
 * 2. Otherwise, returns the nearest upcoming date (first future date).
 * 3. Otherwise, returns the most recent past date (last past date).
 */
export function getNearestSessionDate(availableDates: string[], todayOverride?: Date): string {
  if (availableDates.length === 0) return "";

  const now = todayOverride || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // If today's date exists in the sessions, return it
  if (availableDates.includes(todayStr)) {
    return todayStr;
  }

  // Get midnight for accurate comparison
  const todayMidnight = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // Parse all available dates
  const parsedDates = availableDates.map(dateStr => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d, 0, 0, 0, 0);
    return { dateStr, time: dateObj.getTime() };
  });

  // Find nearest upcoming date: first date > todayMidnight (since availableDates is sorted ascending)
  const upcoming = parsedDates.find(p => p.time > todayMidnight.getTime());
  if (upcoming) {
    return upcoming.dateStr;
  }

  // If no upcoming sessions exist, select the most recent past date (last item in sorted list)
  return availableDates[availableDates.length - 1];
}

