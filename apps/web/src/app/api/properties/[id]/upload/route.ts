import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { accessFailure, requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { PhotoUploadError, photoMetadata, photoPath } from '@/lib/photo-upload';

export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id } = await params;
    await managedProperty(id, manager);
    const form = await request.formData().catch(() => null);
    if (!form || form.getAll('file').length !== 1 || [...form.keys()].some(key => key !== 'file')) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    const file = form.get('file');
    if (!(file instanceof File)) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    const metadata = photoMetadata(file.type, file.size);
    // Ignorar el nombre original y revalidar dueño antes de escribir en Blob.
    await managedProperty(id, manager);
    const result = await put(photoPath(id, crypto.randomUUID(), metadata.contentType), file, {
      access: 'public', contentType: metadata.contentType,
      addRandomSuffix: false, allowOverwrite: false, token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: result.url }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof PhotoUploadError) return NextResponse.json({ error: 'validation', code: error.code }, { status: 400 });
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message, code: denied.code || (denied.status === 404 ? 'PROPERTY_NOT_FOUND' : denied.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN') }, { status: denied.status });
    // No devolver mensajes del SDK, tokens ni detalles de la configuración.
    return NextResponse.json({ error: 'upload', code: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
