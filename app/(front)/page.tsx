'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, LockKeyhole, ShieldCheck, X } from 'lucide-react';

import LoginForm from '@/components/auth/Login';
import RegisterForm, {
  type RegisterFormData,
  type ProfessionalRole,
} from '@/components/auth/Register';
import Hero, { type Candidate } from '@/components/voting/Hero';
import VotingDisclaimer from '@/components/voting/VotingDisclaimer';

type Screen = 'login' | 'register' | 'disclaimer' | 'voting' | 'success' | 'ended';

type DemoVoter = {
  email: string;
  fullName: string;
  role: ProfessionalRole;
};

// Temporary accounts for frontend testing only.
const demoVoters: DemoVoter[] = [
  {
    email: 'leonardfuma26@gmail.com',
    fullName: 'Dr. Tankiso Fuma',
    role: 'DOCTOR',
  },
  {
    email: 'lemohangmakintane57@gmail.com',
    fullName: 'Lemohang Makintane',
    role: 'PHARMACIST',
  },
  {
    email: 'dentist@hospital.org',
    fullName: 'Dr. Napo Mokhele',
    role: 'DENTIST',
  },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>('login');
  const [voter, setVoter] = useState<DemoVoter | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const [loginError, setLoginError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Demo countdown. Production expiry must be enforced by the server.
  useEffect(() => {
    if (screen !== 'voting') return;

    if (secondsRemaining <= 0) {
      setSelectedCandidate(null);
      setScreen('ended');
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [screen, secondsRemaining]);

  function handleLogin(data: { email: string; password: string }) {
    setLoginError('');

    // Demo only: never authenticate real users this way.
    const matchedVoter = demoVoters.find(
      (item) => item.email.toLowerCase() === data.email.toLowerCase()
    );

    if (!matchedVoter || !data.password.trim()) {
      setLoginError('Demo account not found. Try one of the sample email addresses.');
      return;
    }

    setVoter(matchedVoter);
    setSecondsRemaining(120);
    setSelectedCandidate(null);
    setScreen('disclaimer');
  }

  function handleRegister(data: RegisterFormData) {
    setRegisterError('');
    setRegisterMessage('');

    // The registration form is not connected to a database yet.
    // Do not present a successful registration until the server saves it.
    console.log('Registration form preview:', {
      ...data,
      idNumber: '[redacted in preview]',
    });

    setRegisterMessage('The form is valid. Database registration has not been connected yet.');
  }

  function confirmVote() {
    if (!selectedCandidate || secondsRemaining <= 0) return;

    // UI simulation only. A real vote must be saved by the server first.
    setSelectedCandidate(null);
    setScreen('success');
  }

  function finishVoting() {
    setSelectedCandidate(null);
    setScreen('ended');
  }

  function returnToLogin() {
    setVoter(null);
    setSelectedCandidate(null);
    setLoginError('');
    setSecondsRemaining(120);
    setScreen('login');
  }

  return (
    <main className="min-h-screen bg-white">
      {screen === 'login' && (
        <section className="flex min-h-screen items-center justify-center px-4 py-12">
          <LoginForm
            onSubmit={handleLogin}
            onRegisterClick={() => {
              setRegisterError('');
              setRegisterMessage('');
              setScreen('register');
            }}
            error={loginError}
          />
        </section>
      )}

      {screen === 'register' && (
        <section className="flex min-h-screen items-center justify-center px-4 py-12">
          <RegisterForm
            onSubmit={handleRegister}
            onBack={() => setScreen('login')}
            loading={submitting}
            error={registerError}
          />

          {registerMessage && (
            <div
              role="status"
              className="fixed bottom-5 left-4 right-4 mx-auto max-w-lg rounded-xl border border-[#25D366]/40 bg-white p-4 text-sm text-[#111111] shadow-lg"
            >
              {registerMessage}
            </div>
          )}
        </section>
      )}

      {screen === 'disclaimer' && voter && (
        <VotingDisclaimer
          voterName={voter.fullName}
          onContinue={() => {
            setSecondsRemaining(120);
            setScreen('voting');
          }}
          onCancel={returnToLogin}
        />
      )}

      {screen === 'voting' && voter && (
        <Hero
          role={voter.role}
          voterName={voter.fullName}
          secondsRemaining={secondsRemaining}
          onSelectCandidate={setSelectedCandidate}
        />
      )}

      {screen === 'success' && (
        <StatusScreen
          icon={<CheckCircle2 size={46} />}
          title="Congratulations!"
          description="Your vote has been successfully cast."
          detail="Thank you for participating in the Hospital Committee Election."
          buttonText="Finish"
          onClick={finishVoting}
        />
      )}

      {screen === 'ended' && (
        <StatusScreen
          icon={<LockKeyhole size={42} />}
          title="Session ended"
          description="Your voting session is now closed."
          detail="Thank you for participating in the hospital committee election."
          buttonText="Return to login"
          onClick={returnToLogin}
        />
      )}

      {screen === 'voting' && selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-vote-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                aria-label="Cancel and close confirmation"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-[#111111]"
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
              Confirm your vote
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-gray-600">
              Are you sure you want to cast your vote for{' '}
              <strong className="text-[#111111]">{selectedCandidate.fullName}</strong>?
            </p>

            <p className="mt-4 text-center text-xs leading-5 text-amber-700">
              Please review your choice carefully. A submitted vote may not be changed.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-gray-50"
              >
                Go back
              </button>

              <button
                type="button"
                onClick={confirmVote}
                disabled={secondsRemaining <= 0}
                className="rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-[#111111] hover:bg-[#1fbd59] disabled:opacity-50"
              >
                Confirm vote
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
  icon: React.ReactNode;
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

        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-gray-500">{detail}</p>

        <button
          type="button"
          onClick={onClick}
          className="mt-9 w-full max-w-xs rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#1fbd59]"
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}
