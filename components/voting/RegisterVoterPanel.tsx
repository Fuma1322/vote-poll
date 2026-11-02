'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';

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

function getProfessionLabel(category: string) {
  const labels: Record<string, string> = {
    DOCTOR: 'Doctor',
    PHARMACIST: 'Pharmacist',
    DENTIST: 'Dentist',
  };

  return labels[category] || category;
}

export default function RegisterVoterPanel() {
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
      setCopyMessage('Temporary password copied successfully.');
    } catch {
      setCopyMessage('Copy failed. Select the password and copy it manually.');
    }
  }

  function resetRegistration() {
    setResult(null);
    setError('');
    setCopyMessage('');
  }

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Page heading */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#25D366]/20 bg-[#25D366]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#168a40]">
                <span className="h-2 w-2 rounded-full bg-[#25D366]" />
                Voter administration
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
                Register a new voter
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                Create an account for an eligible healthcare professional. Enter their details below
                to generate their voting portal credentials.
              </p>
            </div>

            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#25D366]/20 bg-white text-[#168a40] shadow-sm sm:flex">
              <UserPlus size={27} />
            </div>
          </div>
        </div>

        {result ? (
          /* Registration success */
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gradient-to-br from-[#25D366]/10 to-white px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#168a40]">
                <CheckCircle2 size={34} />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-[#111111]">
                Voter registered successfully
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                The voter account has been created. Review the account details and securely share
                the temporary password.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
                Voter account details
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">Full name</p>
                  <p className="mt-1 font-bold text-gray-900">{result.voter.full_name}</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">Profession</p>
                  <p className="mt-1 font-bold text-gray-900">
                    {getProfessionLabel(result.voter.professional_category)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">Email address</p>
                  <p className="mt-1 break-all font-semibold text-gray-900">{result.voter.email}</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">Registration number</p>
                  <p className="mt-1 font-bold text-gray-900">{result.voter.registration_number}</p>
                </div>
              </div>

              {/* Temporary password */}
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <KeyRound size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">Temporary login password</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Securely share this password with the registered voter.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="temporary-password"
                    type="text"
                    readOnly
                    value={result.temporaryPassword}
                    autoComplete="off"
                    className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm font-semibold tracking-wide text-gray-900 outline-none"
                  />

                  <button
                    type="button"
                    onClick={copyTemporaryPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    <Copy size={16} />
                    Copy password
                  </button>
                </div>

                {copyMessage && (
                  <p className="mt-3 text-sm font-medium text-gray-700" aria-live="polite">
                    {copyMessage}
                  </p>
                )}

                <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-amber-800">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                  <p>
                    Do not share this password publicly or leave it visible on a shared screen. The
                    voter must change their password at first login.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetRegistration}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#1fbd59] sm:w-auto"
              >
                <UserPlus size={18} />
                Register another voter
              </button>
            </div>
          </div>
        ) : (
          /* Full-width registration form */
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#168a40]">
                  <UserPlus size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-[#111111]">Voter information</h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Complete all required fields to register a voter.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <RegisterForm
                onSubmit={handleRegister}
                onBack={() => setError('')}
                loading={loading}
                error=""
              />
            </div>

            <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:px-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={15} className="text-[#168a40]" />
                  Voter information is handled securely.
                </div>

                <p className="text-xs text-gray-400">
                  Supported professions: Doctors, Pharmacists and Dentists
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
