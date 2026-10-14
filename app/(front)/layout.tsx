import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voting | TRC',
  description: 'Voting Poll for TRC',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-[#F7F8F5] text-[#17201C]">

      <main className="min-h-screen">{children}</main>

    </div>
  );
}
