'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Users,
  UserCheck,
  UserRound,
  Stethoscope,
  Activity,
  RefreshCw,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';

type Election = {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at?: string;
  opens_at?: string;
  closes_at?: string;
};

type ElectionsResponse = {
  elections?: Election[];
  error?: string;
  message?: string;
};

type ProfessionCategory = 'DOCTOR' | 'PHARMACIST' | 'DENTIST';

type ProfessionStat = {
  professionalCategory: ProfessionCategory;
  totalEligibleVoters: number;
  votersWhoVoted: number;
  votersRemaining: number;
  percentage: number;
};

type TurnoutResponse = {
  election: {
    id: string;
    title: string;
    status: string;
  };
  turnout: {
    totalEligibleVoters: number;
    votersWhoVoted: number;
    votersRemaining: number;
    percentage: number;
  };
  professionBreakdown?: ProfessionStat[];
  error?: string;
  message?: string;
};

const professionConfig = [
  {
    key: 'DOCTOR',
    name: 'Doctors',
    description: 'Medical professionals',
    icon: Stethoscope,
  },
  {
    key: 'PHARMACIST',
    name: 'Pharmacists',
    description: 'Pharmacy professionals',
    icon: Activity,
  },
  {
    key: 'DENTIST',
    name: 'Dentists',
    description: 'Dental professionals',
    icon: UserRound,
  },
] as const;

function getErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof data.error === 'string'
  ) {
    return data.error;
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return fallback;
}

export default function DashboardPage() {
  const [election, setElection] = useState<Election | null>(null);

  const [turnout, setTurnout] = useState<TurnoutResponse['turnout'] | null>(null);

  const [professionBreakdown, setProfessionBreakdown] = useState<ProfessionStat[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      // 1. Fetch all administrator elections.
      const electionsResponse = await fetch('/api/admin/elections', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      const electionsData = (await electionsResponse.json()) as ElectionsResponse;

      if (!electionsResponse.ok) {
        throw new Error(getErrorMessage(electionsData, 'Unable to retrieve elections.'));
      }

      const elections = electionsData.elections;

      if (!Array.isArray(elections) || elections.length === 0) {
        setElection(null);
        setTurnout(null);
        setProfessionBreakdown([]);
        setLastUpdated(new Date());
        return;
      }

      // 2. Select the open election.
      // If none is open, select the most recently created election.
      const selectedElection =
        elections.find((item) => item.status === 'OPEN') ??
        [...elections].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;

          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

          return dateB - dateA;
        })[0];

      if (!selectedElection?.id) {
        throw new Error('No valid election was found.');
      }

      setElection(selectedElection);

      // 3. Fetch turnout for the selected election.
      const turnoutResponse = await fetch(
        `/api/admin/elections/${encodeURIComponent(selectedElection.id)}/turnout`,
        {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const turnoutData = (await turnoutResponse.json()) as TurnoutResponse;

      if (!turnoutResponse.ok) {
        throw new Error(getErrorMessage(turnoutData, 'Unable to retrieve election turnout.'));
      }

      if (!turnoutData.turnout) {
        throw new Error('The server returned invalid turnout statistics.');
      }

      setElection((current) =>
        current
          ? {
              ...current,
              title: turnoutData.election?.title || current.title,
              status: turnoutData.election?.status || current.status,
            }
          : current
      );

      setTurnout(turnoutData.turnout);

      setProfessionBreakdown(
        Array.isArray(turnoutData.professionBreakdown) ? turnoutData.professionBreakdown : []
      );

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard loading error:', error);

      setError(error instanceof Error ? error.message : 'Unable to load dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial dashboard load.
  useEffect(() => {
    void loadDashboard(true);
  }, [loadDashboard]);

  // Automatically refresh statistics every 30 seconds.
  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadDashboard(false);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  const totalEligible = turnout?.totalEligibleVoters ?? 0;
  const totalVoted = turnout?.votersWhoVoted ?? 0;
  const totalRemaining = turnout?.votersRemaining ?? 0;
  const overallPercentage = turnout?.percentage ?? 0;

  const statusLabel = election?.status ? election.status.replaceAll('_', ' ') : 'Unknown';

  // Loading state.
  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#25D366]" />

          <p className="mt-4 text-sm font-medium text-gray-600">Loading election statistics...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Dashboard heading */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#168a40]">
              Election overview
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
              Voting Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Follow voter participation across Doctors, Pharmacists, and Dentists in the hospital
              election.
            </p>

            {election && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <CalendarDays size={16} />

                <span className="font-medium text-gray-700">{election.title}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {election && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2 text-sm font-semibold text-[#168a40]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    election.status === 'OPEN' ? 'bg-[#25D366]' : 'bg-gray-400'
                  }`}
                />

                {statusLabel}
              </div>
            )}

            <button
              type="button"
              onClick={() => void loadDashboard(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="mt-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">Unable to update dashboard</p>

              <p className="mt-1">{error}</p>

              <button
                type="button"
                onClick={() => void loadDashboard(false)}
                className="mt-3 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* No election state */}
        {!election && !error && (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <CalendarDays size={36} className="mx-auto text-gray-400" />

            <h2 className="mt-4 text-xl font-bold text-[#111111]">No elections available</h2>

            <p className="mt-2 text-sm text-gray-500">
              Election statistics will appear here once an election has been created.
            </p>
          </div>
        )}

        {/* Election statistics */}
        {election && turnout && (
          <>
            {/* Overall election statistics */}
            <section
              aria-label="Overall voting statistics"
              className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <SummaryCard
                label="Eligible voters"
                value={totalEligible}
                description="Across all professions"
                icon={<Users size={22} />}
              />

              <SummaryCard
                label="Votes recorded"
                value={totalVoted}
                description="Voters who have voted"
                icon={<UserCheck size={22} />}
              />

              <SummaryCard
                label="Yet to vote"
                value={totalRemaining}
                description="Eligible voters remaining"
                icon={<UserRound size={22} />}
              />

              <SummaryCard
                label="Overall turnout"
                value={`${overallPercentage}%`}
                description="Share of eligible voters"
                icon={<Activity size={22} />}
              />
            </section>

            {/* Category-level statistics */}
            <section className="mt-12">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#111111] sm:text-2xl">
                  Participation by profession
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Compare votes recorded with the total eligible voters in each category.
                </p>
              </div>

              {professionBreakdown.length === 0 && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  The backend has not returned profession-specific statistics yet. The cards below
                  will display zero until the breakdown becomes available.
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-3">
                {professionConfig.map((category) => {
                  const stats = professionBreakdown.find(
                    (item) => item.professionalCategory === category.key
                  );

                  const total = stats?.totalEligibleVoters ?? 0;
                  const voted = stats?.votersWhoVoted ?? 0;
                  const remaining = stats?.votersRemaining ?? 0;

                  const percentage = Math.min(100, Math.max(0, stats?.percentage ?? 0));

                  const Icon = category.icon;

                  return (
                    <article
                      key={category.key}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-[#111111]">{category.name}</h3>

                          <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                        </div>

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#168a40]">
                          <Icon size={24} />
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-500">Votes recorded</p>

                            <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#111111]">
                              {voted}
                              <span className="ml-1 text-base font-medium text-gray-400">
                                / {total}
                              </span>
                            </p>
                          </div>

                          <p className="text-lg font-bold tabular-nums text-[#168a40]">
                            {percentage}%
                          </p>
                        </div>

                        <div
                          className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100"
                          role="progressbar"
                          aria-label={`${category.name} voter turnout`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={percentage}
                        >
                          <div
                            className="h-full rounded-full bg-[#25D366] transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                          <span className="text-gray-500">Yet to vote</span>

                          <span className="font-semibold tabular-nums text-[#111111]">
                            {remaining}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Last updated */}
            <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-gray-200 pt-5 text-center sm:flex-row sm:text-left">
              <p className="text-xs leading-5 text-gray-400">
                Statistics are retrieved from the official election records.
              </p>

              {lastUpdated && (
                <p className="text-xs text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  {refreshing ? ' · Refreshing...' : ''}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#168a40]">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-extrabold tracking-tight text-[#111111]">{value}</p>

      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </article>
  );
}
