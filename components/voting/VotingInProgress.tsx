'use client';

import { Vote, Clock3, ShieldCheck } from 'lucide-react';

export default function VotingInProgress() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-xl shadow-black/5 sm:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/10">
          <Vote className="h-10 w-10 text-[#25D366]" />
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#25D366]">
          Hospital Voting
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
          Voting Is in Progress
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-600">
          The hospital voting process is currently underway. Thank you for participating. Please
          follow the official communication channels for updates on the voting process and results.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl bg-gray-50 p-5 text-left">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-1 h-5 w-5 shrink-0 text-[#25D366]" />
            <div>
              <h2 className="font-semibold text-[#111111]">Voting in progress</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                The overall voting process is still underway.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#25D366]" />
            <div>
              <h2 className="font-semibold text-[#111111]">Thank you for your participation</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Please use the official channels for verified announcements.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs text-gray-400">Secure Hospital Voting System</p>
      </section>
    </main>
  );
}
