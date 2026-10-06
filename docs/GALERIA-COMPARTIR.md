# Detalle: mosaico, lightbox y compartir — 05 Oct 2026

## Decisión de componentes

SectionSlider está compartido por CategorySection (amenidades/habitaciones),
CategoryGrid y el editor privado del panel. No se modificó en esta tarea.
PropertyGallery reemplaza exclusivamente el slider principal del detalle;
ambos componentes coexisten. La página conserva las queries, principal/fallback,
orden y datos de Media anteriores. Su cabecera pasa de hero a pantalla completa
a título y mosaico; los paneles de reserva no se cambian.

Hasta 8 miniaturas: dos columnas antes de md, tres desde md y cuatro desde lg.
Si sobran archivos, la última muestra +N y abre el octavo medio; desde ahí se
pueden recorrer todos con los controles. La navegación es circular. Se incluyen
videos existentes, con miniatura de video y controles al abrirlos. No se añade
autoplay. Image utiliza unoptimized para preservar las URLs de Media sin cambiar
la configuración de hosts/pipeline ni añadir dependencias.

## Lightbox y accesibilidad

Dialog nativo en la capa superior, con nombre localizado y aria-modal. Al abrir,
el foco va a X. Tab/Shift+Tab cierran el ciclo entre controles; el fondo queda
inactivo por showModal. ArrowLeft/ArrowRight navegan, Escape cierra. X y click en
el fondo también cierran; imágenes, video y botones no cierran por click.
El contador tiene etiqueta y anuncio localizado. Cerrar restaura el foco en
la miniatura que abrió el modal y el overflow anterior del body. Al desmontar
también se restaura overflow. Imágenes mantienen su proporción; los controles
tienen 44px. La entrada usa fade de 200ms y se anula con prefers-reduced-motion.

## Compartir desde el mapa

LocationMap sigue siendo un componente de servidor. PropertyShareButton añade
interactividad cliente sobre la esquina superior derecha del mapa y recibe el
nombre localizado de la propiedad. Envía título y window.location.href completo,
incluidos locale/query/hash si existen. No comparte las coordenadas del mapa.

Si navigator.share está disponible, se usa también en desktop. Si falta o falla
(salvo AbortError), se intenta navigator.clipboard.writeText. Cancelar vuelve a
idle y no copia. Copia/compartido/error tienen feedback de 3s, role=status y
traducciones; el botón se bloquea mientras espera. Si ambas APIs fallan se muestra
el error localizado. Son APIs de contexto seguro: probar en HTTPS o localhost.

## Archivos

| Archivo | Cambio |
| --- | --- |
| apps/web/src/components/PropertyGallery.tsx | Mosaico y lightbox nuevos, exclusivos del detalle |
| apps/web/src/components/PropertyShareButton.tsx | Share/copia, cancelación y feedback |
| apps/web/src/components/LocationMap.tsx | Botón cliente sobre el mapa y título recibido |
| apps/web/src/app/[locale]/casas/[slug]/page.tsx | Conectar mosaico y título del mapa; cabecera responsive |
| apps/web/src/app/globals.css | Entrada del lightbox y movimiento reducido |
| apps/web/messages/es.json, en.json, fr.json | Claves nuevas gallery/share; valores anteriores intactos |
| scripts/test-gallery-share.cjs | SSR localizado y capacidades share/copia simuladas |
| docs/CONTEXTO.md, docs/PROGRESO.md, docs/GALERIA-COMPARTIR.md | Convenciones, estado, decisión y checklist |

## Verificación realizada

- TypeScript y ESLint de archivos cambiados: sin errores; permanecen las dos
  advertencias previas de labels/categoryData en la página.
- test-gallery-share: es/en/fr, límite de miniaturas, media de video, mapa,
  payload título/URL, API nativa, copia, cancelación y permisos denegados.
- Regresiones test-inquiry y test-panel-render: pasan sin red ni BD real.
- Navegador Chromium integrado, casa con 55 fotos: es/en/fr a 360, 375, 768,
  1440px sin scroll horizontal. Columnas 2/2/3/4. Lightbox a 360 y 1440px,
  flechas, contador, Escape/X/fondo, foco circular y restauración. Fotos
  verticales/horizontales sin deformación. Animación medida: 0.2s.
- Diálogo nativo de compartir abierto y cancelado en el navegador. La copia
  se verificó con capacidades simuladas; no se envió el enlace a otra app.
- No había videos en la casa de navegador: se conserva la rama de video y se
  comprueba su render con fixture; reproducción real pendiente.

## Cómo probar manualmente

1. `pnpm dev` desde la raíz. Abrir una casa con muchas imágenes en /es, /en,
   /fr; en DevTools probar 360, 375, 768 y 1440px. No debe haber scroll lateral.
2. Abrir cualquier miniatura y el contador +N. Verificar foto grande centrada,
   contador, flechas y teclado ←/→, incluidas primera/última posición.
3. Tab/Shift+Tab deben permanecer en el modal. Cerrar con Escape, X y click en
   el fondo en aperturas distintas; el foco vuelve a la miniatura, el fondo
   vuelve a desplazarse y el formulario conserva sus valores.
4. Activar prefers-reduced-motion desde Rendering de DevTools: no debe haber
   animación de entrada. Probar también una propiedad preparada con videos:
   abrir, reproducir, navegar y cerrar; no debe seguir reproduciéndose al cerrar.
5. En móvil con touch, pulsar compartir sobre el mapa. Si hay Web Share, comprobar
   nombre y URL localizada en el selector nativo; probar cancelar sin copia.
   Completar el envío a una app propia durante la comprobación manual.
6. En un navegador sin Web Share, pulsar el mismo botón: comprobar el toast
   Enlace copiado / Link copied / Lien copié y pegar en un campo local para
   verificar la URL completa. En desktop con Web Share se abre su selector
   nativo. Si se deniega el portapapeles debe verse el error localizado.
7. Revisar que el panel y las categorías siguen usando SectionSlider.
8. Pruebas sin red: `node scripts/test-gallery-share.cjs`,
   `node scripts/test-inquiry.cjs`, `node scripts/test-panel-render.cjs`.

## Supuestos y notas

- Límite de 8 miniaturas como decisión visual; todos los medios siguen accesibles.
- El título compartido usa el nombre de la propiedad en el locale activo y la
  URL es la del visitante, sin construir ni forzar dominios/locales.
- Emular viewport no sustituye un iPhone/Android real. Compartir hacia otra app,
  copia en navegador sin Web Share, movimiento reducido e interacción real
  con video siguen en el checklist manual.
