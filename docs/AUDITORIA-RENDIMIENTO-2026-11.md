# Auditoría de rendimiento y fallos visuales — 12 Nov 2026 (T-4829)

Rama `alia/T-4829_rendimiento-visual`. Skills usadas: `vercel-react-best-practices` (reglas `async-*`, `bundle-*`, `server-*`) y criterios de `web-design-guidelines` (nombre accesible, `aria-expanded`). Parte de `AUDITORIA-2026-10-13.md`: aquí se mide lo que allí quedó como «dato no disponible».

## Cómo se midió

- `pnpm build` + `next start -p 3100` en local, contra la base del `.env` local (solo lectura: cargar páginas, sin enviar formularios).
- Lighthouse 12.8.2, Chrome headless, perfil móvil por defecto (red y CPU simuladas). Antes: 1 corrida móvil + 1 de escritorio. Después: 3 corridas móviles por página (la tabla muestra la mediana).
- Páginas: `/es`, `/es/casas`, `/es/casas/del-canto-vallarta`.

## Resultados (móvil)

| Página | Perf. antes → después | LCP antes → después | A11y | Qué limita hoy |
|---|---|---|---|---|
| Home `/es` | 87 → **95** | 3.9 s → **2.7 s** (observado: 484 ms, igual a FCP) | 100 | Video de fondo de 3.6 MB; CSS bloqueante (~300 ms) |
| Listado `/es/casas` | 92 → 93 (sin cambio real) | 3.2 s → 3.2 s | 100 | Fotos originales en las tarjetas: Lighthouse estima **2.5 MB** de ahorro con tamaños adecuados |
| Detalle | 79 → 81 (ruido: 74–81) | 5.3 s → 4.7 s (varía de 4.7 a 9.4 s) | 100 | La foto LCP es un JPG original (~250 KB) que tarda 1.6–2.5 s en bajar; **1.5 MB** de ahorro estimado |

Escritorio (solo antes): home 98, listado 95, detalle 90. CLS = 0 y TBT ≤ 60 ms en todas: **el JavaScript no es el problema** (JS sin usar ≈ 22 KB).

## Corregido en esta tarea

| # | Hallazgo | Corrección | Evidencia |
|---|---|---|---|
| 1 | El hero de la home (`h1`) iba dentro de `Reveal`: `opacity:0` hasta hidratar → 3.5 s de *render delay* en el LCP. | `.home-hero-enter`: la misma entrada (sube 48 px, 0.7 s) con `@keyframes` en CSS; sin animación con *reduced-motion*. | LCP home 3.9 → 2.7 s (estable en 3 corridas); LCP observado = FCP. |
| 2 | `readSiteContent()` sin `cache()`: el layout y la página lo pedían en la misma petición → 2 consultas iguales por visita a home y listado. | `export const readSiteContent = cache(...)`, como `readPublishedDestinations`. | TypeScript limpio; suite 69/70. |
| 3 | Botón de idioma: nombre accesible «Cambiar idioma» sin el texto visible «ES» (WCAG 2.5.3, `label-content-name-mismatch`). | `aria-label="ES — Cambiar idioma"`, `aria-expanded`, flecha `aria-hidden`. | Auditoría pasa (0 → 1) en las 3 páginas. |

## Pendientes (fuera de esta tarea)

| Prioridad | Hallazgo | Propuesta | Decisión de |
|---|---|---|---|
| **P1** | Todas las fotos públicas se sirven en tamaño original (`unoptimized` ×21; `PropertyCard` con `<img>`; 4 fotos por tarjeta). `next.config.ts` no tiene `images.remotePatterns`. Es el **mayor ahorro**: ~2.5 MB en el listado y ~1.5 MB en el detalle. | Opción A: `remotePatterns` para `*.public.blob.vercel-storage.com` y quitar `unoptimized` en vistas públicas. Opción B: generar una miniatura al subir (`photo-upload.ts` ya reduce a un solo tamaño) y usarla en tarjetas. | Usuario: A **tiene costo en Vercel** (Image Optimization se cobra por transformación según el plan); B no tiene costo pero son más horas y requiere migrar las fotos existentes. |
| **P1** | Video de fondo **404**: `site/home-video/f9ba437f-….mp4` está en la lista de videos de la home pero ya no existe en Blob. El reproductor lo salta, pero cada visita lo pide. | Quitarlo en Panel → Contenido (dato, no código). | Quien administra el contenido. |
| P2 | Las páginas públicas son dinámicas (`ƒ` en el build): cada visita consulta Neon aunque `casas/[slug]` tenga `generateStaticParams`. TTFB local ≈ 0.12 s (en caliente). | Investigar qué fuerza el modo dinámico (sesión, `headers`, cookies) y evaluar ISR/`use cache`. Riesgo medio: afecta el autollenado con sesión (T-4770). | Tarea aparte. |
| P2 | Video de la home de 3.6 MB también en móvil (`preload="metadata"`, pero `autoPlay` lo descarga). | Versión móvil más ligera (el panel ya admite video por viewport) o póster solo con datos ahorrados. | Contenido / tarea aparte. |
| P3 | Speed Insights no está activo (sí Analytics): sin CWV de usuarios reales. | Añadir `@vercel/speed-insights`. | Usuario (toca Vercel; puede tener costo según plan). |

## Qué NO se probó

- Panel y Mi cuenta (requieren sesión): sin Lighthouse.
- Producción real (Vercel/CDN): las cifras son de un build local; el TTFB y la red reales cambian.
- Escritorio después de los cambios (solo se midió antes).
- QA visual humana del hero: la animación se verificó en el HTML servido (`home-hero-enter`), no a ojo en navegador.
- El aviso `errors-in-console` de `/_vercel/insights/script.js` es propio del entorno local (no existe fuera de Vercel); no es un fallo.
