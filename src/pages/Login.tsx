// ─────────────────────────────────────────────
// FILE: src/pages/Login.tsx
// PURPOSE: Renders the login page where users
// enter their credentials to access the app.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Login component renders a centered login form for authentication.
 */
export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">EUC – EVA URO CLUB</h1>
        {/* Simple login form */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" className="w-full p-2 border rounded" />
          </div>
          <button className="w-full p-3 bg-yellow-500 font-bold rounded hover:bg-yellow-600 transition">Login</button>
        </form>
      </div>
    </div>
  );
}
