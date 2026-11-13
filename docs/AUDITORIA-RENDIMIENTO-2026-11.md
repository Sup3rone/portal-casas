# Auditoría de rendimiento y fallos visuales — 12 Nov 2026 (T-4829)

Rama `alia/T-4829_rendimiento-visual`. Skills usadas: `vercel-react-best-practices` (reglas `async-*`, `bundle-*`, `server-*`) y criterios de `web-design-guidelines` (nombre accesible, `aria-expanded`). Parte de `AUDITORIA-2026-10-13.md`: aquí se mide lo que allí quedó como «dato no disponible».

## Cómo se midió

- `pnpm build` + `next start -p 3100` en local, contra la base del `.env` local (solo lectura: cargar páginas, sin enviar formularios).
- Lighthouse 12.8.2, Chrome headless, perfil móvil por defecto (red y CPU simuladas). Antes: 1 corrida móvil + 1 de escritorio. Después: 3 corridas móviles por página (la tabla muestra la mediana).
- Páginas: `/es`, `/es/casas`, `/es/casas/del-canto-vallarta`.

## Resultados

Móvil, después = rango de 3 corridas. «LCP obs.» es el observado en la corrida (sin simulación de red lenta).

| Página | Perf. antes → después | LCP simulado | LCP obs. | Peso total | A11y |
|---|---|---|---|---|---|
| Home `/es` | 87 → **95–96** | 3.9 → **2.7 s** | 1501 → **428–500 ms** | 4.9 → 4.2 MB (el resto es el video) | 100 |
| Listado `/es/casas` | 92 → 87–90 | 3.2 → 3.5–3.9 s | 618 → 599–792 ms | **3.0 MB → 644 KB (−79 %)** | 100 |
| Detalle `del-canto-vallarta` | 79 → **87–89** | 5.3 → **3.6–4.0 s** | 1200 → **879–924 ms** | **2.5 MB → 0.95 MB (−62 %)** | 100 |
| Detalle `arian-ocean-vallarta` (solo después) | 88–89 | 3.7–3.8 s | 835–928 ms | 875 KB | 100 |

Escritorio: home 98 → **99**, listado 95 → **100**, detalle 90 → **99** (arian-ocean: 96).

Listado: la puntuación simulada baja 2–5 puntos aunque baje un 79 % de peso y el LCP observado no cambie. Su LCP es el bloque `<main>` (texto), no una foto; el cambio viene del modelo de Lantern (orden distinto de peticiones), no de una carga más lenta. Se deja anotado, no se maquilla.

CLS = 0 y TBT ≤ 60 ms en todas: **el JavaScript no es el problema** (JS sin usar ≈ 22 KB).

## Corregido en esta tarea

| # | Hallazgo | Corrección | Evidencia |
|---|---|---|---|
| 1 | El hero de la home (`h1`) iba dentro de `Reveal`: `opacity:0` hasta hidratar → 3.5 s de *render delay* en el LCP. | `.enter-on-paint` (antes `.home-hero-enter`): la misma entrada (sube 48 px, 0.7 s) con `@keyframes` en CSS; sin animación con *reduced-motion*. | LCP home 3.9 → 2.7 s (estable en 3 corridas); LCP observado = FCP. |
| 2 | `readSiteContent()` sin `cache()`: el layout y la página lo pedían en la misma petición → 2 consultas iguales por visita a home y listado. | `export const readSiteContent = cache(...)`, como `readPublishedDestinations`. | TypeScript limpio; suite 69/70. |
| 3 | Botón de idioma: nombre accesible «Cambiar idioma» sin el texto visible «ES» (WCAG 2.5.3, `label-content-name-mismatch`). | `aria-label="ES — Cambiar idioma"`, `aria-expanded`, flecha `aria-hidden`. | Auditoría pasa (0 → 1) en las 3 páginas. |
| 4 | Todas las fotos públicas en tamaño original (`unoptimized`; `PropertyCard` con `<img>`, hasta 5 fotos de 1600 px por tarjeta). | **Opción A (elegida por el usuario):** `images.remotePatterns` solo para `*.public.blob.vercel-storage.com`, `qualities: [75]` (obligatorio en Next 16), caché de 31 días. `lib/image-src.ts` decide por URL: Blob y `/images/` se optimizan; otro host, `http`, query o puerto se sirven tal cual (no rompen la página). `PropertyCard` pasa a `next/image` con `sizes` por celda. **El panel sigue `unoptimized`** para no gastar transformaciones en miniaturas internas. `priority` (obsoleto en Next 16) → `preload` en el póster del video del detalle. | Peso −79 % listado, −62 % detalle. `test-image-src.cjs` nuevo. |
| 5 | Al servir la foto rápido apareció el mismo patrón que el hero: el título y la galería del detalle iban en `Reveal` (opacity 0 hasta hidratar). Con la foto ya ligera, el LCP del detalle pasó a esperar al JavaScript (*render delay* 4.3 s). | `.enter-on-paint` (nombre genérico de la animación CSS del punto 1) en el título y la galería del detalle. `Reveal` sigue para lo que está bajo el pliegue. | Detalle móvil 75 → 87–89; LCP 7.0 → 3.6–4.0 s. |

| 6 | Franja clara (~80 px) entre la página pública y el footer, visible desde la home (reporte del usuario con captura). El `mt-20` del footer queda fuera de `<main>` y mostraba el fondo por defecto del body; solo `.public-paper` era papel. | `body:has(.public-paper)` con el mismo papel, como ya hacía el panel (`panel-skin.css`). | Captura home y listado: papel continuo hasta el footer; body `rgb(244,241,236)`. `test-public-chrome.cjs` lo comprueba. |

**Costo de la opción A:** Vercel cobra la optimización por transformación (cada par foto × ancho) según el plan; con `minimumCacheTTL` de 31 días cada par se transforma una vez al mes como mucho. Las subidas nuevas llevan nombre único; las fotos migradas (`fotos/<slug>/NN.jpg`) no: si alguien reemplazara un archivo con la misma ruta, la versión optimizada vieja duraría hasta 31 días. 👉 Revisar el consumo en el dashboard de Vercel la primera semana.

## Pendientes (fuera de esta tarea)

| Prioridad | Hallazgo | Propuesta | Decisión de |
|---|---|---|---|
| **P1** | Video de fondo **404**: `site/home-video/f9ba437f-….mp4` está en la lista de videos de la home pero ya no existe en Blob. El reproductor lo salta, pero cada visita lo pide. | Quitarlo en Panel → Contenido (dato, no código). | Quien administra el contenido. |
| P2 | Las páginas públicas son dinámicas (`ƒ` en el build): cada visita consulta Neon aunque `casas/[slug]` tenga `generateStaticParams`. TTFB local ≈ 0.12 s (en caliente). | Investigar qué fuerza el modo dinámico (sesión, `headers`, cookies) y evaluar ISR/`use cache`. Riesgo medio: afecta el autollenado con sesión (T-4770). | Tarea aparte. |
| P2 | Video de la home de 3.6 MB también en móvil (`preload="metadata"`, pero `autoPlay` lo descarga). | Versión móvil más ligera (el panel ya admite video por viewport) o póster solo con datos ahorrados. | Contenido / tarea aparte. |
| P3 | Speed Insights no está activo (sí Analytics): sin CWV de usuarios reales. | Añadir `@vercel/speed-insights`. | Usuario (toca Vercel; puede tener costo según plan). |

## Qué NO se probó

- Panel y Mi cuenta (requieren sesión): sin Lighthouse.
- Producción real (Vercel/CDN): las cifras son de un build local; el TTFB y la red reales cambian.
- El optimizador en Vercel: localmente lo ejecuta `next start` (Sharp); en Vercel corre su servicio de imágenes, con su caché y su facturación.
- QA visual humana: la entrada `.enter-on-paint` y la rejilla de `PropertyCard` con `next/image` se verificaron en el HTML servido y en los tests, no a ojo en navegador (hover con zoom, 1/2/3/4/5 fotos, modo oscuro).
- Fotos de hosts distintos de Blob en la base: el helper las deja sin optimizar; no se contó cuántas hay.
- El aviso `errors-in-console` de `/_vercel/insights/script.js` es propio del entorno local (no existe fuera de Vercel); no es un fallo.
