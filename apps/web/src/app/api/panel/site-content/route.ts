import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, accessFailure } from '@/lib/property-access';
import { readSiteContent, saveSiteContent, SiteContentError } from '@/lib/site-content';
import { panelError } from '@/lib/panel-response';

function failure(error: unknown) {
  if (error instanceof SiteContentError) return NextResponse.json({ error: 'validation', code: error.code }, { status: 400 });
  const denied = accessFailure(error);
  if (denied) return NextResponse.json({ error: denied.message, code: denied.code ?? (denied.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN') }, { status: denied.status });
  return panelError(error);
}
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await readSiteContent(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
export async function PUT(request: Request) {
  try {
    await saveSiteContent(await request.json().catch(() => null));
    revalidatePath('/[locale]', 'layout');
    revalidatePath('/[locale]/panel/contenido', 'page');
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
