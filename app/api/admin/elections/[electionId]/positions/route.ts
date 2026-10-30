import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ?? 'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

export async function POST(request: NextRequest, { params }: { params: { electionId: string } }) {
  const token = request.cookies.get('hv_access_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Your session has expired. Please log in again.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/admin/elections/${params.electionId}/positions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      }
    );

    const text = await response.text();

    let data: unknown;

    try {
      data = text ? JSON.parse(text) : {};
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
  } catch {
    return NextResponse.json(
      { error: 'Unable to connect to the election service.' },
      { status: 502 }
    );
  }
}
