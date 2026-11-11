// T-4736/T-4767: referidores — ADMIN todos; el dueño (COLLABORATOR) los suyos. Sin DELETE: se desactiva con PATCH.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { createPartner, listPartners } from '@/lib/referrals';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const manager = await requirePropertyManager();
    return NextResponse.json({ partners: await listPartners(manager) }, { headers });
  } catch (error) { return panelError(error); }
}

export async function POST(req: NextRequest) {
  try {
    const partner = await createPartner(await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/referidos', 'layout');
    return NextResponse.json(partner, { status: 201, headers });
  } catch (error) { return panelError(error); }
}
