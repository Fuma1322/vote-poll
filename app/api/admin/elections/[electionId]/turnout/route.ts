import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-api';

export async function GET(request: NextRequest, { params }: { params: { electionId: string } }) {
  return proxyAdminRequest(
    request,
    `/api/admin/elections/${encodeURIComponent(params.electionId)}/turnout`,
    'GET'
  );
}
