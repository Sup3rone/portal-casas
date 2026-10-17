# Composición de home — 2026-10-16

Orden vigente: **hero → carrusel de destacadas → Sobre nosotros**. Solo la home vuelve a usar su video configurado, o `/videos/hero.mp4` como fallback. `PUBLIC_PHOTO_BACKGROUNDS` no cambia: listado y fichas conservan papel beige. `HOME_HERO_MEDIA_ENABLED` permite desactivar reversiblemente el video de la home. En reduced-motion el video se oculta/pausa con HomeVideoMotion existente; queda un fondo sólido del tema del hero, con texto claro.

## Navbar de home

`Navbar.tsx` añade comportamiento solo cuando la ruta es `/` (incluye prefijos es/en/fr). Navbar fixed, transparente arriba, texto/iconos claros y monograma claro. Un scrim superior sobre el video protege la lectura; el menú de cuenta y el popover de búsqueda mantienen sus superficies opacas habituales.

Al bajar dentro del hero se oculta; al subir reaparece mate; al salir del hero permanece visible mate, incluso al bajar. El foco dentro de navbar evita ocultarlo durante uso con teclado. `:focus-within` mantiene accesibilidad de los controles. No cambia el comportamiento de /casas, fichas o panel. Transición de 200ms, sin transición con reduced-motion.

## Destacadas

Se conservan las mismas tarjetas HomeFeaturedLink, con título, descripción y revelado táctil existentes. HomeFeaturedCarousel solo controla el recorrido: tres tarjetas por vista desde 1024px y una por debajo. Avanza una posición cada 3 segundos cuando hay más de tres propiedades, está visible y no hay hover/foco ni reduced-motion. Al llegar al último grupo vuelve al primero. No hay clones ni enlaces duplicados.

Con hasta tres propiedades no hay autoplay. En desktop se ocultan las flechas en ese caso; en móvil se conservan con dos/tres para poder acceder a las demás tarjetas, pues solo se ve una. Sin librería de gestos: navegación por flechas de 44px y teclado; no se añade swipe personalizado. El foco de enlaces fuera de la parte visible conserva la capacidad de desplazamiento del contenedor. La elección de una tarjeta y su navegación no cambian.

## Sobre nosotros editable

Se conservan `about_es/en/fr`. Se añaden cuatro claves SiteContent: `about_title_es/en/fr` (máximo 200 caracteres) y `about_image` (URL HTTPS). Textos con límite existente de 2000. El título vacío utiliza el título localizado existente de Sobre nosotros. La sección completa se omite si falta imagen o texto en el idioma activo; incluye redes solo dentro de la sección visible, sin borrar sus URLs.

Desktop: imagen vertical 2:3 a la izquierda y título + descripción en la columna derecha; móvil: se apilan. Reveal mantiene su comportamiento existente de una sola entrada y no se oculta al retroceder. No se modifica Reveal.

Editor ADMIN: campos de título por idioma, traducción reutilizada y subida/drop de imagen. Comparte la compresión, cola y validación de la subida de activos existente y **el mismo POST `/api/panel/site-content/upload`**. El endpoint no se modifica; por compatibilidad la imagen nueva se aloja también bajo su prefijo existente `site/listing/`. La subida no guarda SiteContent: pulsar Guardar para persistir la URL. Un editor antiguo que omite las claves nuevas no las borra.

## SQL pendiente de ejecución manual

SiteContent tiene CHECK de claves: no basta con enviar claves nuevas desde el editor. `scripts/sql/site-content-about.sql` amplía el CHECK de nueve a trece claves. **Solo preparado, no ejecutado.** No añade tablas/columnas ni toca schema de Property, datos o archivos de Blob.

Emma: ejecutar primero en Neon **Respaldo**, comprobar guardado/lectura y solo después aplicar en main con el procedimiento habitual de respaldo. Aplicarlo antes del despliegue/uso del editor nuevo; guardar cualquier campo con el código nuevo incluye las trece claves. Sin ampliar el CHECK, PostgreSQL rechazará el guardado. El script presupone el CHECK vigente de nueve claves y se ejecuta manualmente una vez.

## Validación offline

- TypeScript limpio; ESLint 0 errores y 5 warnings existentes.
- Tests de home, contenido, activos visuales, destacadas, textos franceses y navbar pasan.
- `test-home-composition.cjs`: SSR es/en/fr, orden, imagen/título/texto, ausencia de cuadro incompleto, validación, compatibilidad con editor antiguo, CHECK y lógica aislada de scroll/navbar y reloj del carrusel. No ejecuta navegador ni operaciones externas.
- Suite completa: 48/49 scripts pasan. Falla `test-public-chrome.cjs`, preexistente: exige public-header/public-footer en todos los selectores y rechaza `.home-brand`. Esos dos archivos están sin cambios respecto a HEAD y quedan fuera de esta tarea.

## Checklist humana de Emma

1. Aplicar el SQL primero en Respaldo. En ADMIN → Contenido del sitio, escribir títulos y textos es/en/fr, subir una foto vertical y Guardar. Reabrir para comprobar persistencia.
2. Home a 1440px: navbar transparente sobre el hero, textos/iconos legibles incluso en fotogramas claros. Abrir cuenta y búsqueda: menús opacos y legibles.
3. Bajar dentro del hero: navbar se oculta. Subir: reaparece mate. Salir del hero bajando: reaparece mate. Volver al inicio: transparente.
4. /casas: navbar mate con el comportamiento anterior. Revisar ficha y panel sin cambios de composición.
5. Con cuatro destacadas: tres visibles a 1440px, avance una tarjeta cada 3s. Hover o foco de teclado lo detienen. Flechas anterior/siguiente recorren las tarjetas y el enlace abre la ficha correcta.
6. Con dos destacadas: sin rotación; en desktop sin flechas. A 375px, una por vista y flechas para ver la otra.
7. Después del carrusel: Sobre nosotros con imagen 2:3 a la izquierda, título a la derecha y descripción debajo del título. A 375px, imagen y contenido apilados, sin desbordamiento.
8. Vaciar imagen o texto del idioma activo y guardar: no queda sección vacía. Un título vacío utiliza el título localizado existente. Restaurar los valores deseados después de probar.
9. Recorrer el scroll en ambos sentidos: Reveal aparece una vez y permanece visible. Reduced-motion: sin autoplay del carrusel, video pausado/oculto y movimientos no obligatorios; flechas siguen funcionando.
10. Repetir en es/en/fr y claro/oscuro, 1440px y 375px. Validar contraste visual real, teclado Tab/Enter/Escape y foco de regreso al cerrar menús.

No se generaron capturas ni se abrió navegador automatizado. QA visual y ejecución SQL quedan a cargo de Emma.
