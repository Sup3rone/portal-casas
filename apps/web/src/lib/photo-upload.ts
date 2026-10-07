// Reglas comunes del uploader; el servidor valida el archivo recibido.
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const maxPhotoBytes = 4_000_000;
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
