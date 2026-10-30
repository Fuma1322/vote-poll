import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.HOSPITAL_VOTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://hospital-vote-api.onrender.com'
).replace(/\/+$/, '');

const ALLOWED_CATEGORIES = ['DOCTOR', 'PHARMACIST', 'DENTIST'] as const;

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('hv_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Your session has expired. Please log in again.' },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Please provide valid JSON registration data.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid registration data.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  const fullName = typeof input.fullName === 'string' ? input.fullName.trim() : '';

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';

  const registrationNumber =
    typeof input.registrationNumber === 'string' ? input.registrationNumber.trim() : '';

  const professionalCategory = input.professionalCategory;

  if (!fullName || !email || !registrationNumber) {
    return NextResponse.json(
      {
        error: 'Full name, email, and employee/registration number are required.',
      },
      { status: 400 }
    );
  }

  if (
    typeof professionalCategory !== 'string' ||
    !ALLOWED_CATEGORIES.includes(professionalCategory as (typeof ALLOWED_CATEGORIES)[number])
  ) {
    return NextResponse.json({ error: 'Select a valid professional category.' }, { status: 400 });
  }

  try {
    const apiResponse = await fetch(`${API_BASE_URL}/api/admin/voters`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        fullName,
        email,
        registrationNumber,
        professionalCategory,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });

    const responseText = await apiResponse.text();

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: 'The registration service returned an invalid response.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: apiResponse.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to reach the registration service. Please try again.',
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('hv_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Your session has expired. Please log in again.' },
      { status: 401 }
    );
  }

  try {
    const query = request.nextUrl.searchParams.toString();

    const apiResponse = await fetch(`${API_BASE_URL}/api/admin/voters${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });

    const responseText = await apiResponse.text();

    let data: unknown;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      return NextResponse.json(
        { error: 'The voter service returned an invalid response.' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: apiResponse.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the voter service. Please try again.' },
      { status: 502 }
    );
  }
}
