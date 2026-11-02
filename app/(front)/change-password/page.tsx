'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  toggleVisibility: () => void;
  placeholder: string;
  autoComplete: string;
};

function PasswordField({
  label,
  value,
  onChange,
  visible,
  toggleVisibility,
  placeholder,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>

      <div className="relative">
        <LockKeyhole
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#25D366] focus:bg-white focus:ring-4 focus:ring-[#25D366]/10"
        />

        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Your new password must contain at least 8 characters.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Your new password must be different from your temporary password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Your new passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Unable to change your password. Please try again.'
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7] px-4 py-10">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg shadow-green-600/20">
            <ShieldCheck size={30} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
            Hospital Voting Portal
          </h1>

          <p className="mt-2 text-sm text-gray-500">Secure access for healthcare professionals</p>
        </div>

        {/* Main card */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-8">
          {success ? (
            <div className="py-5 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle2 size={36} />
              </div>

              <h2 className="text-xl font-bold text-gray-900">Password changed successfully</h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Your password has been updated. Continue to sign in using your new password.
              </p>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#20bd5a] focus:outline-none focus:ring-4 focus:ring-green-200"
              >
                Continue to login
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-7">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <ShieldCheck size={14} />
                  Account security
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  Change your password
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  You are using a temporary password. Create a new password before continuing to the
                  voting portal.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Password form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <PasswordField
                  label="Current temporary password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  visible={showCurrent}
                  toggleVisibility={() => setShowCurrent((prev) => !prev)}
                  placeholder="Enter your temporary password"
                  autoComplete="current-password"
                />

                <div className="space-y-2">
                  <PasswordField
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    visible={showNew}
                    toggleVisibility={() => setShowNew((prev) => !prev)}
                    placeholder="Create a new password"
                    autoComplete="new-password"
                  />

                  <p className="text-xs text-gray-500">
                    Use at least 8 characters. Avoid reusing your temporary password.
                  </p>
                </div>

                <PasswordField
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirm}
                  toggleVisibility={() => setShowConfirm((prev) => !prev)}
                  placeholder="Enter your new password again"
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#20bd5a] focus:outline-none focus:ring-4 focus:ring-green-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Updating password...' : 'Update password'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              {/* Security notice */}
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
                <LockKeyhole size={18} className="mt-0.5 shrink-0 text-gray-500" />

                <p className="text-xs leading-5 text-gray-500">
                  Your password is transmitted securely to the hospital voting API. Never share your
                  password with another person.
                </p>
              </div>
            </>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-gray-400">
          Hospital Committee Election · Secure Voting Portal
        </p>
      </div>
    </main>
  );
}
