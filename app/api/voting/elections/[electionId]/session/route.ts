import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

export async function POST(request: NextRequest, { params }: { params: { electionId: string } }) {
  const accessToken = request.cookies.get('hv_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Your session has expired. Please log in again.' },
      { status: 401 }
    );
  }

  const { electionId } = params;

  if (!electionId) {
    return NextResponse.json({ error: 'Election ID is required.' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/voting/elections/${encodeURIComponent(electionId)}/session`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      }
    );

    const responseText = await response.text();

    let data: unknown;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      return NextResponse.json(
        { error: 'The backend returned an invalid response.' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Voting session proxy error:', error);

    return NextResponse.json({ error: 'Unable to connect to the voting server.' }, { status: 502 });
  }
}
