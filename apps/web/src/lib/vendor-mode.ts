// T-5210 (pedido de Gabriel): «Modo usuario ↔ Modo vendedor». Puro: dada la ruta actual (con o sin prefijo de
// idioma) y su query, dice en qué modo está y a qué página EQUIVALENTE del otro modo saltar.
// - Panel/admin = modo vendedor; todo lo demás = modo usuario (el sitio público).
// - Ficha del vendedor (/panel/vender/<id>[/cotizar]) ↔ ficha pública (/casas/<slug>): como el panel usa el id y el
//   sitio el slug, se pasa por una página del servidor que traduce y revisa permisos (…/<id>/publica y …/abrir?slug=).
// - Búsqueda del vendedor ↔ /casas con las mismas fechas, huéspedes y destino. Nada más de la URL viaja.
export const MODE_COOKIE = 'alia_mode';
export type Mode = 'vendor' | 'user';

const STAY = ['start', 'end', 'guests'] as const;
const SEARCH = [...STAY, 'state', 'destinationCity'] as const;

function pick(search: string, keys: readonly string[], extra: Record<string, string> = {}) {
  const source = new URLSearchParams(search);
  const params = new URLSearchParams(extra);
  for (const key of keys) {
    const value = source.get(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? '?' + query : '';
}

export function modeTarget(pathname: string, search: string): { mode: Mode; target: string } {
  const path = pathname.replace(/^\/(?:es|en|fr)(?=\/|$)/, '') || '/';
  if (/^\/(?:panel|admin)(?:\/|$)/.test(path)) {
    const house = /^\/panel\/vender\/([^/]+)(?:\/cotizar)?\/?$/.exec(path);
    if (house && house[1] !== 'abrir') return { mode: 'vendor', target: `/panel/vender/${house[1]}/publica${pick(search, STAY)}` };
    if (/^\/panel\/vender\/?$/.test(path)) return { mode: 'vendor', target: `/casas${pick(search, SEARCH)}` };
    return { mode: 'vendor', target: '/' };
  }
  const house = /^\/casas\/([^/]+)\/?$/.exec(path);
  if (house) {
    let slug = house[1];
    try { slug = decodeURIComponent(slug); } catch { /* slug mal codificado: se usa tal cual */ }
    return { mode: 'user', target: `/panel/vender/abrir${pick(search, STAY, { slug })}` };
  }
  if (/^\/casas\/?$/.test(path)) return { mode: 'user', target: `/panel/vender${pick(search, SEARCH)}` };
  return { mode: 'user', target: '/panel/vender' };
}
