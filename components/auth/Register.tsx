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
    'w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm text-[#111111] placeholder:text-gray-400 outline-none transition duration-200 hover:border-gray-300 focus:border-[#25D366] focus:bg-white focus:ring-4 focus:ring-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-60';

  const labelClass = 'mb-2 block text-[13px] font-semibold tracking-wide text-gray-700';

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-7">
      {/* Form heading */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111111]">Professional details</h3>
          <p className="mt-1 text-sm text-gray-500">
            Enter the personal and professional information of the voter.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#168A40] disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
        {/* Full name */}
        <div className="md:col-span-2">
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
              placeholder="Enter the voter's full names"
              className={inputClass}
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Employee number */}
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

        {/* National ID */}
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
              placeholder="Enter national ID number"
              className={inputClass}
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Email */}
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

        {/* Professional role */}
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
      </div>

      {/* Security notice */}
      <div className="flex gap-3 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/[0.06] p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#168A40] shadow-sm">
          <LockKeyhole size={18} />
        </div>

        <div>
          <p className="text-sm font-bold text-[#111111]">Secure voter registration</p>

          <p className="mt-1 text-xs leading-5 text-gray-600">
            Registration is restricted to authorized administrators. Temporary passwords must be
            delivered securely, and voters must change them according to the account policy.
          </p>
        </div>
      </div>

      {/* Errors */}
      {(validationError || error) && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          <ShieldCheck size={17} className="mt-0.5 shrink-0" />
          <p>{validationError || error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-gray-400">
          Please verify the information before creating the voter account.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-8 py-4 text-sm font-bold text-[#111111] shadow-lg shadow-[#25D366]/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#20c45c] hover:shadow-xl hover:shadow-[#25D366]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
        >
          {loading ? 'Registering voter...' : 'Register voter'}

          {!loading && (
            <ArrowLeft
              size={17}
              className="rotate-180 transition-transform group-hover:translate-x-1"
            />
          )}
        </button>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        HospitalVote · Authorized voter administration
      </p>
    </form>
  );
}
