'use client';

import { useState } from 'react';
import { Clock3, Wifi, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

type VotingDisclaimerProps = {
  voterName: string;
  onContinue: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function VotingDisclaimer({
  voterName,
  onContinue,
  onCancel,
  loading = false,
}: VotingDisclaimerProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#111111]">
            <ShieldCheck size={34} />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#168a40]">
            Hospital Committee Election
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            Before you begin
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500 sm:text-base">
            Hello, {voterName}. Please read the following important information before starting your
            voting session.
          </p>
        </div>

        {/* Notice card */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-black/[0.04]">
          <div className="border-b border-[#25D366]/20 bg-[#25D366]/[0.07] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="shrink-0 text-[#168a40]" size={22} />
              <h2 className="font-bold text-[#111111]">Important voting instructions</h2>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* Time limit */}
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#111111]">
                <Clock3 size={22} />
              </div>

              <div>
                <h3 className="font-bold text-[#111111]">1. Two-minute voting session</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  You will have only <strong>2 minutes (120 seconds)</strong> to complete your
                  voting session once it starts. Be ready before proceeding and make your selection
                  promptly.
                </p>
              </div>
            </div>

            {/* Internet connection */}
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#111111]">
                <Wifi size={22} />
              </div>

              <div>
                <h3 className="font-bold text-[#111111]">2. Check your internet connection</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Ensure you have a stable and reliable internet connection before starting. Avoid
                  switching networks or moving into areas with poor reception during the session.
                </p>
              </div>
            </div>

            {/* Review selection */}
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#111111]">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h3 className="font-bold text-[#111111]">3. Review your choice carefully</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Check the candidate&apos;s name before confirming your vote. Once submitted, your
                  vote may not be changed.
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgement */}
          <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-5 sm:px-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#25D366] focus:ring-[#25D366]"
              />

              <span className="text-sm leading-6 text-gray-700">
                I understand that my voting session is limited to two minutes, and I confirm that my
                internet connection is stable enough to proceed.
              </span>
            </label>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-gray-100 disabled:opacity-50 sm:w-1/2"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onContinue}
                disabled={!acknowledged || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#1fbd59] disabled:cursor-not-allowed disabled:opacity-40 sm:w-1/2"
              >
                {loading ? 'Starting session...' : 'I understand, continue'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Your voting session should only begin when you are ready.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Authorized hospital personnel only.
        </p>
      </div>
    </main>
  );
}
