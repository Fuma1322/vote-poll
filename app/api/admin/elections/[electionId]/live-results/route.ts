import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-api';

type RouteContext = {
  params: {
    electionId: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  return proxyAdminRequest(
    request,
    `/api/admin/elections/${encodeURIComponent(params.electionId)}/live-results`,
    'GET'
  );
}
