import { NextRequest, NextResponse } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-api';

export async function POST(request: NextRequest, { params }: { params: { electionId: string } }) {
  let body: unknown;

  try {
    body = await request.clone().json();
  } catch {
    return NextResponse.json({ error: 'Please provide valid JSON.' }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !Array.isArray((body as { userIds?: unknown }).userIds) ||
    !(body as { userIds: unknown[] }).userIds.every(
      (id) => typeof id === 'string' && id.trim().length > 0
    )
  ) {
    return NextResponse.json({ error: 'userIds must be an array of voter IDs.' }, { status: 400 });
  }

  return proxyAdminRequest(request, `/api/admin/elections/${params.electionId}/voters`);
}
