// T-5209: «Liberar» un apartado. Solo bloqueos con consulta, de casas que gestiona quien libera (lib/vendor-hold.ts).
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { objectBody, text } from '@/lib/panel-validation';
import { panelError } from '@/lib/panel-response';
import { releaseHold } from '@/lib/vendor-hold';

export async function POST(request: Request) {
  try {
    const manager = await requirePropertyManager();
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'validation', code: 'INVALID_JSON' }, { status: 400 }); }
    await releaseHold(text(objectBody(body).blockId), manager);
    revalidatePath('/[locale]/panel', 'layout');
    revalidatePath('/[locale]/casas/[slug]', 'page');
    revalidatePath('/[locale]/admin/calendario', 'page');
    return NextResponse.json({ success: true });
  } catch (error) {
    return panelError(error);
  }
}
