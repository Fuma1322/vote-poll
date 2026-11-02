'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Clock3, RefreshCw, Trophy, Vote } from 'lucide-react';

type ProfessionalRole = 'DOCTOR' | 'PHARMACIST' | 'DENTIST';

type CandidateResult = {
  id: string;
  fullName: string;
  votes: number;
};

type ProfessionResult = {
  role: ProfessionalRole;
  title: string;
  candidates: CandidateResult[];
  totalVotes: number;
};

type Election = {
  id: string;
  title: string;
  status: string;
};

type LiveResultsResponse = {
  election: {
    id: string;
    title: string;
    status: string;
    resultsPublished: boolean;
    opensAt: string | null;
    closesAt: string | null;
  };
  positions: {
    id: string;
    name: string;
    seatsAvailable: number;
    totalVotes: number;
    candidates: {
      id: string;
      name: string;
      professionalCategory: ProfessionalRole;
      votesReceived: number;
    }[];
  }[];
};

const professions = [
  {
    role: 'DOCTOR',
    title: 'Doctors',
    shortTitle: 'Medical Professionals',
    accent: '#25D366',
  },
  {
    role: 'PHARMACIST',
    title: 'Pharmacists',
    shortTitle: 'Pharmacy Professionals',
    accent: '#0EA5E9',
  },
  {
    role: 'DENTIST',
    title: 'Dentists',
    shortTitle: 'Dental Professionals',
    accent: '#8B5CF6',
  },
] as const;

const REFRESH_INTERVAL = 10000;

export default function VoterStatisticsPage() {
  const [results, setResults] = useState<LiveResultsResponse | null>(null);

  const [activeElection, setActiveElection] = useState<Election | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const initialLoadStarted = useRef(false);

  // Find the currently open election.
  const findActiveElection = useCallback(async () => {
    const response = await fetch('/api/admin/elections', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Unable to retrieve elections.');
    }

    const elections: Election[] = Array.isArray(data)
      ? data
      : Array.isArray(data.elections)
        ? data.elections
        : [];

    const openElection = elections.find((election) => election.status === 'OPEN');

    return openElection ?? null;
  }, []);

  // Retrieve the live results for the selected election.
  const loadResults = useCallback(
    async (silent = false) => {
      if (!silent) {
        setRefreshing(true);
      }

      try {
        let election = activeElection;

        // On the initial request, identify the open election.
        if (!election) {
          election = await findActiveElection();

          if (!election) {
            setActiveElection(null);
            setResults(null);
            setError('There is currently no open election.');
            return;
          }

          setActiveElection(election);
        }

        const response = await fetch(`/api/admin/elections/${election.id}/live-results`, {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });

        const data = await response.json();

        if (response.status === 409) {
          setActiveElection(null);
          setResults(null);
          setError(data.error || 'This election is no longer accepting votes.');
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Unable to retrieve live results.');
        }

        const liveData = data as LiveResultsResponse;

        setResults(liveData);
        setError('');
        setLastChecked(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to connect to live results.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeElection, findActiveElection]
  );

  // Initial election lookup.
  useEffect(() => {
    if (initialLoadStarted.current) return;

    initialLoadStarted.current = true;
    void loadResults();
  }, [loadResults]);

  // Automatically refresh while an election is active.
  useEffect(() => {
    if (!activeElection) return;

    const interval = window.setInterval(() => {
      void loadResults(true);
    }, REFRESH_INTERVAL);

    return () => window.clearInterval(interval);
  }, [activeElection, loadResults]);

  // Convert the backend positions response into profession groups.
  const categories: ProfessionResult[] = professions.map((profession) => {
    const candidates = (results?.positions ?? []).flatMap((position) =>
      position.candidates
        .filter((candidate) => candidate.professionalCategory === profession.role)
        .map((candidate) => ({
          id: candidate.id,
          fullName: candidate.name,
          votes: candidate.votesReceived,
        }))
    );

    return {
      role: profession.role,
      title: profession.title,
      candidates,
      totalVotes: candidates.reduce((total, candidate) => total + candidate.votes, 0),
    };
  });

  return (
    <main className="min-h-full p-4 text-[#111111] sm:p-6 xl:p-7">
      <div className="mx-auto max-w-[1800px]">
        {/* Page heading */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#168A40]">
              <Activity size={16} />
              ELECTION MONITOR
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl xl:text-4xl">
              Live Voting Results
            </h1>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {results?.election.title || 'Hospital Committee Election'}
              {' · '}
              Results update automatically
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  results ? 'animate-pulse bg-[#25D366]' : 'bg-amber-500'
                }`}
              />

              <span className="text-xs font-bold tracking-wide sm:text-sm">
                {results ? 'LIVE RESULTS' : loading ? 'CONNECTING' : 'NOT LIVE'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void loadResults()}
              disabled={refreshing}
              aria-label="Refresh results"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Election information */}
        {results && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-green-100 bg-green-50/60 px-4 py-3">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
              {results.election.status}
            </span>

            <p className="text-sm text-gray-600">
              Election:{' '}
              <span className="font-semibold text-gray-900">{results.election.title}</span>
            </p>

            {results.election.closesAt && (
              <p className="text-sm text-gray-500">
                Closes: {new Date(results.election.closesAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Profession results */}
        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">Results by Profession</h2>
            </div>

            {lastChecked && (
              <p className="hidden items-center gap-1.5 text-xs text-gray-500 sm:flex">
                <Clock3 size={14} />
                Updated {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>

          {error && (
            <div
              role="status"
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 xl:gap-5">
            {categories.map((category) => {
              const profession = professions.find((item) => item.role === category.role)!;

              return (
                <section
                  key={category.role}
                  className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="border-b border-gray-100 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                          {profession.shortTitle}
                        </p>

                        <h3 className="mt-1 text-xl font-extrabold sm:text-2xl">
                          {category.title}
                        </h3>
                      </div>

                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${profession.accent}18`,
                          color: profession.accent,
                        }}
                      >
                        <Vote size={22} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Total votes</p>

                        <p className="mt-0.5 text-3xl font-extrabold tabular-nums">
                          {category.totalVotes.toLocaleString()}
                        </p>
                      </div>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {category.candidates.length} candidates
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-5 p-4 sm:p-5">
                    {!results || category.candidates.length === 0 ? (
                      <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 text-center">
                        <Activity size={24} className="text-gray-300" />

                        <p className="mt-3 text-sm font-semibold text-gray-600">
                          {results ? 'No candidates found' : 'Waiting for live data'}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-400">
                          {results
                            ? 'No approved candidates are currently listed for this profession.'
                            : 'Candidate results will appear when the API supplies them.'}
                        </p>
                      </div>
                    ) : (
                      [...category.candidates]
                        .sort((a, b) => b.votes - a.votes)
                        .map((candidate, index, sortedCandidates) => {
                          const percentage =
                            category.totalVotes > 0
                              ? (candidate.votes / category.totalVotes) * 100
                              : 0;

                          const highestVotes = Math.max(
                            ...sortedCandidates.map((item) => item.votes)
                          );

                          const isLeader = candidate.votes > 0 && candidate.votes === highestVotes;

                          return (
                            <div key={candidate.id}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${
                                      isLeader
                                        ? 'bg-[#25D366]/15 text-[#168A40]'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    {index + 1}
                                  </div>

                                  <div className="min-w-0 pt-0.5">
                                    <p className="break-words text-sm font-bold leading-5 sm:text-base">
                                      {candidate.fullName}
                                    </p>

                                    {isLeader && (
                                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#168A40]">
                                        <Trophy size={11} />
                                        Current leader
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-lg font-extrabold tabular-nums sm:text-xl">
                                    {candidate.votes.toLocaleString()}
                                  </p>

                                  <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                                </div>
                              </div>

                              <div
                                className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100"
                                role="progressbar"
                                aria-label={`${candidate.fullName} vote share`}
                                aria-valuenow={Math.round(percentage)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: profession.accent,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                      <span>Vote distribution</span>

                      <span className="font-semibold text-gray-700">
                        {category.totalVotes.toLocaleString()} votes counted
                      </span>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500">
          <p>HospitalVote · Official election results display</p>

          <p>
            {activeElection ? 'Automatic refresh every 10 seconds' : 'Automatic refresh paused'}
          </p>
        </footer>
      </div>
    </main>
  );
}
