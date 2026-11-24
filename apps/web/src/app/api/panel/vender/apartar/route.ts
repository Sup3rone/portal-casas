// T-5209: «Apartar» del vendedor (consulta + bloqueo). Permisos y validación en el servidor (lib/vendor-hold.ts).
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { PanelValidationError } from '@/lib/panel-validation';
import { panelError } from '@/lib/panel-response';
import { consumeRateLimit, rateLimitLocale, rateLimitResponse } from '@/lib/rate-limit';
import { holdDates, holdInput } from '@/lib/vendor-hold';

export async function POST(request: Request) {
  try {
    const manager = await requirePropertyManager();
    const retry = consumeRateLimit('hold', request.headers);
    if (retry) return rateLimitResponse(retry, rateLimitLocale(request.headers));
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'validation', code: 'INVALID_JSON' }, { status: 400 }); }
    const result = await holdDates(holdInput(body), manager, rateLimitLocale(request.headers));
    revalidatePath('/[locale]/panel', 'layout');
    revalidatePath('/[locale]/casas/[slug]', 'page');
    revalidatePath('/[locale]/admin/calendario', 'page');
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PanelValidationError && error.message === 'notAvailable') return NextResponse.json({ error: 'conflict', code: 'NOT_AVAILABLE' }, { status: 409 });
    return panelError(error);
  }
}
