'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck, UserRound, BriefcaseMedical, Hash } from 'lucide-react';

export type ProfessionalRole = 'DOCTOR' | 'PHARMACIST' | 'DENTIST';

export type RegisterFormData = {
  fullName: string;
  employeeNumber: string;
  idNumber: string;
  email: string;
  role: ProfessionalRole;
};

type RegisterFormProps = {
  onSubmit?: (data: RegisterFormData) => void;
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim() || !employeeNumber.trim() || !idNumber.trim() || !email.trim()) {
      setValidationError('Please complete all fields.');
      return;
    }

    setValidationError('');

    onSubmit?.({
      fullName: fullName.trim(),
      employeeNumber: employeeNumber.trim(),
      idNumber: idNumber.trim(),
      email: email.trim().toLowerCase(),
      role,
    });
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-black/5 sm:p-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#111111]"
        >
          <ArrowLeft size={17} />
          Back to login
        </button>
      )}

      <div className="mb-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#111111]">
          <ShieldCheck size={32} />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Register a voter</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Add an eligible health professional to the hospital voter register.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[#111111]">
            Full Names
          </label>
          <div className="relative">
            <UserRound
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter full names"
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-[#111111] outline-none focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="employeeNumber" className="mb-2 block text-sm font-medium text-[#111111]">
            Employee Number
          </label>
          <div className="relative">
            <Hash size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="employeeNumber"
              autoComplete="off"
              value={employeeNumber}
              onChange={(event) => setEmployeeNumber(event.target.value)}
              placeholder="Enter employee number"
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-[#111111] outline-none focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="idNumber" className="mb-2 block text-sm font-medium text-[#111111]">
            ID Number
          </label>
          <div className="relative">
            <ShieldCheck
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="idNumber"
              autoComplete="off"
              value={idNumber}
              onChange={(event) => setIdNumber(event.target.value)}
              placeholder="Enter national ID number"
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-[#111111] outline-none focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="registerEmail" className="mb-2 block text-sm font-medium text-[#111111]">
            Email Address
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="registerEmail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@hospital.org"
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-[#111111] outline-none focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="professionalRole"
            className="mb-2 block text-sm font-medium text-[#111111]"
          >
            Professional Role
          </label>
          <div className="relative">
            <BriefcaseMedical
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              id="professionalRole"
              value={role}
              onChange={(event) => setRole(event.target.value as ProfessionalRole)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-[#111111] outline-none focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
            >
              <option value="DOCTOR">Doctor</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="DENTIST">Dentist</option>
            </select>
          </div>
        </div>

        <p className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-3 text-xs leading-5 text-gray-600">
          This form is intended for authorized administrators. A registered voter should receive a
          secure password-setup invitation separately.
        </p>

        {(validationError || error) && (
          <p role="alert" className="text-sm text-red-600">
            {validationError || error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#1fbd59] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Registering voter...' : 'Register voter'}
        </button>
      </form>
    </div>
  );
}
