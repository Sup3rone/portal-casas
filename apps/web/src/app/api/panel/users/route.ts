import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/property-access';
import { listAdminUsers } from '@/lib/admin-users';
import { panelError } from '@/lib/panel-response';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const query = req.nextUrl.searchParams;
    const page = Math.min(10000, Math.max(1, Math.floor(Number(query.get('page')) || 1)));
    return NextResponse.json(await listAdminUsers((query.get('email') || '').slice(0, 254), query.get('role') || '', page),
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return panelError(error); }
}
