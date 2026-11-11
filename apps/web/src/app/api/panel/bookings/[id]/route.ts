// T-4738: guardar el desglose de precio (renta, aseo, impuestos) de una reserva. ADMIN o dueño de la propiedad.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { updateBookingBreakdown } from '@/lib/booking-details';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };
type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const manager = await requirePropertyManager();
    const { id } = await params;
    const result = await updateBookingBreakdown(id, await req.json().catch(() => null), manager);
    revalidatePath('/[locale]/panel/reservas/[id]', 'page');
    return NextResponse.json(result, { headers });
  } catch (error) { return panelError(error); }
}
