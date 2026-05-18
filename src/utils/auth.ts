// ─────────────────────────────────────────────
// FILE: src/utils/auth.ts
// PURPOSE: Handles user authentication logic
// using localStorage for session management.
// No backend or JWT — purely client-side.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
 */
export function login(user: User) {
  localStorage.setItem("user", JSON.stringify(user));
}

/**
 * logout()
 * Removes the user object from localStorage, effectively ending the session.
 */
export function logout() {
  localStorage.removeItem("user");
}

/**
 * getCurrentUser()
 * Retrieves the currently logged-in user from localStorage.
 * Returns the User object or null if not authenticated.
 */
export function getCurrentUser(): User | null {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

/**
 * isAuthenticated()
 * Checks if a user is currently logged in.
 * Returns true if authenticated, false otherwise.
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("user");
}
