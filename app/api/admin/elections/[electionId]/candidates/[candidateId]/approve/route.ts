import { NextRequest, NextResponse } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { electionId: string; candidateId: string } }
) {
  return proxyAdminRequest(
    request,
    `/api/admin/elections/${params.electionId}/candidates/${params.candidateId}/approve`,
    'PATCH'
  );
}

// Support the existing frontend POST call while forwarding PATCH to the backend.
export async function POST(
  request: NextRequest,
  { params }: { params: { electionId: string; candidateId: string } }
) {
  return proxyAdminRequest(
    request,
    `/api/admin/elections/${params.electionId}/candidates/${params.candidateId}/approve`,
    'PATCH'
  );
}
