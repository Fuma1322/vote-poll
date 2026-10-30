import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

export async function GET(request: NextRequest, { params }: { params: { electionId: string } }) {
  const accessToken = request.cookies.get('hv_access_token')?.value;
  const sessionToken = request.headers.get('X-Voting-Session');

  if (!accessToken) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  if (!sessionToken) {
    return NextResponse.json(
      {
        error: 'A valid voting-session token is required.',
        code: 'SESSION_TOKEN_REQUIRED',
      },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/voting/elections/${params.electionId}/ballot`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Voting-Session': sessionToken,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({
      error: 'The backend returned an invalid response.',
    }));

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Ballot proxy error:', error);

    return NextResponse.json(
      { error: 'Unable to connect to the voting backend.' },
      { status: 502 }
    );
  }
}
