// T-5324: cambia el tema por temporada del sitio público. ADMIN o DESIGNER.
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { accessFailure } from '@/lib/property-access';
import { panelError } from '@/lib/panel-response';
import { SiteSeasonError, saveSiteSeason } from '@/lib/site-season';

export async function PUT(request: Request) {
  try {
    const season = await saveSiteSeason(await request.json().catch(() => null));
    revalidatePath('/[locale]', 'layout');
    return NextResponse.json({ success: true, season }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SiteSeasonError) return NextResponse.json({ error: 'validation', code: error.code }, { status: error.code === 'SITE_SEASON_NOT_READY' ? 409 : 400 });
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message, code: denied.code ?? (denied.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN') }, { status: denied.status });
    return panelError(error);
  }
}
