export type MapsLocation = { lat: number; lng: number };
export type MapsParse = { location: MapsLocation; error?: never } | { error: 'mapsInvalid' | 'mapsShort' | 'mapsRange'; location?: never };
const coordinate = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
export function parseMapsUrl(value: string): MapsParse {
  let url: URL;
  try { url = new URL(value.trim()); } catch { return { error: 'mapsInvalid' }; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return { error: 'mapsInvalid' };
  if (url.hostname === 'maps.app.goo.gl' || url.hostname === 'goo.gl' && url.pathname.startsWith('/maps')) return { error: 'mapsShort' };
  if (!['maps.google.com', 'www.google.com', 'google.com'].includes(url.hostname) ||
      url.hostname !== 'maps.google.com' && !/^\/maps(?:\/|$)/.test(url.pathname)) return { error: 'mapsInvalid' };
  let path: string;
  try { path = decodeURIComponent(url.pathname + url.search); } catch { return { error: 'mapsInvalid' }; }
  // El pin de place/data tiene prioridad sobre el centro de cámara @.
  const pin = new RegExp(`!3d(${coordinate})!4d(${coordinate})(?:!|\\?|&|/|$)`).exec(path);
  const query = new RegExp(`^(${coordinate}),\\s*(${coordinate})$`).exec((url.searchParams.get('q') || url.searchParams.get('query') || '').trim());
  const camera = new RegExp(`@(${coordinate}),(${coordinate})(?:,|/|$)`).exec(path);
  const match = pin || query || camera;
  if (!match) return { error: 'mapsInvalid' };
  const lat = Number(match[1]), lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { error: 'mapsRange' };
  return { location: { lat, lng } };
}
