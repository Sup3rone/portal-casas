// Lista de videos del hero de la home (T-4679). Compartido entre servidor y cliente.
// Se guarda como JSON en SiteContent.home_background_videos; home_background_video
// queda intacta como valor anterior recuperable.
export const homeVideoDevices = ['all', 'mobile', 'desktop'] as const;
export type HomeVideoDevice = typeof homeVideoDevices[number];
export type HomeVideo = { url: string; device: HomeVideoDevice };
export const maxHomeVideos = 6;
export const homeVideoFallback = '/videos/hero.mp4';
export const homeVideoPoster = '/og-default.jpg';
// Mismo corte que Tailwind `md`: escritorio desde 768 px.
export const homeVideoDesktopQuery = '(min-width: 768px)';

function validUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

/** Devuelve la lista válida o null si el valor está mal formado. Vacío = []. */
export function parseHomeVideos(value: string): HomeVideo[] | null {
  if (!value.trim()) return [];
  let raw: unknown;
  try { raw = JSON.parse(value); } catch { return null; }
  if (!Array.isArray(raw) || raw.length > maxHomeVideos) return null;
  const videos: HomeVideo[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const { url, device, ...rest } = item as Record<string, unknown>;
    if (Object.keys(rest).length || !validUrl(url) || !homeVideoDevices.includes(device as HomeVideoDevice)) return null;
    videos.push({ url, device: device as HomeVideoDevice });
  }
  return videos;
}

export function serializeHomeVideos(videos: HomeVideo[]) {
  return videos.length ? JSON.stringify(videos.map(({ url, device }) => ({ url, device }))) : '';
}

/** Lista efectiva para la home: la nueva lista o, si está vacía, el video anterior/fallback. */
export function effectiveHomeVideos(list: string, legacy: string): HomeVideo[] {
  const parsed = parseHomeVideos(list);
  if (parsed?.length) return parsed;
  return [{ url: legacy || homeVideoFallback, device: 'all' }];
}

/** Videos para móvil o escritorio; si ninguno aplica, el de respaldo (nunca lista vacía). */
export function videosForViewport(videos: HomeVideo[], desktop: boolean): HomeVideo[] {
  const matching = videos.filter(video => video.device === 'all' || video.device === (desktop ? 'desktop' : 'mobile'));
  return matching.length ? matching : [{ url: homeVideoFallback, device: 'all' }];
}
