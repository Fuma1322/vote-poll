'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, UserPlus } from 'lucide-react';
import RegisterForm, { type RegisterFormData } from '@/components/auth/Register';

type RegistrationResult = {
  message: string;
  voter: {
    id: string;
    full_name: string;
    email: string;
    registration_number: string;
    professional_category: string;
    must_change_password: boolean;
  };
  temporaryPassword: string;
};

export default function RegisterVoterPanel() {
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [copyMessage, setCopyMessage] = useState('');

  async function handleRegister(data: RegisterFormData) {
    setLoading(true);
    setError('');
    setResult(null);
    setCopyMessage('');

    try {
      const response = await fetch('/api/admin/voters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          registrationNumber: data.employeeNumber.trim(),
          professionalCategory: data.role,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || `Registration failed (${response.status}).`
        );
      }

      if (!payload?.voter?.id || typeof payload?.temporaryPassword !== 'string') {
        throw new Error(
          'The server response did not include the voter account and temporary password.'
        );
      }

      setResult(payload as RegistrationResult);
      setFormOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to register this voter. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyTemporaryPassword() {
    if (!result?.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopyMessage('Temporary password copied.');
    } catch {
      setCopyMessage('Copy failed. Select the password and copy it manually.');
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#168a40]">
            <UserPlus size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#111111]">Register a voter</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
              Create an account for a doctor, pharmacist, or dentist. The voter will receive a
              temporary password that must be handled securely.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormOpen((open) => !open);
            setError('');
          }}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-[#1fbd59]"
        >
          <UserPlus size={18} />
          {formOpen ? 'Close form' : 'Register voter'}
        </button>
      </div>

      {formOpen && (
        <div className="mt-8 border-t border-gray-100 pt-8">
          <RegisterForm
            onSubmit={handleRegister}
            onBack={() => {
              setFormOpen(false);
              setError('');
            }}
            loading={loading}
            error={error}
          />
        </div>
      )}

      {error && !formOpen && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {result && (
        <div
          role="status"
          className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="mt-0.5 shrink-0 text-emerald-700" />
            <div>
              <h3 className="font-bold text-gray-900">Voter registered successfully</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {result.voter.full_name}
                {' · '}
                {result.voter.email}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Registration number:{' '}
                <span className="font-semibold">{result.voter.registration_number}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Profession:{' '}
                <span className="font-semibold">{result.voter.professional_category}</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="temporary-password"
              className="block text-sm font-semibold text-gray-800"
            >
              Temporary password
            </label>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="temporary-password"
                type="text"
                readOnly
                value={result.temporaryPassword}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-3 font-mono text-sm text-gray-900"
              />

              <button
                type="button"
                onClick={copyTemporaryPassword}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Copy size={17} />
                Copy password
              </button>
            </div>

            {copyMessage && (
              <p className="mt-2 text-sm text-gray-700" aria-live="polite">
                {copyMessage}
              </p>
            )}

            <p className="mt-3 text-xs leading-5 text-gray-600">
              Deliver this password to the voter through a secure channel. Do not share it publicly
              or leave it visible on a shared screen. The voter should change it at first login.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setCopyMessage('');
              setError('');
              setFormOpen(true);
            }}
            className="mt-5 text-sm font-semibold text-[#168a40] underline underline-offset-4"
          >
            Register another voter
          </button>
        </div>
      )}
    </section>
  );
}
