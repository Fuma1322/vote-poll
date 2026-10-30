import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

export async function proxyAdminRequest(
  request: NextRequest,
  backendPath: string,
  method: 'GET' | 'POST' | 'PATCH' = 'POST'
) {
  const accessToken = request.cookies.get('hv_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Your session has expired. Please log in again.' },
      { status: 401 }
    );
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    };

    if (method === 'POST' || method === 'PATCH') {
      // Some POST endpoints, such as approve and open,
      // do not require a request body.
      const body = await request.text();

      if (body.trim()) {
        headers['Content-Type'] = 'application/json';
        options.body = body;
      }
    }

    const response = await fetch(`${API_BASE_URL}${backendPath}`, options);
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
    console.error('Admin API proxy error:', {
      backendPath,
      method,
      error: error instanceof Error ? error.message : 'Unknown connection error',
    });

    return NextResponse.json(
      { error: 'Unable to connect to the backend. Please try again.' },
      { status: 502 }
    );
  }
}
