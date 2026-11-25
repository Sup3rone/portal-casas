// T-5248 (fase 2): ver/descargar (GET) o borrar (DELETE) una factura o recibo. El archivo nunca tiene URL pública:
// se entrega aquí, después de revisar el permiso de la casa, sin caché compartido.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { deleteAttachment, readAttachment } from '@/lib/expense-attachments';
import { contentDisposition } from '@/lib/expense-attachment-rules';
import { attachmentError } from '@/lib/attachment-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_req: NextRequest, context: Context) {
  try {
    const manager = await requirePropertyManager(), { id, attachmentId } = await context.params;
    const { row, stream } = await readAttachment(id, attachmentId, manager);
    return new Response(stream, { headers: {
      'Content-Type': row.contentType, 'Content-Length': String(row.size), 'Content-Disposition': contentDisposition(row.fileName),
      // Solo se guardan imágenes y PDF (CHECK + validación) y nosniff impide reinterpretarlos. Sin CSP «sandbox»:
      // con ella el visor de PDF de Chrome no muestra el archivo.
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) { return attachmentError(error); }
}

export async function DELETE(_req: NextRequest, context: Context) {
  try {
    const manager = await requirePropertyManager(), { id, attachmentId } = await context.params;
    await deleteAttachment(id, attachmentId, manager);
    revalidatePath('/[locale]/panel/propiedades/[id]/gastos', 'page');
    return NextResponse.json({ success: true });
  } catch (error) { return attachmentError(error); }
}
