// T-4829: qué fotos pasan por el optimizador de next/image (tamaño por pantalla + WebP).
// Solo Vercel Blob (lo permitido en `images.remotePatterns` de next.config.ts) y los archivos de /public/images.
// Cualquier otra URL (otro host, query string, http) se sirve tal cual: next/image respondería 400 o lanzaría
// un error con un host no permitido, y una foto antigua no debe romper la página.
// Las vistas del panel siguen con `unoptimized` a propósito: cada transformación se cobra en Vercel.
const BLOB_HOST = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/i;

export function isOptimizableImage(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith('/images/')) return !src.includes('?');
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && BLOB_HOST.test(url.hostname) && !url.search && !url.port;
  } catch {
    return false;
  }
}

/** Prop lista para <Image>: `unoptimized` cuando la URL no se puede optimizar. */
export const unoptimizedFor = (src: string | null | undefined) => !isOptimizableImage(src);
