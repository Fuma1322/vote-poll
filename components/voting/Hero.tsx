'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Clock3, Search, UserRound } from 'lucide-react';

export type BallotCandidate = {
  id: string;
  name: string;
  manifesto: string | null;
  photoUrl: string | null;
};

export type BallotPosition = {
  id: string;
  name: string;
  description: string | null;
  seatsAvailable: number;
  candidates: BallotCandidate[];
};

export type Candidate = {
  id: string;
  positionId: string;
  positionName: string;
  fullName: string;
  specialty: string;
  manifesto: string;
};

type HeroProps = {
  electionTitle: string;
  positions: BallotPosition[];
  selections: Record<string, Candidate>;
  onSelectCandidate: (candidate: Candidate) => void;
  onReviewVote: () => void;
  secondsRemaining: number;
  voterName: string;
  loading?: boolean;
  error?: string;
};

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);

  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

export default function Hero({
  electionTitle,
  positions,
  selections,
  onSelectCandidate,
  onReviewVote,
  secondsRemaining,
  voterName,
  loading = false,
  error = '',
}: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.trim().toLowerCase();
  const isTimeLow = secondsRemaining <= 60;

  const selectedCount = Object.keys(selections).length;

  const filteredPositions = useMemo(
    () =>
      positions.map((position) => ({
        ...position,
        candidates: position.candidates.filter((candidate) => {
          if (!query) return true;

          return `${candidate.name} ${candidate.manifesto ?? ''} ${position.name}`
            .toLowerCase()
            .includes(query);
        }),
      })),
    [positions, query]
  );

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
              Review each position and select your preferred candidate.
            </p>

            <p className="mt-2 text-sm font-semibold text-[#168a40]">{electionTitle}</p>
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
              <p className="text-xs text-gray-500">Session time remaining</p>
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

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Your ballot</h2>
              <p className="mt-1 text-sm text-gray-500">
                Select one candidate for each position you wish to vote for.
              </p>
            </div>

            <span className="rounded-full bg-[#25D366]/15 px-3 py-1.5 text-xs font-semibold text-[#166534]">
              {selectedCount} position{selectedCount === 1 ? '' : 's'} selected
            </span>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Election candidates</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your ballot is loaded from the election server.
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
              placeholder="Search candidates or positions..."
              aria-label="Search candidates or positions"
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
            />
          </label>

          {loading ? (
            <div
              role="status"
              className="mt-6 rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-500"
            >
              Loading the official ballot…
            </div>
          ) : positions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-5 py-12 text-center">
              <h3 className="font-semibold">No positions are available</h3>
              <p className="mt-1 text-sm text-gray-500">
                The administrator needs to configure this election.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {filteredPositions.map((position) => {
                const chosen = selections[position.id];

                return (
                  <section
                    key={position.id}
                    className="rounded-2xl border border-gray-200 p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{position.name}</h3>
                        {position.description && (
                          <p className="mt-1 text-sm text-gray-500">{position.description}</p>
                        )}
                      </div>

                      {chosen && (
                        <span className="rounded-full bg-[#25D366]/15 px-3 py-1 text-xs font-semibold text-[#166534]">
                          Selection made
                        </span>
                      )}
                    </div>

                    {position.candidates.length === 0 ? (
                      <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                        No approved candidates are available for this position.
                      </p>
                    ) : (
                      <div className="mt-5 space-y-3">
                        {position.candidates
                          .filter((candidate) => {
                            if (!query) return true;

                            return `${candidate.name} ${candidate.manifesto ?? ''} ${position.name}`
                              .toLowerCase()
                              .includes(query);
                          })
                          .map((candidate) => {
                            const isSelected = chosen?.id === candidate.id;

                            return (
                              <button
                                type="button"
                                key={candidate.id}
                                disabled={secondsRemaining <= 0}
                                aria-pressed={isSelected}
                                onClick={() =>
                                  onSelectCandidate({
                                    id: candidate.id,
                                    positionId: position.id,
                                    positionName: position.name,
                                    fullName: candidate.name,
                                    specialty: position.name,
                                    manifesto: candidate.manifesto ?? '',
                                  })
                                }
                                className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:p-5 ${
                                  isSelected
                                    ? 'border-[#25D366] bg-[#25D366]/[0.06] ring-1 ring-[#25D366]'
                                    : 'border-gray-200 bg-white hover:border-[#25D366] hover:bg-[#25D366]/[0.03]'
                                }`}
                              >
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#25D366]/15 text-[#111111]">
                                  {candidate.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={candidate.photoUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <UserRound size={23} />
                                  )}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block font-semibold">{candidate.name}</span>
                                  {candidate.manifesto && (
                                    <span className="mt-1 block whitespace-pre-line text-sm leading-5 text-gray-500">
                                      {candidate.manifesto}
                                    </span>
                                  )}
                                </span>

                                {isSelected ? (
                                  <span className="shrink-0 text-sm font-bold text-[#168a40]">
                                    Selected
                                  </span>
                                ) : (
                                  <ArrowRight
                                    size={20}
                                    className="shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-[#168a40]"
                                  />
                                )}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-gray-100 pt-6">
          <p className="text-center text-xs leading-5 text-gray-400">
            Review your selections carefully. A submitted ballot cannot be changed.
          </p>

          <button
            type="button"
            onClick={onReviewVote}
            disabled={loading || selectedCount === 0 || secondsRemaining <= 0}
            className="w-full max-w-sm rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#1fbd59] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Review and cast vote ({selectedCount})
          </button>
        </div>
      </div>
    </main>
  );
}
