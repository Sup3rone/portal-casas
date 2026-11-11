// T-4736: colaboradores del programa de referidos — solo ADMIN. Sin DELETE: se desactiva con PATCH.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/property-access';
import { createPartner, listPartners } from '@/lib/referrals';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ partners: await listPartners() }, { headers });
  } catch (error) { return panelError(error); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const partner = await createPartner(await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/referidos', 'layout');
    return NextResponse.json(partner, { status: 201, headers });
  } catch (error) { return panelError(error); }
}
