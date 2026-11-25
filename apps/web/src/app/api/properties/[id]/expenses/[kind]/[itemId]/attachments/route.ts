// T-5248 (fase 2): subir una factura o recibo (multipart, campo «file») a un mantenimiento o a un pago.
// kind = maintenance | entry. Imagen JPEG/PNG/WebP o PDF, hasta 4 MB. Va al almacén PRIVADO.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { attachmentTarget, uploadAttachment } from '@/lib/expense-attachments';
import { attachmentError } from '@/lib/attachment-response';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; kind: string; itemId: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id, kind, itemId } = await params;
    const target = attachmentTarget(kind);
    const attachmentId = await uploadAttachment(id, target, itemId, await req.formData().catch(() => null), manager);
    revalidatePath('/[locale]/panel/propiedades/[id]/gastos', 'page');
    return NextResponse.json({ id: attachmentId }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return attachmentError(error); }
}
