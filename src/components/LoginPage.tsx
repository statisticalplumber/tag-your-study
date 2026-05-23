import React, { useState } from 'react';
import { Shield, User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (token: string, role: UserRole) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Check your credentials.');
        return;
      }

      onLogin(data.token, data.role as UserRole);
    } catch {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-zinc-100 select-none font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-700">
            <span className="text-white font-mono font-bold text-base tracking-widest">F</span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-900 font-sans font-bold text-lg tracking-tight leading-none">FURIAN</span>
            <span className="text-xs text-zinc-500 font-mono tracking-widest mt-0.5">EDUCATION</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
            <h1 className="text-sm font-bold text-zinc-900 tracking-tight">Sign in to continue</h1>
            <p className="text-xs text-zinc-500 mt-1">Select your role and enter your password.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
            {/* Role selector */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedRole('user'); setError(''); }}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-center transition-all cursor-pointer ${
                    selectedRole === 'user'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white'
                  }`}
                >
                  <User size={16} />
                  <span className="text-[11px] font-semibold">User</span>
                  <span className={`text-[9px] font-mono leading-tight ${selectedRole === 'user' ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    Own API Key
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedRole('admin'); setError(''); }}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-center transition-all cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white'
                  }`}
                >
                  <Shield size={16} />
                  <span className="text-[11px] font-semibold">Admin</span>
                  <span className={`text-[9px] font-mono leading-tight ${selectedRole === 'admin' ? 'text-amber-100' : 'text-zinc-400'}`}>
                    Server API Key
                  </span>
                </button>
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span className="text-[11px] leading-snug">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                selectedRole === 'admin'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={15} />
              )}
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Role hint */}
          <div className="px-6 pb-5">
            <p className="text-[10px] text-zinc-400 leading-relaxed text-center font-mono">
              {selectedRole === 'admin'
                ? 'Admin uses the server-configured Gemini API key.'
                : 'Users provide their own Gemini API key via settings.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
