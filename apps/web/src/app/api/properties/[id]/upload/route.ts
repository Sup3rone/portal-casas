import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { accessFailure, requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { PhotoUploadError, photoMetadata, photoPath } from '@/lib/photo-upload';
import { heroVideoMetadata } from '@/lib/hero-video-upload';

export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id } = await params;
    await managedProperty(id, manager);
    const form = await request.formData().catch(() => null);
    if (!form || form.getAll('file').length !== 1 || [...form.keys()].some(key => !['file', 'purpose'].includes(key)) || form.getAll('purpose').length > 1 || form.has('purpose') && form.get('purpose') !== 'hero-video') throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    const file = form.get('file');
    if (!(file instanceof File)) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    const video = form.get('purpose') === 'hero-video';
    const metadata = video ? heroVideoMetadata(file.type, file.size) : photoMetadata(file.type, file.size);
    const uuid = crypto.randomUUID();
    const pathname = video ? `properties/${encodeURIComponent(id).replace(/\./g, '%2E')}/hero/${uuid}.${file.type === 'video/mp4' ? 'mp4' : 'webm'}` : photoPath(id, uuid, file.type as 'image/jpeg' | 'image/png' | 'image/webp');
    // Ignorar el nombre original y revalidar dueño antes de escribir en Blob.
    await managedProperty(id, manager);
    const result = await put(pathname, file, {
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
