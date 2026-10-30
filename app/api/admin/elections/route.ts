import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ?? 'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

async function proxyRequest(request: NextRequest, method: 'GET' | 'POST') {
  const accessToken = request.cookies.get('hv_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Your session has expired. Please log in again.' },
      { status: 401 }
    );
  }

  try {
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    };

    if (method === 'POST') {
      const body = await request.json();

      if (typeof body.title !== 'string' || !body.title.trim()) {
        return NextResponse.json({ error: 'Election title is required.' }, { status: 400 });
      }

      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
      };

      options.body = JSON.stringify({
        title: body.title.trim(),
        description: typeof body.description === 'string' ? body.description.trim() : '',
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/elections`, options);

    const text = await response.text();

    let data: unknown;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: 'The election service returned an invalid response.' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to connect to the election service. Please try again.' },
      { status: 502 }
    );
  }
}
