# Diagnóstico — video del hero de la home (T-4677)

**Fecha:** 9 de noviembre de 2026. **Rama:** `alia/T-4677_diagnostico-hero-videos`. **Tipo:** solo lectura; no se cambió código.

Fuentes: código del repo en `main` (`bdd5bc6e`), documentación (`CONTEXTO.md`, `PROGRESO.md`, `HOME-COMPOSICION.md`) y peticiones GET públicas a la home de producción y a su video (solo cabeceras, primeros 64 KB y los últimos ~6 KB). No se consultó la BD ni Blob con credenciales.

## 1. Pedido

1. El cliente quiere ver **el video de la playa y el nuevo** en el hero, uno tras otro y en loop. Se pidió poder tener **varios videos**.
2. **En un equipo con Chrome de escritorio el video no carga.** En móviles y en otro equipo sí se ve.

## 2. Cómo funciona hoy

| Pieza | Dónde | Comportamiento |
|---|---|---|
| Render | `apps/web/src/app/[locale]/page.tsx:41-55` | Un `<video autoPlay loop muted playsInline preload="metadata">` con un `<source media="(prefers-reduced-motion: no-preference)">`. Valor: `SiteContent.home_background_video` o, si está vacío, `/videos/hero.mp4`. No tiene `poster`. |
| Control | `apps/web/src/components/HomeVideoMotion.tsx` | Con reduced-motion pausa el video; si no, llama a `play()` y descarta el error sin avisar. Si la fuente falla, cambia a `/videos/hero.mp4`. |
| CSS | `apps/web/src/app/globals.css:111-112` | Con reduced-motion, `.home-background-video { display: none; }`, a propósito. |
| Dato | `SiteContent.home_background_video` | **Una sola** URL HTTPS de 2048 caracteres como máximo (`site-content.ts:35`). El CHECK del esquema solo acepta claves conocidas. |
| Subida | `SiteContentEditor` → `POST /api/panel/site-content/upload` | Solo ADMIN, MP4/WebM, **máximo 4 MB** (`maxHeroVideoBytes = maxPhotoBytes = 4_000_000`). Se guarda en `site/home-video/<uuid>`. En el panel de la home no hay campo para pegar una URL. |
| Reemplazo | Mismo endpoint | **Borra el Blob anterior** de `site/home-video/`. Está documentado (`CONTEXTO.md:939`) y probado (`test-site-visual-assets.cjs:21`). |

**El límite de 4 MB no se puede aumentar:** deja margen bajo el tope de 4.5 MB que admiten las Functions de Vercel por petición (`CONTEXTO.md:658`). Para aceptar archivos más grandes habría que volver a la subida directa desde el navegador, que se retiró en la fase C1.

## 3. Archivos medidos

| | `public/videos/hero.mp4` (playa, respaldo) | Video en producción (`site/home-video/f9ba437f….mp4`, el nuevo) |
|---|---|---|
| Resolución | **720×1280 (vertical)** | **852×480 (horizontal)** |
| Duración | 19.5 s | 6.7 s |
| Codec | H.264 a 24 fps + audio AAC | H.264 Main, nivel 4.1, a 30 fps + audio AAC |
| Peso | 7.7 MB (~3.2 Mbps) | 3.7 MB (~4.4 Mbps; muy alto para 480p) |
| Faststart (`moov` al inicio) | Sí | **No**: el `moov` está al final, después de 3.69 MB de datos |
| Servidor | Estático del deploy | Blob: `Accept-Ranges: bytes`, `video/mp4`, `max-age=2592000` |

- El video de la playa **sigue en el repo** y por eso no se perdió al reemplazarlo. Pesa 7.7 MB, así que **no se puede subir por el panel** sin recomprimirlo.
- El audio de los dos se descarga sin necesidad, porque el hero va silenciado.

## 4. Por qué no carga en un equipo con Chrome de escritorio

| Causa | Estado | Motivo |
|---|---|---|
| **Reduced-motion activo en Windows** («Efectos de animación» apagados) | **La más probable** | Con esa preferencia el video se oculta y no se descarga, a propósito. Encaja con que falle en un solo equipo. |
| Política de autoplay de un equipo administrado, o aceleración por hardware o controlador de la GPU | Posible | `play()` falla sin avisar y no hay `poster`, así que solo queda el fondo sólido. |
| Faststart ausente | Agravante, no causa | Chrome lo reproduce pidiendo el final por rango, pero tarda más en empezar. En una red lenta puede parecer que no carga. |
| Codec no soportado | **Descartada** | Es H.264 Main, compatible con todo navegador. |
| CSP | **Descartada** | Es solo Report-Only y `media-src` permite `https:`. |
| Atributo `media` del `<source>` | **Descartada** | Los navegadores actuales lo soportan y los antiguos lo ignoran; en ambos casos el video se reproduce. |

**Cómo confirmarlo en ese equipo** (5 minutos):
1. Abrir la consola de DevTools (F12) en la home y ejecutar `matchMedia('(prefers-reduced-motion: reduce)').matches`. Si da `true`, la causa es esa: en Windows está en Configuración → Accesibilidad → Efectos visuales → «Efectos de animación».
2. Si da `false`: revisar `chrome://policy` (buscar «Autoplay») y `chrome://media-internals` (abrir la home y leer el error del reproductor).

## 5. Implementación recomendada (tarea aparte)

1. **Varios videos:** una clave nueva `home_background_videos` con una lista ordenada `[{url, dispositivo: movil|escritorio|ambos}]`, sin tocar `home_background_video`, que queda como valor anterior recuperable. Requiere SQL para el CHECK, aplicado primero en Respaldo, verificado y luego en main. La alternativa sin SQL, guardar JSON en la clave actual, se descarta porque al revertir el código el valor queda roto.
2. **Reproductor:** dos `<video>` que se alternan en `ended`. El siguiente empieza a cargar solo cuando el actual pasa de la mitad, para no descargar todos al abrir la página en móvil. Se mantienen reduced-motion y el respaldo.
3. **`poster`** en el video de la home, para que haya imagen si no hay autoplay.
4. **Orientación:** filtrar cada video por dispositivo, porque el vertical se recorta mucho en escritorio.
5. **Borrado:** al quitar un video de la lista, no borrar su Blob, o borrarlo solo con confirmación explícita. Hay que actualizar `test-site-visual-assets.cjs`.

## 6. Preparar los videos antes de subirlos (para Emma)

Requiere tener [ffmpeg](https://ffmpeg.org/download.html) instalado. **No se probó aquí**, porque ffmpeg no está instalado en esta máquina. Se trabaja con copias, nunca con el original.

```powershell
# Un video por vez. Quita audio, H.264 compatible, índice al inicio (faststart).
ffmpeg -i entrada.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 26 -maxrate 1500k -bufsize 3000k -vf "scale='min(1280,iw)':-2" -movflags +faststart salida.mp4
```

1. Revisar el peso de `salida.mp4`. Tiene que pesar **menos de 3.9 MB**. Si pesa más, repetir con `-crf 28` y, si aún no alcanza, con `-maxrate 1100k -bufsize 2200k`.
2. Para comprobar el faststart: `ffprobe -v trace salida.mp4 2>&1 | Select-String "type:'(moov|mdat)'"`. `moov` tiene que aparecer antes que `mdat`.
3. Estimado: la playa (19.5 s) a ≤1.5 Mbps queda en ≤3.7 MB.

## 7. Supuestos y lo que no se comprobó

- El video de la playa es `public/videos/hero.mp4` (lo confirmó el usuario). El nuevo es el que está en producción (deducido de que es horizontal y es el valor actual).
- No se tuvo acceso al equipo donde falla, así que la causa está **sin confirmar** hasta hacer las pruebas de la sección 4.
- No se ejecutaron build, tests ni ffmpeg, porque no hubo cambios de código.
