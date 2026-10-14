import React from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="bg-[#F7F8F5] text-[#17201C]">{children}</div>;
}
