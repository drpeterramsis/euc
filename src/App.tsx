/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { THEME, User } from './types';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState(''); // Login username
  const [loginPassword, setLoginPassword] = useState(''); // Login password
  const [newUsername, setNewUsername] = useState(''); // New user username
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
  }, []);

  const handleLogin = () => {
    const user = users.find(u => u.username === username);
    if (user && user.password === loginPassword) {
      setCurrentUser(user);
    } else {
      alert("Invalid username or password!");
    }
  };

  const handleAddUser = () => {
    const newUser: User = { 
      id: Date.now().toString(), 
      username: newUsername, 
      password: newPassword, 
      role: newRole 
    };
    const updatedUsers = [...users, newUser];
    
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUsers)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(updatedUsers);
          setNewUsername('');
          setNewPassword('');
          alert('User added successfully!');
        }
      })
      .catch(console.error);
  };

  const handleInitializeDemo = () => {
    const demoUsers: User[] = [
      { id: "1", username: "admin", password: "adminpassword", role: "admin" },
      { id: "2", username: "user", password: "userpassword", role: "user" }
    ];

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demoUsers)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(demoUsers);
          alert('Demo users initialized!');
        }
      })
      .catch(console.error);
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
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
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
        <div className="border p-4 mb-4">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <div className="space-y-2">
            <input type="text" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="border p-2 w-full" />
            <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border p-2 w-full" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')} className="border p-2 w-full">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleAddUser} className="text-white p-2 w-full" style={{ backgroundColor: THEME.accent }}>Add User</button>
            <button onClick={handleInitializeDemo} className="text-black p-2 w-full border border-black mt-2">Initialize Demo Users</button>
          </div>
          <h3 className="text-xl font-bold mt-6 mb-2">User List</h3>
          <ul>
            {users.map(u => <li key={u.id}>{u.username} ({u.role})</li>)}
          </ul>
        </div>
      )}

      {currentUser.role === 'user' && (
        <div className="border p-4">
          <h2 className="text-2xl font-bold mb-4">Conference Trip: Prague</h2>
          <p>Welcome to the trip info section.</p>
        </div>
      )}

      <footer className="mt-12 text-sm text-gray-500">
        EVA URO CLUB - Version 1.0.004
      </footer>
    </div>
  );
}
