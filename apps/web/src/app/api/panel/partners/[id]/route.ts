// T-4736/T-4767: editar, ligar cuenta o activar/desactivar un referidor — ADMIN o su dueño. No hay borrado.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { getPartner, partnerBookings, partnerLinks, updatePartner } from '@/lib/referrals';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };
type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const manager = await requirePropertyManager();
    const { id } = await params;
    const partner = await getPartner(id, manager);
    return NextResponse.json({ partner, links: await partnerLinks(id, manager), bookings: await partnerBookings(id, manager) }, { headers });
  } catch (error) { return panelError(error); }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const result = await updatePartner(id, await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/referidos', 'layout');
    return NextResponse.json(result, { headers });
  } catch (error) { return panelError(error); }
}
