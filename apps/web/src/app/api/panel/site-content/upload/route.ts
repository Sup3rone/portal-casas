import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireAdmin, accessFailure } from '@/lib/property-access';
import { PhotoUploadError, photoMetadata } from '@/lib/photo-upload';
import { heroVideoMetadata } from '@/lib/hero-video-upload';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData().catch(() => null);
    const purpose = form?.get('purpose');
    const video = purpose === 'home-background-video';
    if (!form || form.getAll('file').length !== 1 || form.getAll('purpose').length > 1 || [...form.keys()].some(key => !['file', 'purpose'].includes(key)) || (purpose !== null && !video)) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    const file = form.get('file');
    if (!(file instanceof File)) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    const metadata = video ? heroVideoMetadata(file.type, file.size) : photoMetadata(file.type, file.size);
    await requireAdmin();
    const extension = metadata.contentType === 'video/mp4' ? 'mp4' : metadata.contentType === 'video/webm' ? 'webm' : metadata.contentType === 'image/jpeg' ? 'jpg' : metadata.contentType === 'image/png' ? 'png' : 'webp';
    const result = await put(video ? `site/home-video/${crypto.randomUUID()}.${extension}` : `site/listing/${crypto.randomUUID()}.${extension}`, file, {
      access: 'public', contentType: metadata.contentType, addRandomSuffix: false, allowOverwrite: false, token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    // T-4679: el video solo se sube; el editor lo añade a home_background_videos y se publica al guardar.
    // No se reemplaza ni se borra ningún video anterior: todos quedan recuperables en Blob.
    return NextResponse.json({ url: result.url }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof PhotoUploadError) return NextResponse.json({ error: 'validation', code: error.code }, { status: 400 });
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message, code: denied.code ?? (denied.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN') }, { status: denied.status });
    return NextResponse.json({ error: 'error', code: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
