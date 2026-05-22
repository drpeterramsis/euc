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
