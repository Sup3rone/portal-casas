import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/property-access';
import { getAdminUser, adminUserProperties, mutateAdminUser } from '@/lib/admin-users';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };
type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    return NextResponse.json({ user: await getAdminUser(id), properties: await adminUserProperties(id) }, { headers });
  } catch (error) { return panelError(error); }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const result = await mutateAdminUser(id, await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/usuarios', 'layout');
    return NextResponse.json(result, { headers });
  } catch (error) { return panelError(error); }
}
