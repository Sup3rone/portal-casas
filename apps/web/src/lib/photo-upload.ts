// Reglas comunes del uploader; el servidor valida el archivo recibido.
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const maxPhotoBytes = 4_000_000;
export const photoCompression = { thresholdBytes: 1_000_000, maxDimension: 1920, quality: 0.82, contentType: 'image/jpeg' } as const;
export type PhotoType = typeof photoTypes[number];
export class PhotoUploadError extends Error {
  constructor(public code: string) { super(code); }
}
export function photoMetadata(contentType: unknown, size: unknown) {
  if (!photoTypes.includes(contentType as PhotoType)) throw new PhotoUploadError('INVALID_FILE_TYPE');
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size <= 0 || size > maxPhotoBytes) throw new PhotoUploadError('INVALID_FILE_SIZE');
  return { contentType: contentType as PhotoType, size };
}
export function photoPath(propertyId: string, uuid: string, contentType: PhotoType) {
  const extension = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/png' ? 'png' : 'webp';
  return `properties/${encodeURIComponent(propertyId).replace(/\./g, '%2E')}/${uuid}.${extension}`;
}

// Solo navegador: la orientación se aplica a los píxeles antes de exportar JPEG.
export async function optimizePhoto(original: File): Promise<{ file: File; optimized: boolean }> {
  if (!photoTypes.includes(original.type as PhotoType) || original.size <= photoCompression.thresholdBytes) return { file: original, optimized: false };
  let bitmap: ImageBitmap | undefined, objectUrl: string | undefined, canvas: HTMLCanvasElement | undefined;
  try {
    if (typeof createImageBitmap === 'function') {
      try { bitmap = await createImageBitmap(original, { imageOrientation: 'from-image' }); }
      catch { /* Fallback de decodificación para navegadores sin soporte completo. */ }
    }
    let source: CanvasImageSource, width: number, height: number;
    if (bitmap) { source = bitmap; width = bitmap.width; height = bitmap.height; }
    else {
      const image = new Image();
      image.style.imageOrientation = 'from-image';
      objectUrl = URL.createObjectURL(original);
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve(); image.onerror = () => reject(new Error('decode'));
        image.src = objectUrl!;
      });
      source = image; width = image.naturalWidth; height = image.naturalHeight;
    }
    if (!width || !height) throw new Error('dimensions');
    const scale = Math.min(1, photoCompression.maxDimension / Math.max(width, height));
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas!.toBlob(resolve, photoCompression.contentType, photoCompression.quality));
    if (!blob || !blob.size || blob.type !== photoCompression.contentType || blob.size >= original.size) return { file: original, optimized: false };
    const base = original.name.split(/[\\/]/).pop()!.replace(/\.[^.]*$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100) || 'photo';
    return { file: new File([blob], `${base}.jpg`, { type: photoCompression.contentType, lastModified: original.lastModified }), optimized: true };
  } catch { return { file: original, optimized: false }; }
  finally {
    bitmap?.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
