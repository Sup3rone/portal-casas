// T-4736: el COLLABORATOR con permiso de referidos genera enlaces propios (generales o de SUS propiedades).
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createOwnReferralLink } from '@/lib/referrals';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };

export async function POST(req: NextRequest) {
  try {
    const link = await createOwnReferralLink(await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/mis-referidos', 'layout');
    return NextResponse.json(link, { status: 201, headers });
  } catch (error) { return panelError(error); }
}
