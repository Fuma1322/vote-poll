'use client';

import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  UserRound,
  BriefcaseMedical,
  Hash,
  ChevronDown,
  LockKeyhole,
} from 'lucide-react';

export type ProfessionalRole = 'DOCTOR' | 'PHARMACIST' | 'DENTIST';

export type RegisterFormData = {
  fullName: string;
  employeeNumber: string;
  idNumber: string;
  email: string;
  role: ProfessionalRole;
};

type RegisterFormProps = {
  onSubmit: (data: RegisterFormData) => void | Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
};

export default function RegisterForm({
  onSubmit,
  onBack,
  loading = false,
  error,
}: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProfessionalRole>('DOCTOR');
  const [validationError, setValidationError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    if (!fullName.trim() || !employeeNumber.trim() || !idNumber.trim() || !email.trim()) {
      setValidationError('Please complete all fields.');
      return;
    }

    setValidationError('');

    await onSubmit({
      fullName: fullName.trim(),
      employeeNumber: employeeNumber.trim(),
      idNumber: idNumber.trim(),
      email: email.trim().toLowerCase(),
      role,
    });
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200/90 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm text-[#111111] placeholder:text-gray-400 outline-none transition duration-200 hover:border-gray-300 focus:border-[#25D366] focus:bg-white focus:ring-4 focus:ring-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-60';

  const labelClass = 'mb-2 block text-[13px] font-semibold tracking-wide text-gray-700';

  return (
    <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_80px_-24px_rgba(17,17,17,0.18)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#25D366] via-[#25D366] to-emerald-200" />

      <div className="p-6 sm:p-9 lg:p-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-gray-500 transition hover:text-[#168A40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] disabled:opacity-50"
          >
            <ArrowLeft size={17} />
            Back to login
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 scale-125 rounded-2xl bg-[#25D366]/10 blur-xl" />
            <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-[#25D366]/20 bg-gradient-to-br from-[#25D366]/15 to-[#25D366]/5 text-[#168A40] shadow-sm">
              <ShieldCheck size={34} strokeWidth={1.8} />
            </div>
          </div>

          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#25D366]/25 bg-[#25D366]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#168A40]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
            Voter Administration
          </span>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
            Register a voter
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
            Add an eligible healthcare professional to the official hospital election register.
          </p>
        </div>

        <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Full names
            </label>
            <div className="relative">
              <UserRound
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="fullName"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter full names"
                className={inputClass}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="employeeNumber" className={labelClass}>
                Employee / registration number
              </label>
              <div className="relative">
                <Hash
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="employeeNumber"
                  name="employeeNumber"
                  autoComplete="off"
                  value={employeeNumber}
                  onChange={(event) => setEmployeeNumber(event.target.value)}
                  placeholder="e.g. TRC-DOCTOR-010"
                  className={inputClass}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="idNumber" className={labelClass}>
                National ID number
              </label>
              <div className="relative">
                <ShieldCheck
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="idNumber"
                  name="idNumber"
                  autoComplete="off"
                  value={idNumber}
                  onChange={(event) => setIdNumber(event.target.value)}
                  placeholder="National ID number"
                  className={inputClass}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="registerEmail" className={labelClass}>
              Email address
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="registerEmail"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@hospital.org"
                className={inputClass}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="professionalRole" className={labelClass}>
              Professional role
            </label>
            <div className="relative">
              <BriefcaseMedical
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                id="professionalRole"
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value as ProfessionalRole)}
                className={`${inputClass} appearance-none pr-11`}
                disabled={loading}
              >
                <option value="DOCTOR">Doctor</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="DENTIST">Dentist</option>
              </select>
              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/[0.06] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#168A40] shadow-sm">
              <LockKeyhole size={17} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#111111]">Secure voter registration</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                Registration is restricted to authorized administrators. Temporary passwords must be
                delivered securely, and voters must change them according to the account policy.
              </p>
            </div>
          </div>

          {(validationError || error) && (
            <p
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {validationError || error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-4 text-sm font-bold text-[#111111] shadow-lg shadow-[#25D366]/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#20c45c] hover:shadow-xl hover:shadow-[#25D366]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? 'Registering voter...' : 'Register voter'}
            {!loading && (
              <ArrowLeft
                size={17}
                className="rotate-180 transition-transform group-hover:translate-x-1"
              />
            )}
          </button>

          <p className="text-center text-[11px] leading-5 text-gray-400">
            HospitalVote · Authorized voter administration
          </p>
        </form>
      </div>
    </div>
  );
}
