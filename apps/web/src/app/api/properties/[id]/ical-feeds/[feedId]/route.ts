// T-4739 (añadido): editar o quitar un calendario iCal de la propiedad. ADMIN o colaborador dueño.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { removeIcalFeed, updateIcalFeed } from '@/lib/ical-feeds';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };
type Context = { params: Promise<{ id: string; feedId: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const manager = await requirePropertyManager();
    const { id, feedId } = await params;
    const row = await updateIcalFeed(id, feedId, await req.json().catch(() => null), manager);
    revalidatePath('/[locale]/panel/propiedades/[id]', 'page');
    return NextResponse.json(row, { headers });
  } catch (error) { return panelError(error); }
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const manager = await requirePropertyManager();
    const { id, feedId } = await params;
    const result = await removeIcalFeed(id, feedId, manager);
    revalidatePath('/[locale]/panel/propiedades/[id]', 'page');
    return NextResponse.json(result, { headers });
  } catch (error) { return panelError(error); }
}
