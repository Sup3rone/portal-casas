// Reglas comunes del uploader; Blob aplica de nuevo los límites del token firmado.
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const maxPhotoBytes = 5_000_000;
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
export function photoTokenInput(propertyId: string, pathname: unknown, payload: unknown) {
  let metadata;
  try { metadata = typeof payload === 'string' ? JSON.parse(payload) : null; }
  catch { throw new PhotoUploadError('INVALID_UPLOAD_REQUEST'); }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || Object.keys(metadata).some(key => !['contentType', 'size'].includes(key))) throw new PhotoUploadError('INVALID_UPLOAD_REQUEST');
  const value = photoMetadata(metadata.contentType, metadata.size);
  if (typeof pathname !== 'string') throw new PhotoUploadError('INVALID_UPLOAD_PATH');
  const uuid = pathname.split('/').at(-1)?.split('.')[0] || '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid) || pathname !== photoPath(propertyId, uuid, value.contentType)) throw new PhotoUploadError('INVALID_UPLOAD_PATH');
  return value;
}
