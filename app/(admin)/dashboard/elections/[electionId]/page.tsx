'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  UserPlus,
  Vote,
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
  position_count: number | string;
  eligible_voter_count: number | string;
};

type Position = {
  id: string;
  name: string;
  description?: string;
  seatsAvailable?: number;
  seats_available?: number;
  displayOrder?: number;
};

type Candidate = {
  id: string;
  election_id?: string;
  position_id: string;
  position_name?: string;
  user_id?: string;
  candidate_name?: string;
  name?: string;
  manifesto?: string;
  photo_url?: string | null;
  is_approved: boolean;
};

type Voter = {
  id: string;
  full_name: string;
  email: string;
  registration_number: string;
  professional_category: 'DOCTOR' | 'PHARMACIST' | 'DENTIST';
  is_active: boolean;
};

type ApiError = {
  error?: string;
  message?: string;
};

const categories = [
  { value: 'DOCTOR', label: 'Doctors' },
  { value: 'PHARMACIST', label: 'Pharmacists' },
  { value: 'DENTIST', label: 'Dentists' },
] as const;

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#25D366] focus:ring-4 focus:ring-green-100';

const buttonPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50';

const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Not set';

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Maseru',
  }).format(date);
}

function statusStyle(status: string) {
  switch (status.toUpperCase()) {
    case 'OPEN':
      return 'bg-green-100 text-green-800';
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-amber-100 text-amber-800';
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `The request failed with status ${response.status}.`
    );
  }

  return data;
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Vote;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
        <Icon size={20} />
      </div>

      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default function ElectionDetailsPage() {
  const params = useParams<{ electionId: string }>();
  const electionId = params.electionId;

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [createdPositions, setCreatedPositions] = useState<Position[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [selectedVoters, setSelectedVoters] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [voterSearch, setVoterSearch] = useState('');
  const [voterCategory, setVoterCategory] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  const [positionName, setPositionName] = useState('');
  const [positionDescription, setPositionDescription] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState('1');
  const [displayOrder, setDisplayOrder] = useState('1');

  const [candidatePositionId, setCandidatePositionId] = useState('');
  const [candidateUserId, setCandidateUserId] = useState('');
  const [manifesto, setManifesto] = useState('');

  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');

  const [ballotPositions, setBallotPositions] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      seatsAvailable?: number;
      candidates: Array<{
        id: string;
        name: string;
        manifesto?: string;
        photoUrl?: string | null;
      }>;
    }>
  >([]);

  const [ballotMessage, setBallotMessage] = useState('');

  const loadElection = useCallback(async () => {
    const response = await fetch('/api/admin/elections', {
      cache: 'no-store',
    });

    const data = await readResponse<{ elections?: Election[] }>(response);
    const found = data.elections?.find((item) => item.id === electionId);

    if (!found) {
      throw new Error('This election was not found in the elections returned by the server.');
    }

    setElection(found);

    setOpensAt(found.opens_at ? new Date(found.opens_at).toISOString().slice(0, 16) : '');

    setClosesAt(found.closes_at ? new Date(found.closes_at).toISOString().slice(0, 16) : '');
  }, [electionId]);

  const loadCandidates = useCallback(async () => {
    const response = await fetch(`/api/admin/elections/${electionId}/candidates`, {
      cache: 'no-store',
    });

    const data = await readResponse<{
      candidates?: Candidate[];
    }>(response);

    setCandidates(data.candidates ?? []);
  }, [electionId]);

  const loadVoters = useCallback(async () => {
    setLoadingVoters(true);

    try {
      const query = new URLSearchParams({
        page: '1',
        limit: '100',
        active: activeOnly ? 'true' : 'false',
      });

      if (voterSearch.trim()) {
        query.set('search', voterSearch.trim());
      }

      if (voterCategory) {
        query.set('category', voterCategory);
      }

      const response = await fetch(`/api/admin/voters?${query.toString()}`, {
        cache: 'no-store',
      });

      const data = await readResponse<{ voters?: Voter[] }>(response);
      setVoters(data.voters ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the voter registry.');
    } finally {
      setLoadingVoters(false);
    }
  }, [activeOnly, voterCategory, voterSearch]);

  async function refreshPageData() {
    setError('');
    setNotice('');

    try {
      await Promise.all([loadElection(), loadCandidates()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load election details.');
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      setLoading(true);
      setError('');

      try {
        const [electionsResponse, candidatesResponse] = await Promise.all([
          fetch('/api/admin/elections', { cache: 'no-store' }),
          fetch(`/api/admin/elections/${electionId}/candidates`, {
            cache: 'no-store',
          }),
        ]);

        const [electionsData, candidatesData] = await Promise.all([
          readResponse<{ elections?: Election[] }>(electionsResponse),
          readResponse<{ candidates?: Candidate[] }>(candidatesResponse),
        ]);

        if (cancelled) return;

        const found = electionsData.elections?.find((item) => item.id === electionId);

        if (!found) {
          throw new Error('Election not found. Return to the elections list.');
        }

        setElection(found);
        setCandidates(candidatesData.candidates ?? []);

        setOpensAt(found.opens_at ? new Date(found.opens_at).toISOString().slice(0, 16) : '');

        setClosesAt(found.closes_at ? new Date(found.closes_at).toISOString().slice(0, 16) : '');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load this election.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialise();

    return () => {
      cancelled = true;
    };
  }, [electionId]);

  useEffect(() => {
    void loadVoters();
  }, [loadVoters]);

  const totalCandidates = candidates.length;
  const approvedCandidates = candidates.filter((candidate) => candidate.is_approved).length;

  const candidatePositionOptions = useMemo(() => {
    const map = new Map<string, Position>();

    for (const position of createdPositions) {
      map.set(position.id, position);
    }

    for (const candidate of candidates) {
      if (candidate.position_id && candidate.position_name && !map.has(candidate.position_id)) {
        map.set(candidate.position_id, {
          id: candidate.position_id,
          name: candidate.position_name,
        });
      }
    }

    return Array.from(map.values());
  }, [createdPositions, candidates]);

  async function handleCreatePosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/elections/${electionId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: positionName.trim(),
          description: positionDescription.trim(),
          seatsAvailable: Number(seatsAvailable),
          displayOrder: Number(displayOrder),
        }),
      });

      const data = await readResponse<{ position: Position }>(response);

      const newPosition: Position = {
        id: data.position.id,
        name: data.position.name,
        description: data.position.description,
        seatsAvailable: data.position.seatsAvailable ?? data.position.seats_available,
      };

      setCreatedPositions((current) => [
        ...current.filter((position) => position.id !== newPosition.id),
        newPosition,
      ]);

      setCandidatePositionId(newPosition.id);
      setPositionName('');
      setPositionDescription('');
      setSeatsAvailable('1');
      setDisplayOrder(String(createdPositions.length + 2));

      setNotice(
        `Position "${newPosition.name}" created. Its ID is retained for this page session.`
      );

      await loadElection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the position.');
    } finally {
      setSaving(false);
    }
  }

  function toggleVoter(id: string) {
    setSelectedVoters((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleVisibleVoters() {
    const visibleIds = voters.filter((voter) => voter.is_active).map((voter) => voter.id);

    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedVoters.includes(id));

    setSelectedVoters((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  async function handleAssignVoters() {
    if (selectedVoters.length === 0) {
      setError('Select at least one voter to assign.');
      return;
    }

    setError('');
    setNotice('');
    setBusyAction('assign-voters');

    try {
      const response = await fetch(`/api/admin/elections/${electionId}/voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedVoters }),
      });

      const data = await readResponse<{
        message?: string;
        assignedCount?: number;
        alreadyAssignedCount?: number;
      }>(response);

      setNotice(
        data.message ??
          `Voter assignment completed. Assigned: ${data.assignedCount ?? 0}. Already assigned: ${data.alreadyAssignedCount ?? 0}.`
      );

      setSelectedVoters([]);
      await loadElection();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to assign voters. Check that the assignment API route exists.'
      );
    } finally {
      setBusyAction('');
    }
  }

  async function handleCreateCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/elections/${electionId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: candidatePositionId,
          userId: candidateUserId,
          manifesto: manifesto.trim(),
        }),
      });

      await readResponse<{ candidate?: Candidate; message?: string }>(response);

      setNotice('Candidate registered. The candidate may require approval.');
      setCandidateUserId('');
      setManifesto('');

      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register the candidate.');
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveCandidate(candidateId: string) {
    setError('');
    setNotice('');
    setBusyAction(candidateId);

    try {
      const response = await fetch(
        `/api/admin/elections/${electionId}/candidates/${candidateId}/approve`,
        { method: 'POST' }
      );

      await readResponse<{ message?: string; candidate?: Candidate }>(response);

      setNotice('Candidate approved.');
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve this candidate.');
    } finally {
      setBusyAction('');
    }
  }

  function toLesothoIso(value: string) {
    // datetime-local has no timezone. Treat the selected time as Africa/Maseru (UTC+02:00).
    return new Date(`${value}:00+02:00`).toISOString();
  }

  async function handleSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!opensAt || !closesAt) {
      setError('Select both the opening and closing date and time.');
      return;
    }

    const openingTime = new Date(`${opensAt}:00+02:00`).getTime();
    const closingTime = new Date(`${closesAt}:00+02:00`).getTime();

    if (Number.isNaN(openingTime) || Number.isNaN(closingTime) || closingTime <= openingTime) {
      setError('The closing time must be later than the opening time.');
      return;
    }

    setBusyAction('schedule');

    try {
      const isReschedule = election?.status.toUpperCase() === 'SCHEDULED';
      const action = isReschedule ? 'reschedule' : 'schedule';

      const response = await fetch(`/api/admin/elections/${electionId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opensAt: toLesothoIso(opensAt),
          closesAt: toLesothoIso(closesAt),
        }),
      });

      await readResponse<{ election?: Election; message?: string }>(response);

      setNotice(isReschedule ? 'Election rescheduled.' : 'Election scheduled.');
      await loadElection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to schedule this election.');
    } finally {
      setBusyAction('');
    }
  }

  async function handleOpenElection() {
    if (
      !window.confirm(
        'Open this election now? Voters may be able to start voting according to the backend rules.'
      )
    ) {
      return;
    }

    setError('');
    setNotice('');
    setBusyAction('open');

    try {
      const response = await fetch(`/api/admin/elections/${electionId}/open`, { method: 'POST' });

      await readResponse<{ election?: Election; message?: string }>(response);

      setNotice('The open-election request was accepted.');
      await loadElection();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open the election. The backend may reject it if the schedule is not valid.'
      );
    } finally {
      setBusyAction('');
    }
  }

  async function loadBallotPreview() {
    setError('');
    setBallotMessage('');
    setBusyAction('ballot');

    try {
      const response = await fetch(`/api/voting/elections/${electionId}/ballot`, {
        cache: 'no-store',
      });

      const data = await readResponse<{
        positions?: Array<{
          id: string;
          name: string;
          description?: string;
          seatsAvailable?: number;
          candidates?: Array<{
            id: string;
            name: string;
            manifesto?: string;
            photoUrl?: string | null;
          }>;
        }>;
      }>(response);

      setBallotPositions(
        (data.positions ?? []).map((position) => ({
          ...position,
          candidates: position.candidates ?? [],
        }))
      );

      setBallotMessage('Ballot preview loaded from the voter-facing endpoint.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the ballot preview. Check that the ballot proxy route exists and that this user is authorised.'
      );
    } finally {
      setBusyAction('');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} />
          Loading election workspace...
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Link
          href="/dashboard/elections"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to elections
        </Link>

        <div className="rounded-2xl border border-red-100 bg-white p-6">
          <CircleAlert className="mb-3 text-red-500" size={24} />
          <h1 className="font-semibold text-gray-900">Unable to open election</h1>
          <p className="mt-2 text-sm text-gray-600">
            {error || 'Election details are unavailable.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/elections"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            All elections
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {election.title}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(election.status)}`}
            >
              {election.status}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {election.description || 'Manage this election and its ballot.'}
          </p>
        </div>

        <button type="button" onClick={() => void refreshPageData()} className={buttonSecondary}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <CircleAlert className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="ml-auto"
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Election status',
            value: election.status,
            detail: 'Current backend status',
            icon: Vote,
          },
          {
            label: 'Positions',
            value: String(election.position_count ?? 0),
            detail: `${createdPositions.length} created in this session`,
            icon: FileText,
          },
          {
            label: 'Eligible voters',
            value: String(election.eligible_voter_count ?? 0),
            detail: 'Assigned to this election',
            icon: Users,
          },
          {
            label: 'Candidates',
            value: String(totalCandidates),
            detail: `${approvedCandidates} approved`,
            icon: ShieldCheck,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-100/70"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <Icon size={18} />
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold text-gray-950">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-500">{stat.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Schedule summary */}
      <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-100/70 sm:p-6">
        <SectionHeading
          icon={CalendarDays}
          title="Election schedule"
          description="Times are displayed and submitted using the Africa/Maseru timezone (UTC+02:00). The backend remains authoritative for whether an election can open."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock3 size={16} />
              Opens
            </div>
            <p className="mt-2 font-semibold text-gray-900">{formatDate(election.opens_at)}</p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock3 size={16} />
              Closes
            </div>
            <p className="mt-2 font-semibold text-gray-900">{formatDate(election.closes_at)}</p>
          </div>
        </div>

        <form
          onSubmit={handleSchedule}
          className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2"
        >
          <label className="block text-sm font-medium text-gray-700">
            Opening date and time
            <input
              type="datetime-local"
              className={`${inputClass} mt-2`}
              value={opensAt}
              onChange={(event) => setOpensAt(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Closing date and time
            <input
              type="datetime-local"
              className={`${inputClass} mt-2`}
              value={closesAt}
              onChange={(event) => setClosesAt(event.target.value)}
              required
            />
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            {['DRAFT', 'SCHEDULED'].includes(election.status.toUpperCase()) && (
              <button type="submit" disabled={busyAction === 'schedule'} className={buttonPrimary}>
                {busyAction === 'schedule' ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <CalendarDays size={16} />
                )}
                {election.status.toUpperCase() === 'SCHEDULED'
                  ? 'Reschedule election'
                  : 'Schedule election'}
              </button>
            )}

            {election.status.toUpperCase() === 'SCHEDULED' && (
              <button
                type="button"
                onClick={() => void handleOpenElection()}
                disabled={busyAction === 'open'}
                className={buttonSecondary}
              >
                {busyAction === 'open' ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Vote size={16} />
                )}
                Open election
              </button>
            )}
          </div>
        </form>

        {!['DRAFT', 'SCHEDULED'].includes(election.status.toUpperCase()) && (
          <p className="mt-4 text-xs leading-5 text-gray-500">
            Scheduling controls are hidden for this status. Closing an election is not available
            here because a closing endpoint has not yet been supplied.
          </p>
        )}
      </section>

      {/* Create positions */}
      <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-100/70 sm:p-6">
        <SectionHeading
          icon={Plus}
          title="Election positions"
          description="Create the offices candidates can contest. A newly returned position ID is retained for candidate registration during this page session."
        />

        <form onSubmit={handleCreatePosition} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Position name
              <input
                className={`${inputClass} mt-2`}
                placeholder="e.g. Treasurer"
                value={positionName}
                onChange={(event) => setPositionName(event.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Seats available
              <input
                type="number"
                min="1"
                max="100"
                className={`${inputClass} mt-2`}
                value={seatsAvailable}
                onChange={(event) => setSeatsAvailable(event.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
              Description
              <textarea
                className={`${inputClass} mt-2 min-h-24 resize-y`}
                placeholder="Describe the responsibilities of this position"
                value={positionDescription}
                onChange={(event) => setPositionDescription(event.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Display order
              <input
                type="number"
                min="1"
                className={`${inputClass} mt-2`}
                value={displayOrder}
                onChange={(event) => setDisplayOrder(event.target.value)}
                required
              />
            </label>
          </div>

          <button type="submit" disabled={saving} className={buttonPrimary}>
            {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
            Create position
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Positions created in this session
          </h3>

          {createdPositions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">
              No positions created on this page yet. Existing positions cannot be fully listed until
              a position-listing endpoint is available.
            </p>
          ) : (
            <div className="space-y-3">
              {createdPositions.map((position) => (
                <div
                  key={position.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{position.name}</p>
                    {position.description && (
                      <p className="mt-1 text-sm text-gray-500">{position.description}</p>
                    )}
                    <p className="mt-2 break-all font-mono text-xs text-gray-400">
                      ID: {position.id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCandidatePositionId(position.id)}
                    className={buttonSecondary}
                  >
                    Use for candidate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Voter assignment */}
      <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-100/70 sm:p-6">
        <SectionHeading
          icon={UserPlus}
          title="Assign eligible voters"
          description="Search your registered voter records, select the people eligible for this election, and assign them in one request."
        />

        <div className="grid gap-3 sm:grid-cols-[1fr_180px_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              className={`${inputClass} pl-10`}
              placeholder="Search name, email or registration number"
              value={voterSearch}
              onChange={(event) => setVoterSearch(event.target.value)}
            />
          </div>

          <select
            className={inputClass}
            value={voterCategory}
            onChange={(event) => setVoterCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            className={inputClass}
            value={activeOnly ? 'true' : 'false'}
            onChange={(event) => setActiveOnly(event.target.value === 'true')}
          >
            <option value="true">Active voters</option>
            <option value="false">Inactive voters</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{selectedVoters.length} voter(s) selected</p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadVoters()}
              disabled={loadingVoters}
              className={buttonSecondary}
            >
              {loadingVoters ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Search size={16} />
              )}
              Search voters
            </button>

            <button
              type="button"
              onClick={() => void handleAssignVoters()}
              disabled={selectedVoters.length === 0 || busyAction === 'assign-voters'}
              className={buttonPrimary}
            >
              {busyAction === 'assign-voters' ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <UserPlus size={16} />
              )}
              Assign selected
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              aria-label="Select all visible active voters"
              checked={
                voters.filter((voter) => voter.is_active).length > 0 &&
                voters
                  .filter((voter) => voter.is_active)
                  .every((voter) => selectedVoters.includes(voter.id))
              }
              onChange={toggleVisibleVoters}
              className="h-4 w-4 accent-green-600"
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Voter
            </span>
            <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-gray-500">
              Category
            </span>
          </div>

          {loadingVoters ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
              <LoaderCircle className="animate-spin" size={18} />
              Loading voters...
            </div>
          ) : voters.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">No voters matched this search.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {voters.map((voter) => (
                <label
                  key={voter.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedVoters.includes(voter.id)}
                    onChange={() => toggleVoter(voter.id)}
                    disabled={!voter.is_active}
                    className="h-4 w-4 accent-green-600"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{voter.full_name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {voter.email} · {voter.registration_number}
                    </p>
                  </div>

                  <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {voter.professional_category}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs leading-5 text-gray-500">
          The registry request currently loads the first 100 records. Use the search and category
          filters to narrow the list. Assignment is submitted through the election-specific voter
          assignment route.
        </p>
      </section>

      {/* Candidate registration */}
      <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-100/70 sm:p-6">
        <SectionHeading
          icon={ShieldCheck}
          title="Register candidates"
          description="Choose a position, select a registered user, and record their manifesto. Newly created positions are selectable immediately."
        />

        <form onSubmit={handleCreateCandidate} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Position
            <select
              className={`${inputClass} mt-2`}
              value={candidatePositionId}
              onChange={(event) => setCandidatePositionId(event.target.value)}
              required
            >
              <option value="">Select a position</option>
              {candidatePositionOptions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Candidate / registered user
            <select
              className={`${inputClass} mt-2`}
              value={candidateUserId}
              onChange={(event) => setCandidateUserId(event.target.value)}
              required
            >
              <option value="">Select a registered voter</option>
              {voters
                .filter((voter) => voter.is_active)
                .map((voter) => (
                  <option key={voter.id} value={voter.id}>
                    {voter.full_name} — {voter.professional_category}
                  </option>
                ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-gray-500">
              This dropdown uses the currently loaded voter results. Search for a person above first
              if they are not listed.
            </span>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Manifesto
            <textarea
              className={`${inputClass} mt-2 min-h-28 resize-y`}
              placeholder="Enter the candidate's vision and plans"
              value={manifesto}
              onChange={(event) => setManifesto(event.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving || candidatePositionOptions.length === 0}
            className={buttonPrimary}
          >
            {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
            Register candidate
          </button>
        </form>

        <div className="mt-7 border-t border-gray-100 pt-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">Registered candidates</h3>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {candidates.length} total
            </span>
          </div>

          {candidates.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">
              No candidates were returned for this election.
            </p>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {candidate.candidate_name || candidate.name || 'Unnamed candidate'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {candidate.position_name || 'Position name unavailable'}
                    </p>
                    {candidate.manifesto && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                        {candidate.manifesto}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        candidate.is_approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {candidate.is_approved ? 'Approved' : 'Pending approval'}
                    </span>

                    {!candidate.is_approved && (
                      <button
                        type="button"
                        onClick={() => void handleApproveCandidate(candidate.id)}
                        disabled={busyAction === candidate.id}
                        className={buttonPrimary}
                      >
                        {busyAction === candidate.id ? (
                          <LoaderCircle className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ballot preview */}
      <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-100/70 sm:p-6">
        <SectionHeading
          icon={Vote}
          title="Ballot preview"
          description="Preview positions and candidates returned by the voter-facing ballot endpoint. Access depends on backend session and election rules."
        />

        <button
          type="button"
          onClick={() => void loadBallotPreview()}
          disabled={busyAction === 'ballot'}
          className={buttonSecondary}
        >
          {busyAction === 'ballot' ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <FileText size={16} />
          )}
          Load ballot preview
        </button>

        {ballotMessage && <p className="mt-3 text-sm text-green-700">{ballotMessage}</p>}

        {ballotPositions.length > 0 && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {ballotPositions.map((position) => (
              <div key={position.id} className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">{position.name}</h3>

                {position.description && (
                  <p className="mt-1 text-sm text-gray-500">{position.description}</p>
                )}

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Candidates ({position.candidates.length})
                </p>

                {position.candidates.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">No candidates returned.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {position.candidates.map((candidate) => (
                      <div key={candidate.id} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                        {candidate.manifesto && (
                          <p className="mt-1 text-sm leading-5 text-gray-600">
                            {candidate.manifesto}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <CircleAlert className="mt-0.5 shrink-0" size={18} />
        <p>
          <strong>Backend enforcement:</strong> the server must enforce administrator permissions,
          candidate approval, voter eligibility, election opening and closing times, and voting
          rules. Hiding or disabling a button in this interface is not a security control.
        </p>
      </div>
    </div>
  );
}
