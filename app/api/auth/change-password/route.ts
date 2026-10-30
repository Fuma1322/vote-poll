import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('hv_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Your session has expired. Please log in again.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      !currentPassword ||
      !newPassword
    ) {
      return NextResponse.json(
        { error: 'Please provide your current and new passwords.' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });

    const responseText = await response.text();

    let data: unknown;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      return NextResponse.json(
        { error: 'The server returned an invalid response.' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error(
      'Change password proxy error:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      { error: 'Unable to connect to the server. Please try again.' },
      { status: 502 }
    );
  }
}
