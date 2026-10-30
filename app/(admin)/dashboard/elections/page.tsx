'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Plus,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';

type Election = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
  results_published: boolean;
  created_at: string;
  position_count: number;
  eligible_voter_count: number;
};

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-50 text-blue-700',
  OPEN: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Maseru',
  }).format(date);
}

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const loadElections = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await fetch('/api/admin/elections', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || `Could not load elections (${response.status}).`
        );
      }

      if (!Array.isArray(payload?.elections)) {
        throw new Error('The server returned an unexpected elections response.');
      }

      setElections(payload.elections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load elections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadElections();
  }, [loadElections]);

  async function handleCreateElection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Enter an election title.');
      return;
    }

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/elections', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || `Election creation failed (${response.status}).`
        );
      }

      if (!payload?.election?.id) {
        throw new Error('The server did not return the created election.');
      }

      setSuccess(`"${payload.election.title}" was created successfully.`);
      setTitle('');
      setDescription('');
      setFormOpen(false);

      await loadElections(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the election.');
    } finally {
      setCreating(false);
    }
  }

  const openCount = elections.filter((item) => item.status === 'OPEN').length;
  const scheduledCount = elections.filter((item) => item.status === 'SCHEDULED').length;
  const draftCount = elections.filter((item) => item.status === 'DRAFT').length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168a40]">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            Elections
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Create elections, monitor their progress, and manage their preparation before voting
            opens.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadElections(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setFormOpen((open) => !open);
              setError('');
              setSuccess('');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-[#20c45a]"
          >
            {formOpen ? <X size={18} /> : <Plus size={18} />}
            {formOpen ? 'Cancel' : 'Create election'}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <CircleAlert size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          {success}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleCreateElection}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-xl font-bold text-gray-900">Create an election</h2>
          <p className="mt-1 text-sm text-gray-500">
            This creates a draft. You can configure its positions, voters, candidates, and schedule
            afterward.
          </p>

          <div className="mt-6 grid gap-5">
            <div>
              <label
                htmlFor="election-title"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Election title
              </label>
              <input
                id="election-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={200}
                placeholder="e.g. Hospital Committee Election 2026"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
              />
            </div>

            <div>
              <label
                htmlFor="election-description"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Description
              </label>
              <textarea
                id="election-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Describe the purpose of this election..."
                className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create draft election'}
            </button>
          </div>
        </form>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total elections"
          value={loading ? '—' : elections.length}
          icon={<ClipboardList size={20} />}
        />
        <StatCard
          label="Scheduled"
          value={loading ? '—' : scheduledCount}
          icon={<CalendarDays size={20} />}
        />
        <StatCard
          label="Currently open"
          value={loading ? '—' : openCount}
          icon={<Activity size={20} />}
        />
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#111111]">All elections</h2>
            <p className="mt-1 text-sm text-gray-500">
              Election records retrieved from the backend.
            </p>
          </div>
          {!loading && (
            <span className="text-xs font-medium text-gray-400">
              {draftCount} draft{draftCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Loading elections...
          </div>
        ) : elections.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#168a40]">
              <CalendarDays size={26} />
            </div>
            <h3 className="mt-4 font-bold text-gray-900">No elections found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first election to begin setting up the voting process.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {elections.map((election) => (
              <article
                key={election.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-[#111111]">
                      {election.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                      {election.description || 'No description provided.'}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                      statusStyles[election.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {election.status.replaceAll('_', ' ')}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Metric
                    icon={<ClipboardList size={17} />}
                    label="Positions"
                    value={election.position_count ?? 0}
                  />
                  <Metric
                    icon={<Users size={17} />}
                    label="Eligible voters"
                    value={election.eligible_voter_count ?? 0}
                  />
                </div>

                <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex items-start gap-3 text-sm">
                    <CalendarDays size={17} className="mt-0.5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Opens</p>
                      <p className="mt-1 font-medium text-gray-800">
                        {formatDate(election.opens_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Activity size={17} className="mt-0.5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Closes</p>
                      <p className="mt-1 font-medium text-gray-800">
                        {formatDate(election.closes_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">Created {formatDate(election.created_at)}</p>
                  <Link
                    href={`/dashboard/elections/${election.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Manage election
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#168a40]">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-[#111111]">{value}</p>
    </article>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
      <span className="text-[#168a40]">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-0.5 font-bold tabular-nums text-[#111111]">{value}</p>
      </div>
    </div>
  );
}
