import RegisterForm from '@/components/auth/Register';

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F7F6] px-4 py-10 sm:px-6">
      {/* Soft background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#25D366]/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"
      />

      <div className="relative z-10 flex w-full justify-center">
        <RegisterForm
          onSubmit={function (): void | Promise<void> {
            throw new Error('Function not implemented.');
          }}
        />
      </div>
    </main>
  );
}
