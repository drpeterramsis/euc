// ─────────────────────────────────────────────
// FILE: src/utils/auth.ts
// PURPOSE: Handles user authentication logic
// using localStorage for session management.
// No backend or JWT — purely client-side.
// Key used for storage: "euc_user".
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Key for localStorage session
const LOGIN_KEY = "euc_user";

// Interface defining the user structure
export interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  // ... other user fields
}

/**
 * login()
 * Stores the user object in localStorage to maintain session.
 * Logs session save confirmation.
 */
export function login(user: User) {
  localStorage.setItem(LOGIN_KEY, JSON.stringify(user));
  console.log("Session saved:", localStorage.getItem(LOGIN_KEY));
}

/**
 * logout()
 * Removes the user object from localStorage, effectively ending the session.
 */
export function logout() {
  localStorage.removeItem(LOGIN_KEY);
}

/**
 * getCurrentUser()
 * Retrieves the currently logged-in user from localStorage.
 * Returns the User object or null if not authenticated.
 */
export function getCurrentUser(): User | null {
  const user = localStorage.getItem(LOGIN_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * isAuthenticated()
 * Checks if a user is currently logged in.
 * Returns true if authenticated, false otherwise.
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(LOGIN_KEY);
}
