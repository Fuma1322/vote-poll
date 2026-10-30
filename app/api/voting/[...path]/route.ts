import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ?? 'https://hospital-vote-api.onrender.com'
).replace(/\/$/, '');

const SESSION_COOKIE = 'hv_voting_session_token';

type ApiPayload = Record<string, unknown>;

async function proxyVotingRequest(request: NextRequest, context: { params: { path: string[] } }) {
  const authToken = request.cookies.get('hv_access_token')?.value;
  const savedSessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  const path = context.params.path.join('/');
  const isSessionRequest = path.endsWith('/session');
  const isSubmitRequest = path.endsWith('/submit');

  if (!authToken) {
    const result = NextResponse.json(
      {
        error: 'Please log in again.',
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    );

    result.headers.set('Cache-Control', 'no-store');
    return result;
  }

  const headers = new Headers({
    Authorization: `Bearer ${authToken}`,
    Accept: 'application/json',
  });

  const contentType = request.headers.get('content-type');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  // Keep the voting session token on the server.
  if (savedSessionToken) {
    headers.set('X-Voting-Session', savedSessionToken);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/voting/${path}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
      cache: 'no-store',
    });

    const responseText = await response.text();

    let payload: ApiPayload | null = null;

    try {
      const parsed: unknown = JSON.parse(responseText);

      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        payload = parsed as ApiPayload;
      }
    } catch {
      // The upstream response was not valid JSON.
    }

    if (!payload) {
      const result = NextResponse.json(
        {
          error: 'The voting service returned an invalid response.',
          code: 'INVALID_UPSTREAM_RESPONSE',
        },
        { status: 502 }
      );

      result.headers.set('Cache-Control', 'no-store');

      // A confirmed submission or an invalidated session must not
      // leave an old session token available.
      if (isSubmitRequest && response.ok) {
        clearSessionCookie(result);
      }

      return result;
    }

    // Extract the session token BEFORE creating the JSON response.
    // This prevents the token from being serialized to the browser.
    let newSessionToken: string | null = null;

    if (
      isSessionRequest &&
      response.ok &&
      payload.session !== null &&
      typeof payload.session === 'object'
    ) {
      const session = payload.session as Record<string, unknown>;

      if (typeof session.token === 'string' && session.token.length >= 40) {
        newSessionToken = session.token;
        delete session.token;
      }
    }

    const result = NextResponse.json(payload, {
      status: response.status,
    });

    result.headers.set('Cache-Control', 'no-store');

    if (newSessionToken) {
      result.cookies.set(SESSION_COOKIE, newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 600,
      });
    }

    // Clear sessions that the backend has declared invalid.
    const errorCode = payload.code;

    const invalidSessionCodes = [
      'SESSION_EXPIRED',
      'SESSION_CANNOT_RESTART',
      'INVALID_VOTING_SESSION',
      'SESSION_NOT_ACTIVE',
      'ALREADY_VOTED',
    ];

    if (invalidSessionCodes.includes(String(errorCode))) {
      clearSessionCookie(result);
    }

    // Clear the session only after the backend confirms submission.
    if (isSubmitRequest && response.ok) {
      clearSessionCookie(result);
    }

    return result;
  } catch {
    const result = NextResponse.json(
      {
        error: 'Unable to connect to the voting service. Please try again.',
        code: 'VOTING_SERVICE_UNAVAILABLE',
      },
      { status: 502 }
    );

    result.headers.set('Cache-Control', 'no-store');
    return result;
  }
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyVotingRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyVotingRequest(request, context);
}
