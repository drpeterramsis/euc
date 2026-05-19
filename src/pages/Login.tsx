// ─────────────────────────────────────────────
// FILE: src/pages/Login.tsx
// PURPOSE: Renders the login page where users
// enter their credentials to access the app.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcfa] p-4 relative overflow-hidden login-code-bg">
      
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none" />

      {/* Logo Container */}
      <div className="mb-10 relative z-10 flex flex-col items-center justify-center filter drop-shadow-2xl">
        {/* Static Logo */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64">
          <img 
            src="/images/euc_logo.webp" 
            alt="EUC Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-yellow-200 relative z-10">
     
        
        {/* Simple login form */}
        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center font-medium animate-pulse">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Username</label>
            <input 
              type="text" 
              className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all font-medium" 
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full p-3.5 pr-12 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all font-medium" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full p-3.5 mt-4 bg-yellow-500 text-gray-900 font-bold text-lg rounded-xl shadow-[0_4px_14px_rgba(234,179,8,0.3)] border border-yellow-600 hover:bg-yellow-400 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
          <a
            href={`https://wa.me/201069996672?text=${encodeURIComponent("Hello EUC Team, I need help logging into the EUC Conference App.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-600 font-bold text-sm hover:underline flex items-center justify-center gap-2"
          >
            <span>💬</span> Can't login? Need help — Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
