// T-4944: guarda los textos e imágenes de /nosotros o /unete (Panel → Contenido → Páginas). Solo ADMIN.
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { accessFailure } from '@/lib/property-access';
import { panelError } from '@/lib/panel-response';
import { PageContentError, pageContentPages, type PageContentPage } from '@/lib/page-content';
import { savePageContent } from '@/lib/page-content-store';

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { page?: unknown; texts?: unknown; images?: unknown } | null;
    if (!body || !pageContentPages.includes(body.page as PageContentPage)) throw new PageContentError('INVALID_PAGE_CONTENT');
    const { page, ...content } = body;
    await savePageContent(page as PageContentPage, content);
    revalidatePath(page === 'about' ? '/[locale]/nosotros' : '/[locale]/unete', 'page');
    revalidatePath('/[locale]/panel/contenido', 'page');
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof PageContentError) return NextResponse.json({ error: 'validation', code: error.code }, { status: error.code === 'PAGE_CONTENT_NOT_READY' ? 409 : 400 });
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message, code: denied.code ?? (denied.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN') }, { status: denied.status });
    return panelError(error);
  }
}
