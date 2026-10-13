import { NextRequest, NextResponse } from 'next/server';
import { requirePropertyManager } from '@/lib/property-access';
import { panelError } from '@/lib/panel-response';
import { translateText, translationAllowance, TranslationError } from '@/lib/panel-translation';
export async function POST(request: NextRequest) {
  try {
    const manager = await requirePropertyManager();
    const value = await request.json().catch(() => null);
    if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.texto !== 'string' || !value.texto.trim() || value.texto.length > 10000 || Object.keys(value).some(key => !['texto', 'idiomaOrigen', 'idiomaDestino'].includes(key))) throw new TranslationError('INVALID_TRANSLATION_TEXT', 400);
    if (!['es','en','fr'].includes(value.idiomaOrigen) || !['es','en','fr'].includes(value.idiomaDestino) || value.idiomaOrigen === value.idiomaDestino) throw new TranslationError('INVALID_TRANSLATION_LANGUAGE', 400);
    translationAllowance(manager.id, value.texto);
    return NextResponse.json({ traduccion: await translateText(value.texto, value.idiomaOrigen, value.idiomaDestino) });
  } catch (error) {
    if (error instanceof TranslationError) return NextResponse.json({ code: error.code }, { status: error.status, headers: error.code === 'TRANSLATION_RATE_LIMIT' ? { 'Retry-After':'60' } : undefined });
    return panelError(error);
  }
}
