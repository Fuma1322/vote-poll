'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Clock3, RefreshCw, Trophy, Vote } from 'lucide-react';

type CandidateResult = {
  id: string;
  fullName: string;
  votes: number;
};

type ProfessionResult = {
  role: 'DOCTOR' | 'PHARMACIST' | 'DENTIST';
  title: string;
  candidates: CandidateResult[];
  totalVotes: number;
};

type ResultsResponse = {
  categories: ProfessionResult[];
  updatedAt: string;
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

export default function VoterStatisticsPage() {
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const loadResults = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);

    try {
      const response = await fetch('/api/results', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Live results are not available yet.');
      }

      const data: ResultsResponse = await response.json();

      setResults(data);
      setError('');
      setLastChecked(new Date());
    } catch {
      setError('Unable to connect to live results. Check that the results API is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadResults();

    // Poll the backend every five seconds for updated results.
    const interval = window.setInterval(() => {
      void loadResults(true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadResults]);

  const categories = professions.map((profession) => {
    const liveCategory = results?.categories.find((category) => category.role === profession.role);

    return {
      ...profession,
      candidates: liveCategory?.candidates ?? [],
      totalVotes: liveCategory?.totalVotes ?? 0,
      hasData: Boolean(liveCategory),
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
              Hospital Committee Election · Results update automatically
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
                {results ? 'LIVE RESULTS' : 'CONNECTING'}
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
              {loading && ' Connecting…'}
            </div>
          )}

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 xl:gap-5">
            {categories.map((category) => (
              <section
                key={category.role}
                className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-100 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                        {category.shortTitle}
                      </p>
                      <h3 className="mt-1 text-xl font-extrabold sm:text-2xl">{category.title}</h3>
                    </div>

                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${category.accent}18`,
                        color: category.accent,
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
                  {!category.hasData || category.candidates.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 text-center">
                      <Activity size={24} className="text-gray-300" />
                      <p className="mt-3 text-sm font-semibold text-gray-600">
                        Waiting for live data
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-400">
                        Candidate results will appear when the API supplies them.
                      </p>
                    </div>
                  ) : (
                    [...category.candidates]
                      .sort((a, b) => b.votes - a.votes)
                      .map((candidate, index) => {
                        const percentage =
                          category.totalVotes > 0
                            ? (candidate.votes / category.totalVotes) * 100
                            : 0;

                        const isLeader =
                          candidate.votes > 0 &&
                          candidate.votes ===
                            Math.max(...category.candidates.map((item) => item.votes));

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
                                  backgroundColor: category.accent,
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
            ))}
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500">
          <p>HospitalVote · Official election results display</p>
          <p>Automatic refresh every 5 seconds</p>
        </footer>
      </div>
    </main>
  );
}
