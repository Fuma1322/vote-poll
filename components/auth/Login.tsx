'use client';

import { FormEvent, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

type LoginFormProps = {
  onSubmit?: (data: { email: string; password: string }) => void;
  onRegisterClick?: () => void;
  loading?: boolean;
  error?: string;
};

export default function LoginForm({ onSubmit, loading = false, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setValidationError('Please enter your email and password.');
      return;
    }

    setValidationError('');
    onSubmit?.({ email: email.trim(), password });
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-black/5 sm:p-8">
      <div className="mb-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#111111]">
          <ShieldCheck size={32} />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Welcome</h1>
        <p className="mt-2 text-sm text-gray-500">Sign in to access the hospital voting portal.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#111111]">
            Email address
          </label>

          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="you@hospital.org"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[#111111]">
            Password
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-12 text-sm text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#111111]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {(validationError || error) && (
          <p role="alert" className="text-sm text-red-600">
            {validationError || error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#1fbd59] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-gray-400">
        Authorized hospital personnel only.
      </p>
    </div>
  );
}
