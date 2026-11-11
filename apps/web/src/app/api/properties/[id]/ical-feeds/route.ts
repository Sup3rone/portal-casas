// T-4739 (añadido): calendarios iCal de una propiedad — listar y agregar. ADMIN o colaborador dueño.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { addIcalFeed, listIcalFeeds } from '@/lib/ical-feeds';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };
type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const manager = await requirePropertyManager();
    return NextResponse.json({ feeds: await listIcalFeeds((await params).id, manager) }, { headers });
  } catch (error) { return panelError(error); }
}

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const manager = await requirePropertyManager();
    const row = await addIcalFeed((await params).id, await req.json().catch(() => null), manager);
    revalidatePath('/[locale]/panel/propiedades/[id]', 'page');
    return NextResponse.json(row, { status: 201, headers });
  } catch (error) { return panelError(error); }
}
