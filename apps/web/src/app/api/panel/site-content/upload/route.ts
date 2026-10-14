import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireAdmin, accessFailure } from '@/lib/property-access';
import { PhotoUploadError, photoMetadata } from '@/lib/photo-upload';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData().catch(() => null);
    if (!form || form.getAll('file').length !== 1 || [...form.keys()].some(key => key !== 'file')) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    const file = form.get('file');
    if (!(file instanceof File)) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
    const { contentType } = photoMetadata(file.type, file.size);
    await requireAdmin();
    const extension = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/png' ? 'png' : 'webp';
    const result = await put(`site/listing/${crypto.randomUUID()}.${extension}`, file, {
      access: 'public', contentType, addRandomSuffix: false, allowOverwrite: false, token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: result.url }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof PhotoUploadError) return NextResponse.json({ error: 'validation', code: error.code }, { status: 400 });
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message, code: denied.code ?? (denied.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN') }, { status: denied.status });
    return NextResponse.json({ error: 'error', code: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
