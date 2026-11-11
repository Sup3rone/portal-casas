// T-4736/T-4767: generar enlace de referido — ADMIN (cualquier casa) o el dueño del referidor (general o SUS casas).
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createReferralLink } from '@/lib/referrals';
import { panelError } from '@/lib/panel-response';

const headers = { 'Cache-Control': 'no-store' };
type Context = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const link = await createReferralLink(id, await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/referidos', 'layout');
    return NextResponse.json(link, { status: 201, headers });
  } catch (error) { return panelError(error); }
}
