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
                {showPassword ? 'Sembunyi' : 'Lihat'}
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