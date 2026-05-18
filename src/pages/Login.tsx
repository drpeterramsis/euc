// ─────────────────────────────────────────────
// FILE: src/pages/Login.tsx
// PURPOSE: Renders the login page where users
// enter their credentials to access the app.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readJSON } from '../utils/github';
import { useApp } from '../context/AppContext';

/**
 * Login component renders a centered login form for authentication.
 * Handles user fetching, validation, and session creation.
 */
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginUser } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Fetch users from GitHub (w/ fallback)
      console.log("Loading users...");
      const users = await readJSON('users.json');
      console.log("Users loaded:", users);
      console.log("Login attempt:", username, password);

      // Validate credentials
      const matchedUser = users.find(
        (u: any) => u.username === username && u.password === password
      );

      if (matchedUser) {
        console.log("Matched user:", matchedUser);
        // Authentication successful
        loginUser(matchedUser);
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError('System error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">EUC – EVA URO CLUB</h1>
        {/* Simple login form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className="w-full p-3 bg-yellow-500 font-bold rounded hover:bg-yellow-600 transition disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
