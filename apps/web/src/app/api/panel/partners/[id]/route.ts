// T-4736: editar o activar/desactivar un colaborador — solo ADMIN. No hay borrado.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/property-access';
import { getPartner, partnerBookings, partnerLinks, updatePartner } from '@/lib/referrals';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };
type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    return NextResponse.json({ partner: await getPartner(id), links: await partnerLinks(id), bookings: await partnerBookings(id) }, { headers });
  } catch (error) { return panelError(error); }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const result = await updatePartner(id, await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/referidos', 'layout');
    return NextResponse.json(result, { headers });
  } catch (error) { return panelError(error); }
}
