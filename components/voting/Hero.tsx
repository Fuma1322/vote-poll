'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Clock3, Search, UserRound } from 'lucide-react';
import { ProfessionalRole } from '../auth/Register';

export type Candidate = {
  id: string;
  fullName: string;
  specialty: string;
  role: ProfessionalRole;
};

type HeroProps = {
  role: ProfessionalRole;
  candidates?: Candidate[];
  onSelectCandidate?: (candidate: Candidate) => void;
  secondsRemaining: number;
  voterName: string;
};

const sampleCandidates: Candidate[] = [
  { id: 'doc-1', fullName: 'Dr. Lerato Phiri', specialty: 'Internal Medicine', role: 'DOCTOR' },
  { id: 'doc-2', fullName: 'Dr. Kabelo Motsepe', specialty: 'Surgery', role: 'DOCTOR' },
  { id: 'doc-3', fullName: 'Dr. Nthabiseng Dlamini', specialty: 'Pediatrics', role: 'DOCTOR' },
  { id: 'doc-4', fullName: 'Dr. Refilwe Mokoena', specialty: 'Emergency Medicine', role: 'DOCTOR' },
  {
    id: 'pharm-1',
    fullName: 'Pharm. Palesa Thabane',
    specialty: 'Clinical Pharmacy',
    role: 'PHARMACIST',
  },
  {
    id: 'pharm-2',
    fullName: 'Pharm. Thabo Mofokeng',
    specialty: 'Hospital Pharmacy',
    role: 'PHARMACIST',
  },
  {
    id: 'pharm-3',
    fullName: 'Pharm. Mpho Rantšo',
    specialty: 'Pharmacy Services',
    role: 'PHARMACIST',
  },
  { id: 'dent-1', fullName: 'Dr. Napo Mokhele', specialty: 'General Dentistry', role: 'DENTIST' },
  { id: 'dent-2', fullName: "Dr. 'Masechaba Ralebese", specialty: 'Oral Health', role: 'DENTIST' },
  {
    id: 'dent-3',
    fullName: 'Dr. Teboho Khiba',
    specialty: 'Restorative Dentistry',
    role: 'DENTIST',
  },
];

const roleLabels: Record<ProfessionalRole, string> = {
  DOCTOR: 'Doctor',
  PHARMACIST: 'Pharmacist',
  DENTIST: 'Dentist',
};

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

export default function Hero({
  role,
  candidates = sampleCandidates,
  onSelectCandidate,
  secondsRemaining,
  voterName,
}: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const roleCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.role === role),
    [candidates, role]
  );

  const filteredCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return roleCandidates;

    return roleCandidates.filter((candidate) =>
      `${candidate.fullName} ${candidate.specialty}`.toLowerCase().includes(query)
    );
  }, [roleCandidates, searchQuery]);

  // Demo data only. Replace with actual election statistics from the server.
  const progress = {
    DOCTOR: { voted: 48, total: 80 },
    PHARMACIST: { voted: 32, total: 60 },
    DENTIST: { voted: 20, total: 50 },
  }[role];

  const percentage = Math.round((progress.voted / progress.total) * 100);
  const isTimeLow = secondsRemaining <= 30;

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-5 border-b border-gray-100 pb-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168a40]">
              Hospital Committee Election
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome, {voterName}
            </h1>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Review the candidates and choose your representative.
            </p>
          </div>

          <div
            className={`flex w-fit items-center gap-3 rounded-xl border px-4 py-3 ${
              isTimeLow ? 'border-red-200 bg-red-50' : 'border-[#25D366]/40 bg-[#25D366]/5'
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isTimeLow ? 'bg-red-100 text-red-600' : 'bg-[#25D366]/15 text-[#111111]'
              }`}
            >
              <Clock3 size={20} />
            </div>

            <div>
              <p className="text-xs text-gray-500">Time remaining</p>
              <p
                aria-live="polite"
                className={`font-mono text-lg font-bold ${
                  isTimeLow ? 'text-red-600' : 'text-[#111111]'
                }`}
              >
                {formatTime(secondsRemaining)}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Your voting category</p>
              <h2 className="mt-1 text-xl font-bold">{roleLabels[role]} candidates</h2>
            </div>

            <span className="rounded-full bg-[#25D366]/15 px-3 py-1.5 text-xs font-semibold text-[#166534]">
              {roleCandidates.length} candidates
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Voter participation</span>
            <span className="font-semibold">
              {progress.voted} / {progress.total} ({percentage}%)
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={`${roleLabels[role]} voter participation`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100"
          >
            <div
              className="h-full rounded-full bg-[#25D366] transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-bold">Choose your candidate</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a name to review and confirm your vote.
          </p>

          <label className="relative mt-5 block">
            <Search
              size={19}
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by candidate name or specialty..."
              aria-label="Search candidates"
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
            />
          </label>

          <div className="mt-4 space-y-3">
            {filteredCandidates.map((candidate) => (
              <button
                type="button"
                key={candidate.id}
                disabled={secondsRemaining <= 0}
                onClick={() => onSelectCandidate?.(candidate)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-[#25D366] hover:bg-[#25D366]/[0.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#111111]">
                  <UserRound size={23} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{candidate.fullName}</span>
                  <span className="mt-1 block text-sm text-gray-500">{candidate.specialty}</span>
                </span>

                <ArrowRight
                  size={20}
                  className="shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-[#168a40]"
                />
              </button>
            ))}

            {filteredCandidates.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-12 text-center">
                <Search size={28} className="mx-auto text-gray-300" />
                <h3 className="mt-3 font-semibold">No candidates found</h3>
                <p className="mt-1 text-sm text-gray-500">Try another name or specialty.</p>
              </div>
            )}
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-5 text-gray-400">
          Please review your selection carefully before confirming your vote.
        </p>
      </div>
    </main>
  );
}
