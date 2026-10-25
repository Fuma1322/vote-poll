const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  registrationNumber: string | null;
  professionalCategory: 'DOCTOR' | 'DENTIST' | 'PHARMACIST' | null;
  role: 'ADMIN' | 'VOTER';
  mustChangePassword: boolean;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (!API_URL) {
    throw new Error('The API URL is not configured.');
  }

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        'Unable to sign in. Please check your credentials and try again.'
    );
  }

  if (!data?.accessToken || !data?.user) {
    throw new Error('The API returned an unexpected login response.');
  }

  return data as LoginResponse;
}
