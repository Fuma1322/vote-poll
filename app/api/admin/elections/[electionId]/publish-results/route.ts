import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-api';

export async function PATCH(request: NextRequest, { params }: { params: { electionId: string } }) {
  return proxyAdminRequest(
    request,
    `/api/admin/elections/${encodeURIComponent(params.electionId)}/publish-results`,
    'PATCH'
  );
}
