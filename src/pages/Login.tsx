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
      console.log("Login attempt:", username);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111111] bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#2a2a00] p-4 relative overflow-hidden">
      
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ffbf00] rounded-full mix-blend-overlay filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ffbf00] rounded-full mix-blend-overlay filter blur-[100px] opacity-10 pointer-events-none" />

      {/* Flag Container */}
      <div className="mb-8 relative z-10 flex flex-col items-center justify-center filter drop-shadow-2xl">
        {/* Flag pole */}
        <div className="absolute left-0 top-0 bottom-[-20px] w-1.5 bg-gradient-to-b from-gray-300 to-gray-600 rounded-t-full shadow-lg z-20" />
        {/* Czech Flag SVG */}
        <div className="ml-1.5 w-32 h-20 sm:w-40 sm:h-24 relative overflow-hidden shadow-[2px_4px_10px_rgba(0,0,0,0.5)] animate-wave rounded-r-sm">
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#D7141A" />
            <rect width="900" height="300" fill="#FFFFFF" />
            <polygon points="0,0 0,600 450,300" fill="#11457E" />
            <line x1="0" y1="0" x2="900" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
            <line x1="0" y1="300" x2="900" y2="300" stroke="rgba(0,0,0,0.1)" strokeWidth="4" />
          </svg>
          {/* Shadow overlay to simulate folds during wave */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/20 pointer-events-none select-none mix-blend-multiply" />
        </div>
      </div>

      <div className="w-full max-w-md bg-[#1a1a1a] p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-gray-800 relative z-10">
        <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight text-white">
          EUC<span className="text-[#ffbf00]">.</span>
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8 font-medium">EVA URO CLUB • PRAGUE CONF</p>
        
        {/* Simple login form */}
        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center font-medium animate-pulse">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5 ml-1">Username</label>
            <input 
              type="text" 
              className="w-full p-3.5 bg-[#252525] border border-gray-700 rounded-xl text-white outline-none focus:border-[#ffbf00] focus:ring-1 focus:ring-[#ffbf00] transition-all" 
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full p-3.5 bg-[#252525] border border-gray-700 rounded-xl text-white outline-none focus:border-[#ffbf00] focus:ring-1 focus:ring-[#ffbf00] transition-all" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full p-3.5 mt-2 bg-[#ffbf00] text-[#111111] font-bold text-lg rounded-xl shadow-[0_4px_14px_rgba(255,191,0,0.3)] hover:bg-[#ffe066] hover:shadow-[0_6px_20px_rgba(255,191,0,0.4)] transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[#111111]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
