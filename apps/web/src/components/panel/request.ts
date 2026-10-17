const codes: Record<string, string> = {
  INVALID_CONTACT_EMAIL: 'invalidContactEmail',
  INVALID_HERO_VIDEO: 'invalidHeroVideo', INVALID_SECTION_TITLES: 'invalidSectionTitles',
  INVALID_VIDEO_TYPE: 'invalidVideoType', INVALID_VIDEO_SIZE: 'invalidVideoSize',
  INVALID_DESTINATION: 'invalidDestination',
  UNAUTHENTICATED: 'sessionExpired', SESSION_USER_NOT_FOUND: 'sessionExpired',
  FORBIDDEN: 'forbidden', ROLE_NOT_ALLOWED: 'forbidden', PROPERTY_NOT_FOUND: 'notFound',
  INVALID_COVER_SELECTION: 'invalidCoverSelection', INVALID_COVER_PHOTO: 'invalidCoverPhoto',
  INVALID_BACKGROUND_PHOTO: 'invalidBackgroundPhoto', INVALID_SECTION: 'invalidSection',
  INVALID_SECTION_CONTENT: 'invalidSectionContent', INVALID_SECTION_PHOTOS: 'invalidSectionPhotos', INVALID_HERO: 'invalidHero',
  ABOUT_TOO_LONG: 'aboutTooLong', INVALID_SOCIAL_URL: 'invalidSocialUrl', INVALID_CONTACT_WHATSAPP: 'invalidContactWhatsapp',
  INVALID_FEATURED_PROPERTY: 'invalidFeaturedProperty', INVALID_SITE_CONTENT: 'invalidSiteContent', INVALID_JSON: 'invalidRequest',
  INVALID_FILE_TYPE: 'invalidPhotoType', INVALID_FILE_SIZE: 'invalidPhotoSize', INVALID_UPLOAD_REQUEST: 'invalidUploadRequest', UPLOAD_FAILED: 'uploadFailed',
};
const keys = new Set(['error', 'validation', 'forbidden', 'notFound', 'conflict', 'sessionExpired', 'networkError', ...Object.values(codes)]);
export class PanelRequestError extends Error {
  constructor(key: string, public status?: number, public code?: string) { super(key); }
}
export function panelErrorKey(error: unknown, fallback = 'error') {
  return error instanceof Error && keys.has(error.message) && error.message !== 'error' ? error.message : fallback;
}
export function panelResponseError(status: number, payload: unknown) {
  const data = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const code = typeof data.code === 'string' ? data.code : undefined;
  const recognized = code && Object.hasOwn(codes, code) ? codes[code]
    : [data.error, data.message].find((value): value is string => typeof value === 'string' && keys.has(value) && value !== 'error');
  const key = status === 401 ? 'sessionExpired' : status === 403 ? (recognized === 'sessionExpired' ? 'sessionExpired' : 'forbidden') : recognized
    || (status === 404 ? 'notFound' : status === 400 ? 'validation' : status === 409 ? 'conflict' : 'error');
  return new PanelRequestError(key, status, code);
}
export async function panelRequest(url: string, method: string, body?: unknown) {
  let response: Response;
  try { response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw new PanelRequestError('networkError'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw panelResponseError(response.status, data);
  return data;
}
export const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-green-700 focus:outline-none';
export const buttonClass = 'min-h-11 min-w-11 rounded-lg bg-green-700 px-4 py-2 font-medium text-white dark:text-gray-100 disabled:opacity-50';
