/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { THEME, User } from './types';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
  }, []);

  const handleLogin = () => {
    const user = users.find(u => u.username === username);
    if (user) {
      setCurrentUser(user);
    } else {
      alert("User not found!");
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.white }}>
        <div className="p-8 border border-black" style={{ color: THEME.black }}>
          <h1 className="text-3xl font-bold mb-4">EVA URO CLUB</h1>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 mb-2 w-full"
          />
          <button onClick={handleLogin} className="w-full text-white p-2" style={{ backgroundColor: THEME.accent }}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: THEME.white }}>
      <header className="mb-8 border-b border-black pb-4">
        <h1 className="text-4xl font-bold">EVA URO CLUB</h1>
        <p>Welcome, {currentUser.username} ({currentUser.role})</p>
      </header>

      {currentUser.role === 'admin' && (
        <div className="border p-4">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          {/* User management UI here */}
        </div>
      )}

      {currentUser.role === 'user' && (
        <div className="border p-4">
          <h2 className="text-2xl font-bold mb-4">Conference Trip: Prague</h2>
          <p>Welcome to the trip info section.</p>
        </div>
      )}

      <footer className="mt-12 text-sm text-gray-500">
        EVA URO CLUB - Version 1.0.001
      </footer>
    </div>
  );
}
