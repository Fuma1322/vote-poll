import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('hv_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in again.' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/voting/my-election`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({
      error: 'The backend returned an invalid response.',
    }));

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('My-election proxy error:', error);

    return NextResponse.json(
      { error: 'Unable to connect to the voting backend.' },
      { status: 502 }
    );
  }
}
