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

import { CACHE } from "../context/AppContext";
import { clearSession } from "./session";

// Interface defining the user structure
export interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  photo: string;
  // ... other user fields
}

/**
 * login()
 * Stores the user object in localStorage to maintain session.
 */
export function login(user: User) {
  localStorage.setItem(LOGIN_KEY, JSON.stringify(user));
}

/**
 * logout()
 * Removes the user object and all cached data from localStorage,
 * and forces a hard redirect to the login page.
 */
export function logout(): void {
  // 1. Clear auth session
  localStorage.removeItem(LOGIN_KEY);
  clearSession();

  // 2. Clear ALL sessionStorage data
  sessionStorage.removeItem(CACHE.users);
  sessionStorage.removeItem(CACHE.schedule);
  sessionStorage.removeItem(CACHE.sessions);
  sessionStorage.removeItem(CACHE.settings);

  // 3. Clear localStorage timestamp
  localStorage.removeItem(CACHE.lastFetch);

  // 4. Clear any view-as impersonation
  sessionStorage.removeItem("euc_view_as");

  // 5. Hard redirect to login — clears all React state
  window.location.href = "/";
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
