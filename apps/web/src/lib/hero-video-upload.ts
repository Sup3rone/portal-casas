import { PhotoUploadError, maxPhotoBytes } from './photo-upload';
export const heroVideoTypes = ['video/mp4', 'video/webm'] as const;
export const maxHeroVideoBytes = maxPhotoBytes;
export function heroVideoMetadata(type: string, size: number) {
  if (!(heroVideoTypes as readonly string[]).includes(type)) throw new PhotoUploadError('INVALID_VIDEO_TYPE');
  if (!Number.isSafeInteger(size) || size <= 0 || size > maxHeroVideoBytes) throw new PhotoUploadError('INVALID_VIDEO_SIZE');
  return { contentType: type, extension: type === 'video/mp4' ? 'mp4' : 'webm' };
}
