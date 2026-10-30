import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-api';

type RouteContext = {
  params: {
    electionId: string;
  };
};

// The dashboard can keep sending POST.
// The hosted backend receives PATCH.
export async function POST(request: NextRequest, { params }: RouteContext) {
  return proxyAdminRequest(
    request,
    `/api/admin/elections/${params.electionId}/reschedule`,
    'PATCH'
  );
}

// Also support PATCH requests directly from the frontend.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return proxyAdminRequest(
    request,
    `/api/admin/elections/${params.electionId}/reschedule`,
    'PATCH'
  );
}
