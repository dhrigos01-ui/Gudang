import React, { useState } from 'react';
import { User } from '../types';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';
import { ShoeIcon } from './icons/ShoeIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface LoginPageProps {
  // FIX: Update signature to accept token and user object on successful login.
  onLoginSuccess: (token: string, user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // FIX: Use async API call for login and handle response with token and user.
      const { token, user } = await api.login(username, password);
      if (user && token) {
        onLoginSuccess(token, user);
      } else {
        setError('Username atau password salah.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-2xl shadow-2xl">
        <div className="text-center">
            <div className="inline-block p-3 bg-slate-700 rounded-full mb-4">
                <ShoeIcon className="h-10 w-10 text-cyan-400" />
            </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Sistem Gudang Sepatu</h2>
          <p className="mt-2 text-slate-400">Silakan login untuk melanjutkan</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-600 bg-slate-700 text-white placeholder-slate-400 rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 pr-10 border border-slate-600 bg-slate-700 text-white placeholder-slate-400 rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 px-3 text-slate-300 hover:text-white"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {/* Icon mata */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  {showPassword ? (
                    <path d="M3.53 2.47a.75.75 0 1 0-1.06 1.06l2.122 2.122C2.846 6.64 1.77 8.048 1.2 8.9a2.25 2.25 0 0 0 0 2.2C3.18 14.75 6.87 18 12 18c1.87 0 3.5-.39 4.9-1.04l3.57 3.57a.75.75 0 1 0 1.06-1.06l-18-18Zm7.27 9.39 1.34 1.34a2.25 2.25 0 0 1-1.34-1.34ZM12 6a6 6 0 0 1 6 6c0 .76-.14 1.49-.4 2.16l-1.2-1.2c.04-.31.06-.63.06-.96a4.5 4.5 0 0 0-4.5-4.5c-.33 0-.65.02-.96.06l-1.2-1.2C10.51 6.14 11.24 6 12 6Z" />
                  ) : (
                    <path d="M12 5c-5.13 0-8.82 3.25-10.8 6.2a2.25 2.25 0 0 0 0 2.2C3.18 16.75 6.87 20 12 20s8.82-3.25 10.8-6.2a2.25 2.25 0 0 0 0-2.2C20.82 8.25 17.13 5 12 5Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}                   
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserCircleIcon className={`h-5 w-5 ${isLoading ? 'text-slate-400' : 'text-cyan-400 group-hover:text-cyan-300'}`} />
              </span>
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};