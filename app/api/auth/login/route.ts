import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.HOSPITAL_VOTE_API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { message: 'The authentication API is not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const apiResponse = await fetch(`${API_URL.replace(/\/+$/, '')}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    const data = await apiResponse.json().catch(() => null);

    if (!apiResponse.ok) {
      return NextResponse.json(
        {
          message: data?.message || data?.error || 'Invalid email or password.',
        },
        { status: apiResponse.status }
      );
    }

    if (!data?.accessToken || !data?.user) {
      return NextResponse.json(
        { message: 'The authentication API returned an invalid response.' },
        { status: 502 }
      );
    }

    const expiresIn = Number(data.expiresIn);
    const maxAge =
      Number.isFinite(expiresIn) && expiresIn > 0 ? Math.min(Math.floor(expiresIn), 900) : 900;

    const response = NextResponse.json({
      user: data.user,
    });

    response.cookies.set('hv_access_token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Unable to reach the authentication service. Please try again.' },
      { status: 502 }
    );
  }
}
