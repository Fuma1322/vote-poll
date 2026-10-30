import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-api';

export async function PATCH(request: NextRequest, { params }: { params: { electionId: string } }) {
  return proxyAdminRequest(request, `/api/admin/elections/${params.electionId}/open`, 'PATCH');
}

// Keep POST compatibility if the frontend still sends POST.
export async function POST(request: NextRequest, { params }: { params: { electionId: string } }) {
  return proxyAdminRequest(request, `/api/admin/elections/${params.electionId}/open`, 'PATCH');
}
