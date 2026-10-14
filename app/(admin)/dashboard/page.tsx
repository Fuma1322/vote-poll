import { Users, UserCheck, UserRound, Stethoscope, Activity } from 'lucide-react';

const votingStats = [
  {
    name: 'Doctors',
    description: 'Medical professionals',
    total: 120,
    voted: 86,
    icon: Stethoscope,
  },
  {
    name: 'Pharmacists',
    description: 'Pharmacy professionals',
    total: 45,
    voted: 32,
    icon: Activity,
  },
  {
    name: 'Dentists',
    description: 'Dental professionals',
    total: 30,
    voted: 21,
    icon: UserRound,
  },
];

export default function DashboardPage() {
  const totalEligible = votingStats.reduce((sum, category) => sum + category.total, 0);

  const totalVoted = votingStats.reduce((sum, category) => sum + category.voted, 0);

  const totalRemaining = totalEligible - totalVoted;

  const overallPercentage = totalEligible > 0 ? Math.round((totalVoted / totalEligible) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2 text-sm font-semibold text-[#168a40]">
            <span className="h-2 w-2 rounded-full bg-[#25D366]" />
            Voting in progress
          </div>
        </div>

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

          <div className="grid gap-6 lg:grid-cols-3">
            {votingStats.map((category) => {
              const percentage =
                category.total > 0 ? Math.round((category.voted / category.total) * 100) : 0;

              const remaining = Math.max(0, category.total - category.voted);

              const Icon = category.icon;

              return (
                <article
                  key={category.name}
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
                          {category.voted}
                          <span className="ml-1 text-base font-medium text-gray-400">
                            / {category.total}
                          </span>
                        </p>
                      </div>

                      <p className="text-lg font-bold tabular-nums text-[#168a40]">{percentage}%</p>
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
                      <span className="font-semibold tabular-nums text-[#111111]">{remaining}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-5 text-gray-400">
          Voting statistics should be verified against the official election records.
        </p>
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
  icon: React.ReactNode;
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
