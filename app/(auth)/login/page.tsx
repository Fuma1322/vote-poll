'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/Login';

type LoginUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'VOTER';
  mustChangePassword: boolean;
  professionalCategory: 'DOCTOR' | 'DENTIST' | 'PHARMACIST' | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(credentials: { email: string; password: string }) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Login failed. Please try again.');
      }

      const user = data?.user as LoginUser | undefined;

      if (!user) {
        throw new Error('The server returned an invalid login response.');
      }

      if (user.mustChangePassword) {
        router.replace('/change-password');
        return;
      }

      if (user.role === 'ADMIN') {
        router.replace('/dashboard');
      } else {
        router.replace('/voting');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to connect to the authentication service.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
    </main>
  );
}
