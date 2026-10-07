import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { accessFailure, requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { maxPhotoBytes, PhotoUploadError, photoTokenInput } from '@/lib/photo-upload';

export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id } = await params;
    await managedProperty(id, manager);
    const body = await request.json().catch(() => null);
    if (body?.type !== 'blob.generate-client-token' || !body.payload || body.payload.multipart !== false) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    photoTokenInput(id, body.payload.pathname, body.payload.clientPayload);
    const result = await handleUpload({
      request, body: body as HandleUploadBody,
      onBeforeGenerateToken: async (pathname, payload) => {
        // Revalidar dueño antes de emitir un token; el token solo permite esta ruta.
        await managedProperty(id, manager);
        const metadata = photoTokenInput(id, pathname, payload);
        return {
          allowedContentTypes: [metadata.contentType], maximumSizeInBytes: maxPhotoBytes,
          validUntil: Date.now() + 5 * 60 * 1000, addRandomSuffix: false, allowOverwrite: false,
        };
      },
      // La Media se crea con el API existente después del upload; sin webhook ni migración.
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof PhotoUploadError) return NextResponse.json({ error: 'validation', code: error.code }, { status: 400 });
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message, code: denied.code || (denied.status === 404 ? 'PROPERTY_NOT_FOUND' : denied.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN') }, { status: denied.status });
    // No devolver mensajes del SDK, tokens ni detalles de la configuración.
    return NextResponse.json({ error: 'upload', code: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
