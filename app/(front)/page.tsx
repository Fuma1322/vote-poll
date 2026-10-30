'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/Login';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { fireConfetti } from '@/components/ui/confetti-demo';
import type { ProfessionalRole } from '@/components/auth/Register';
import VotingInProgress from '@/components/voting/VotingInProgress';
import VotingDisclaimer from '@/components/voting/VotingDisclaimer';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Hero, { type BallotPosition, type Candidate } from '@/components/voting/Hero';

type Screen = 'login' | 'disclaimer' | 'voting' | 'success' | 'ended' | 'voting-in-progress';

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

  const [screen, setScreen] = useState<Screen>('login');
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
      {screen === 'login' && (
        <section className="flex min-h-screen items-center justify-center px-4 py-12">
          <LoginForm onSubmit={handleLogin} loading={loginLoading} error={loginError} />
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
