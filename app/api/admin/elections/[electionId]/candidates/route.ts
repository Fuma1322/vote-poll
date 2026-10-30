import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ?? 'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

async function proxy(request: NextRequest, electionId: string, method: 'GET' | 'POST') {
  const token = request.cookies.get('hv_access_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Your session has expired. Please log in again.' },
      { status: 401 }
    );
  }

  try {
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    };

    if (method === 'POST') {
      options.body = JSON.stringify(await request.json());
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/elections/${electionId}/candidates`,
      options
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

export async function GET(request: NextRequest, { params }: { params: { electionId: string } }) {
  return proxy(request, params.electionId, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { electionId: string } }) {
  return proxy(request, params.electionId, 'POST');
}
