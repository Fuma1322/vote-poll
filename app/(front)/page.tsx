'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/Login';
import { CheckCircle2, ShieldCheck, X, ArrowRight, LockKeyhole, Vote } from 'lucide-react';
import { fireConfetti } from '@/components/ui/confetti-demo';
import type { ProfessionalRole } from '@/components/auth/Register';
import VotingInProgress from '@/components/voting/VotingInProgress';
import VotingDisclaimer from '@/components/voting/VotingDisclaimer';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Hero, { type BallotPosition, type Candidate } from '@/components/voting/Hero';

type Screen =
  'welcome' | 'login' | 'disclaimer' | 'voting' | 'success' | 'ended' | 'voting-in-progress';

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  registrationNumber: string | null;
  professionalCategory: ProfessionalRole | null;
  role: 'ADMIN' | 'VOTER';
  mustChangePassword: boolean;
};

type ApiError = {
  error?: string;
  message?: string;
  code?: string;
};

type BallotResponse = {
  election: {
    id: string;
    title: string;
    description: string | null;
    closesAt: string | null;
  };
  session: {
    id: string;
    expiresAt: string;
  };
  positions: BallotPosition[];
};

type MyElectionResponse = {
  election?: {
    id: string;
    title: string;
    description?: string;
    status: string;
    opensAt?: string;
    closesAt?: string;
  };
  error?: string;
  message?: string;
};

type SessionResponse = {
  election: {
    id: string;
    title: string;
  };
  session: {
    id: string;
    token: string;
    startedAt: string;
    expiresAt: string;
  };
  resumed: boolean;
};

type SubmitResponse = {
  message: string;
  receiptCode: string;
  submittedAt: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const error = result as ApiError | null;
    throw new Error(error?.error || error?.message || `The request failed (${response.status}).`);
  }

  if (!result) {
    throw new Error('The server returned an empty or invalid response.');
  }

  return result as T;
}

export default function Home() {
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>('welcome');
  const [voter, setVoter] = useState<AuthUser | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);

  const [electionTitle, setElectionTitle] = useState('Hospital Committee Election');
  const [positions, setPositions] = useState<BallotPosition[]>([]);
  const [selections, setSelections] = useState<Record<string, Candidate>>({});

  const [votingLoading, setVotingLoading] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [votingError, setVotingError] = useState('');
  const [receiptCode, setReceiptCode] = useState('');

  const [activeElectionId, setActiveElectionId] = useState<string | null>(null);

  const [votingSessionToken, setVotingSessionToken] = useState<string | null>(null);

  const [loginError, setLoginError] = useState('');
  // Display the server-provided session expiry. The server remains authoritative.
  const updateCountdown = useCallback(() => {
    if (!sessionExpiresAt) return;

    const expiresAt = new Date(sessionExpiresAt).getTime();

    if (Number.isNaN(expiresAt)) {
      setVotingError('The voting session has an invalid expiry time.');
      return;
    }

    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

    setSecondsRemaining(remaining);

    if (remaining <= 0) {
      setReviewOpen(false);
      setVotingError(
        'Your voting session has expired. The server will not allow this session to be restarted.'
      );
      setScreen('ended');
    }
  }, [sessionExpiresAt]);

  useEffect(() => {
    if (screen !== 'voting' || !sessionExpiresAt) return;

    // Calculate the remaining time immediately.
    updateCountdown();

    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [screen, sessionExpiresAt, updateCountdown]);

  function enterVotingPortal() {
    setLoginError('');
    setScreen('login');
  }

  async function handleLogin(data: { email: string; password: string }) {
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      });

      const result = await readJson<{ user: AuthUser }>(response);
      const user = result.user;

      if (!user?.id || !user?.role) {
        throw new Error('The server returned an invalid user response.');
      }

      if (user.role === 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      if (user.mustChangePassword) {
        router.push('/change-password');
        return;
      }

      if (
        !user.professionalCategory ||
        !['DOCTOR', 'DENTIST', 'PHARMACIST'].includes(user.professionalCategory)
      ) {
        throw new Error(
          'Your account has no valid professional category. Please contact the administrator.'
        );
      }

      setVoter(user);
      setActiveElectionId(null);
      setPositions([]);
      setSelections({});
      setSessionExpiresAt(null);
      setSecondsRemaining(0);
      setReceiptCode('');
      setVotingError('');
      setReviewOpen(false);
      setScreen('disclaimer');
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Unable to connect to the authentication service.'
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function startVoting() {
    if (votingLoading) return;

    setVotingError('');
    setVotingLoading(true);
    setActiveElectionId(null);
    setPositions([]);
    setSelections({});
    setSessionExpiresAt(null);
    setSecondsRemaining(0);
    setReceiptCode('');
    setReviewOpen(false);

    try {
      // 1. Retrieve the election assigned to the authenticated voter.
      const electionResponse = await fetch('/api/voting/my-election', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      const electionData = await readJson<MyElectionResponse>(electionResponse);

      if (!electionResponse.ok) {
        throw new Error(electionData.error || 'Unable to retrieve your assigned election.');
      }

      const election = electionData.election;

      if (!election?.id) {
        throw new Error('No election has been assigned to your account.');
      }

      if (election.status !== 'OPEN') {
        throw new Error('This election is not currently open for voting.');
      }

      const electionId = election.id;

      // A unique storage key for this voter's election session.
      const sessionStorageKey = `voting-session-${electionId}`;

      let sessionData: SessionResponse;

      // 2. Attempt to create a new voting session.
      const sessionResponse = await fetch(
        `/api/voting/elections/${encodeURIComponent(electionId)}/session`,
        {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const initialData = await readJson<
        SessionResponse & {
          error?: string;
          code?: string;
        }
      >(sessionResponse);

      // 3. If a session already exists, resume it.
      if (!sessionResponse.ok && initialData.code === 'SESSION_ALREADY_EXISTS') {
        const savedToken = sessionStorage.getItem(sessionStorageKey);

        if (!savedToken) {
          throw new Error(
            'An active voting session already exists, but its saved session token is unavailable. Please contact the election administrator.'
          );
        }

        const resumeResponse = await fetch(
          `/api/voting/elections/${encodeURIComponent(electionId)}/session/resume`,
          {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
              Accept: 'application/json',
              'X-Voting-Session': savedToken,
            },
          }
        );

        const resumeData = await readJson<
          SessionResponse & {
            error?: string;
            code?: string;
          }
        >(resumeResponse);

        if (!resumeResponse.ok) {
          throw new Error(resumeData.error || 'Unable to resume your voting session.');
        }

        sessionData = resumeData;
      } else {
        // 4. Handle a newly created session.
        if (!sessionResponse.ok) {
          throw new Error(initialData.error || 'Unable to start your voting session.');
        }

        sessionData = initialData;
      }

      // 5. Validate the session response.
      if (
        !sessionData.session?.id ||
        !sessionData.session?.expiresAt ||
        !sessionData.session?.token
      ) {
        throw new Error('The backend returned an invalid voting session.');
      }

      if (sessionData.election?.id !== electionId) {
        throw new Error('The session does not match your assigned election.');
      }

      // Save the token for future session resumption.
      sessionStorage.setItem(sessionStorageKey, sessionData.session.token);

      setVotingSessionToken(sessionData.session.token);

      console.log('Voting session ready:', {
        sessionId: sessionData.session.id,
        expiresAt: sessionData.session.expiresAt,
        resumed: sessionData.resumed,
        hasToken: Boolean(sessionData.session.token),
      });

      // 6. Load the ballot using the voting-session token.
      const ballotResponse = await fetch(
        `/api/voting/elections/${encodeURIComponent(electionId)}/ballot`,
        {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            'X-Voting-Session': sessionData.session.token,
          },
        }
      );

      const ballotData = await readJson<
        BallotResponse & {
          error?: string;
          code?: string;
        }
      >(ballotResponse);

      if (!ballotResponse.ok) {
        throw new Error(ballotData.error || 'Unable to load the voting ballot.');
      }

      // 7. Validate the returned ballot.
      if (ballotData.election?.id !== electionId) {
        throw new Error('The ballot does not match your assigned election.');
      }

      if (!Array.isArray(ballotData.positions)) {
        throw new Error('The server returned an invalid ballot.');
      }

      // 8. Save election and ballot information.
      setActiveElectionId(electionId);
      setElectionTitle(ballotData.election.title || election.title);
      setPositions(ballotData.positions);
      setSessionExpiresAt(sessionData.session.expiresAt);

      // 9. Navigate to the voting screen.
      setScreen('voting');
    } catch (error) {
      console.error('Start voting error:', error);

      setVotingError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while starting voting.'
      );
    } finally {
      setVotingLoading(false);
    }
  }

  function selectCandidate(candidate: Candidate) {
    if (secondsRemaining <= 0 || submittingVote) return;

    setSelections((current) => ({
      ...current,
      [candidate.positionId]: candidate,
    }));
    setVotingError('');
  }

  async function confirmVote() {
    if (!activeElectionId) {
      setVotingError('Your election could not be verified. Please try again.');
      return;
    }

    const chosenSelections = Object.values(selections);

    if (chosenSelections.length === 0 || submittingVote) return;

    if (secondsRemaining <= 0) {
      setVotingError('Your voting session has expired.');
      setReviewOpen(false);
      setScreen('ended');
      return;
    }

    // Retrieve the session token from React state or sessionStorage.
    const sessionToken =
      votingSessionToken || sessionStorage.getItem(`voting-session-${activeElectionId}`);

    if (!sessionToken) {
      setVotingError(
        'Your voting session token is missing. Please contact the election administrator.'
      );
      return;
    }

    setSubmittingVote(true);
    setVotingError('');

    try {
      const response = await fetch(
        `/api/voting/elections/${encodeURIComponent(activeElectionId)}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Voting-Session': sessionToken,
          },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({
            selections: chosenSelections.map((candidate) => ({
              positionId: candidate.positionId,
              candidateId: candidate.id,
            })),
          }),
        }
      );

      const result = await readJson<SubmitResponse & { error?: string }>(response);

      if (!response.ok) {
        throw new Error(result.error || 'Your vote could not be submitted. Please try again.');
      }

      if (!result.receiptCode) {
        throw new Error(
          'The server did not return a ballot receipt. Please verify the submission status with the administrator before retrying.'
        );
      }

      // Successful submission.
      setReceiptCode(result.receiptCode);
      setReviewOpen(false);
      setSessionExpiresAt(null);
      setSelections({});
      setVotingSessionToken(null);

      sessionStorage.removeItem(`voting-session-${activeElectionId}`);

      setScreen('success');
      fireConfetti();
    } catch (error) {
      console.error('Vote submission error:', error);

      setVotingError(error instanceof Error ? error.message : 'Your vote could not be submitted.');
    } finally {
      setSubmittingVote(false);
    }
  }

  function finishVoting() {
    setReviewOpen(false);
    setSelections({});
    setScreen('ended');
  }

  function returnToLogin() {
    setVoter(null);
    setActiveElectionId(null);
    setPositions([]);
    setSelections({});
    setSessionExpiresAt(null);
    setSecondsRemaining(0);
    setReceiptCode('');
    setVotingError('');
    setLoginError('');
    setReviewOpen(false);
    setScreen('login');
  }

  return (
    <main className="min-h-screen bg-white">
      {screen === 'welcome' && <WelcomeScreen onContinue={enterVotingPortal} />}

      {screen === 'login' && (
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F8FAF9] px-4 py-12">
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#25D366]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-100 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            <button
              type="button"
              onClick={() => {
                setLoginError('');
                setScreen('welcome');
              }}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#168a40]"
            >
              <ArrowRight className="rotate-180" size={17} />
              Back to welcome page
            </button>

            <LoginForm onSubmit={handleLogin} loading={loginLoading} error={loginError} />

            <p className="mt-8 text-center text-xs text-gray-400">
              Pula Maliboho Healthcare Professionals Voting Portal
            </p>
          </div>
        </section>
      )}

      {screen === 'disclaimer' && voter && (
        <section>
          <VotingDisclaimer
            voterName={voter.fullName}
            onContinue={startVoting}
            onCancel={returnToLogin}
          />

          {(votingError || votingLoading) && (
            <div
              role={votingError ? 'alert' : 'status'}
              className={`mx-auto mb-8 max-w-xl rounded-xl border p-4 text-sm ${
                votingError
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              {votingLoading
                ? 'Starting your voting session and loading the official ballot…'
                : votingError}
              {votingError && (
                <button
                  type="button"
                  onClick={startVoting}
                  disabled={votingLoading}
                  className="ml-2 font-semibold underline disabled:opacity-50"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {screen === 'voting' && voter && (
        <Hero
          electionTitle={electionTitle}
          positions={positions}
          selections={selections}
          onSelectCandidate={selectCandidate}
          onReviewVote={() => {
            setVotingError('');
            setReviewOpen(true);
          }}
          secondsRemaining={secondsRemaining}
          voterName={voter.fullName}
          loading={votingLoading}
          error={votingError}
        />
      )}

      {screen === 'success' && (
        <StatusScreen
          icon={<CheckCircle2 size={46} />}
          title="Vote submitted"
          description="The server confirmed that your ballot was submitted."
          detail={
            receiptCode
              ? `Keep your receipt code for your records: ${receiptCode}`
              : 'Thank you for participating in the election.'
          }
          buttonText="Finish"
          onClick={finishVoting}
        />
      )}

      {screen === 'ended' && (
        <StatusScreen
          icon={<ShieldCheck size={46} />}
          title="Voting session ended"
          description="Your current voting session is no longer active."
          detail={
            votingError ||
            'The backend controls session expiry and whether a ballot has already been submitted. Contact the election administrator if you need assistance.'
          }
          buttonText="Return to login"
          onClick={returnToLogin}
        />
      )}

      {screen === 'voting-in-progress' && <VotingInProgress />}

      {screen === 'voting' && reviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-vote-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                disabled={submittingVote}
                aria-label="Close confirmation"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-[#111111] disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/15 text-[#168a40]">
              <ShieldCheck size={30} />
            </div>

            <h2
              id="confirm-vote-title"
              className="mt-5 text-center text-xl font-bold text-[#111111]"
            >
              Review your ballot
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-gray-600">
              Confirm the selections below before submitting your vote.
            </p>

            <div className="mt-5 space-y-3">
              {Object.values(selections).map((candidate) => (
                <div key={candidate.positionId} className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {candidate.positionName}
                  </p>
                  <p className="mt-1 font-bold text-[#111111]">{candidate.fullName}</p>
                  {candidate.manifesto && (
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-500">
                      {candidate.manifesto}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {votingError && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {votingError}
              </p>
            )}

            <p className="mt-4 text-center text-xs leading-5 text-amber-700">
              A submitted ballot cannot be changed. Do not refresh or close the page while
              submission is in progress.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                disabled={submittingVote}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-gray-50 disabled:opacity-50"
              >
                Go back
              </button>

              <button
                type="button"
                onClick={confirmVote}
                disabled={
                  submittingVote || secondsRemaining <= 0 || Object.keys(selections).length === 0
                }
                className="rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-[#111111] hover:bg-[#1fbd59] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingVote ? 'Submitting…' : 'Confirm vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatusScreen({
  icon,
  title,
  description,
  detail,
  buttonText,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  detail: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <section className="flex min-h-screen items-center justify-center px-5 py-12 text-center">
      <div className="w-full max-w-lg">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#25D366] text-[#168a40]">
          {icon}
        </div>

        <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
          {title}
        </h1>

        <p className="mt-4 text-lg font-medium text-gray-700">{description}</p>

        <p className="mx-auto mt-4 max-w-sm break-words text-sm leading-6 text-gray-500">
          {detail}
        </p>

        <button
          type="button"
          onClick={onClick}
          className="mt-9 w-full max-w-xs rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#1fbd59] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#25D366]/10 blur-[100px]" />

      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-50 blur-[100px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111111] shadow-lg shadow-black/10">
              <Vote size={23} className="text-[#25D366]" />
            </div>

            <div>
              <p className="text-sm font-extrabold tracking-[0.12em] text-[#111111]">
                PULA MALIBOHO
              </p>

              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                Voting Portal
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#25D366]" />

            <span className="text-xs font-semibold text-green-800">Official Voting Platform</span>
          </div>
        </div>
      </header>

      {/* Main welcome content */}
      <section className="relative z-10 flex flex-1 items-center px-6 py-16 sm:px-10">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Left content */}
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#25D366]/20 bg-[#25D366]/10 px-4 py-2">
              <ShieldCheck size={16} className="text-green-700" />

              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-800">
                Healthcare Professionals Election
              </span>
            </div>

            <h1 className="text-4xl font-black leading-[1.12] tracking-tight text-[#111111] sm:text-5xl lg:text-6xl">
              Your voice.
              <br />
              <span className="text-[#168a40]">Your choice.</span>
            </h1>

            <h2 className="mt-6 text-xl font-bold tracking-tight text-[#111111] sm:text-2xl">
              Welcome to Pula Maliboho
            </h2>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-gray-500 sm:text-base lg:mx-0">
              The Healthcare Professionals Voting Portal provides an accessible digital platform for
              participating in the hospital committee election. Make your voice count and take part
              in shaping professional representation.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col items-center gap-4 lg:items-start">
              <button
                type="button"
                onClick={onContinue}
                className="group flex w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-[#111111] px-7 py-4 text-sm font-bold text-white shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:bg-[#222222] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
              >
                Enter Voting Portal
                <ArrowRight
                  size={19}
                  className="text-[#25D366] transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <LockKeyhole size={14} />

                <span>Restricted access for authorised healthcare professionals</span>
              </div>
            </div>
          </div>

          {/* Right visual panel */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-[#25D366]/20 via-transparent to-emerald-100/50 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-7 shadow-2xl shadow-gray-200/70 sm:p-10">
              {/* Top decoration */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                    Pula Maliboho
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#111111]">
                    Professional participation
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10">
                  <ShieldCheck className="text-green-700" size={22} />
                </div>
              </div>

              {/* Main illustration */}
              <div className="my-10 flex justify-center">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-[#25D366]/20 bg-[#25D366]/5">
                  <div className="absolute inset-4 rounded-full border border-dashed border-[#25D366]/40" />

                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-[#111111] shadow-2xl shadow-black/20">
                    <Vote size={55} strokeWidth={1.5} className="text-[#25D366]" />
                  </div>

                  <div className="absolute -right-1 top-7 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#25D366] shadow-lg">
                    <CheckCircle2 size={19} className="text-[#111111]" />
                  </div>

                  <div className="absolute -bottom-1 left-5 h-5 w-5 rounded-full border-4 border-white bg-[#168a40]" />
                </div>
              </div>

              {/* Feature points */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]/15">
                    <ShieldCheck size={20} className="text-green-700" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#111111]">Secure participation</p>

                    <p className="mt-0.5 text-xs text-gray-400">Authenticated voting access</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]/15">
                    <Vote size={20} className="text-green-700" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#111111]">Your voice matters</p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Participate in professional representation
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-gray-100 pt-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Professionalism · Participation · Representation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsorship and partnership footer */}
      <footer className="relative z-10 border-t border-gray-100 bg-[#FAFCFB]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-8 text-center sm:px-10 lg:flex-row lg:text-left">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Proudly sponsored by
            </p>

            <p className="mt-2 text-lg font-black tracking-tight text-[#25d366]">
              MPlug <span className="font-medium">(Pty) Ltd</span>
            </p>
          </div>

          <div className="hidden h-10 w-px bg-gray-200 lg:block" />

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              In partnership with
            </p>

            <p className="mt-2 text-lg font-black tracking-tight text-[#80461B]">
              Tranformation Resource Center
            </p>
          </div>

          <div className="hidden h-10 w-px bg-gray-200 lg:block" />

          <div>
            <p className="text-xs font-medium text-gray-500">Pula Maliboho</p>

            <p className="mt-1 text-[11px] text-gray-400">Healthcare Professionals Voting Portal</p>

            <p className="mt-2 text-[10px] text-gray-400">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
