# Home: hasta cuatro propiedades destacadas

## Expansión mínima, sin migración

Se reutiliza `SiteContent.featured_property_id` (valor `text`). Admite el ID
histórico (`pa`) o un array JSON ordenado (`["pa","pb","pc","pd"]`). No se
agregan claves, columnas, tablas, endpoints ni constraints. El valor vacío
mantiene la sección oculta. Los selectores vacíos se omiten al guardar;
los restantes conservan su orden y se compactan al reabrir el editor.

La excepción al alcance de home es la ampliación expresamente solicitada de
Contenido del sitio: cuatro selectores numerados y su validación existente.
Solo ADMIN guarda la configuración. Se rechazan más de cuatro IDs,
duplicados, valores mal formados y propiedades inexistentes/no publicadas.

La home consulta las selecciones en paralelo y omite individualmente las
eliminadas, despublicadas o sin PHOTO. Conserva la prioridad de imagen actual:
primera portada por coverOrder; fallback a primera PHOTO por orden de biblioteca.
No completa automáticamente huecos con propiedades no elegidas por ADMIN.

## Presentación

- Misma ubicación de la destacada anterior: después de Sobre nosotros/redes.
- Grid de dos columnas desde 768px y una columna debajo de ese ancho.
- Fotos con `next/image`, `fill`, `sizes`, `unoptimized` conservado y lazy load.
- Nombre localizado con fallback español; subtítulo de ciudad y huéspedes.
- Serif del sistema (`font-serif`), sin descarga ni instalación de fuentes.
- Borde blanco fino, degradado para lectura, Reveal y hover existente 1.03.
- Enlace localizado a la ficha; reduced-motion conserva el fallback existente.

## Validación automatizada (sin navegador)

TypeScript limpio y ESLint con 0 errores, 5 warnings preexistentes.
Pasan `test-featured-property.cjs`, `test-site-content.cjs`,
`test-site-visual-assets.cjs` y `test-footer-contacts.cjs`.
El test ampliado cubre cuatro IDs, persistencia y orden, duplicados,
JSON inválido, máximo de cuatro, compatibilidad con ID único y omisión
individual tras despublicar/eliminar. No se conectó a Neon.

## Checklist de Emma — revisión visual y funcional pendiente

1. ADMIN → Contenido del sitio: comprobar los selectores numerados 1–4.
2. Elegir cuatro propiedades publicadas con fotos diferentes y guardar.
   Reabrir: confirmar las mismas cuatro selecciones y el mismo orden.
3. Home a **1440px**: ver cuatro tarjetas en **2×2**, debajo de Sobre nosotros;
   fotos completas como fondo, nombres serif grandes y bordes blancos finos.
4. Home a **375px**: confirmar una tarjeta por fila, sin scroll horizontal;
   nombres largos y subtítulos deben caber y seguir legibles.
5. Pulsar cada tarjeta: verificar la ficha y el slug correspondientes.
   Repetir en `/es`, `/en` y `/fr` para comprobar texto y ruta localizada.
6. Desktop: pasar el mouse sobre la foto; debe ampliarse sutilmente sin
   salir de la tarjeta. Tab debe mostrar foco visible y Enter abrir la ficha.
7. Dejar una o más selecciones en Ninguna y guardar: aparecen solo las
   elegidas, sin tarjetas vacías. Vaciar las cuatro: sección oculta.
8. Seleccionar una propiedad sin fotos o despublicar una elegida:
   esa tarjeta debe omitirse sin ocultar las otras. No hace falta modificar BD.
9. Revisar claro/oscuro y reduced-motion: texto legible y sin zoom obligatorio.

No se realizaron pruebas visuales, capturas ni simulaciones de UI automatizadas.


## Revelado de tarjetas — 2026-10-15

Solo home/CSS: escritorio desde 768px con hover real revela la descripción mediante opacity/translate de 200ms; focus-visible produce el mismo resultado. Velo de 28% negro. Tokens locales `--featured-veil`, `--featured-text`, `--featured-text-scrim` y `--featured-reveal-duration`. El degradado fijo debajo del contenido alcanza al menos 60% negro donde empieza el texto: blanco sobre la fotografía blanca más desfavorable alcanza 5.74:1. No se confía en el velo de 28% por sí solo para el contraste.

A 375px, o con dispositivo sin hover, descripción y CTA permanecen visibles SIN velo de hover; se conserva el degradado inferior fijo para lectura. Descripción del idioma activo (sin fallback inventado), máximo 3 líneas por CSS con ellipsis. Si falta, se omite el párrafo pero se mantiene el CTA. El contenido está en flujo dentro de la tarjeta para no cortarse con títulos largos; el espacio del revelado se reserva también en escritorio para evitar saltos al pasar el cursor.

Se reutiliza `common.verMas` (es/en/fr). El CTA permanece visible, centrado bajo el subtítulo y la descripción; es un span visual de altura mínima 44px dentro del enlace único de toda la tarjeta: ningún botón/enlace anidado, ningún segundo foco y ninguna doble navegación. Su texto está incluido en el nombre accesible del enlace junto al nombre de la propiedad. Reduced-motion desactiva las transiciones y desplazamientos del revelado. No se abrió navegador ni se generaron capturas.

### Checklist adicional de Emma

1. Desktop 1440px: pasar el cursor sobre cada tarjeta. Deben aparecer velo fino y descripción de hasta tres líneas en unos 200ms; Ver más permanece visible y centrado. La foto debe seguir clara. Retirar el cursor: desaparecen velo y descripción, sin saltar la tarjeta.
2. Tab hasta una tarjeta: comprobar el mismo revelado con foco visible. Enter abre su ficha una sola vez. Comprobar también clic en la foto y en Ver más, ambos al mismo destino.
3. A 375px, sin necesidad de hover: descripción y CTA siempre visibles, sin velo adicional, sobre el gradiente inferior. Revisar un nombre largo y descripción extensa: sin contenido cortado ni overflow horizontal.
4. Probar una propiedad sin descripción: no aparece párrafo vacío; Ver más sigue funcionando. Revisar es/en/fr y destino localizado.
5. Activar prefers-reduced-motion: revelado instantáneo sin desplazamiento ni animación.
6. Repetir en ambos temas, con una foto clara y una oscura: texto blanco, CTA y foco legibles.


### Ajuste de visibilidad y jerarquía

Se elimina el degradado adicional que cubría toda la foto: ya no se acumulan tres capas oscuras. El único velo global es el de hover (28%); el degradado local inferior de 60% sostiene el texto sin cubrir la parte alta de la imagen. Título con clamp de 27–42px (antes 30/48px), subtítulo de 15–15.4px (antes 14px). CTA fuera del bloque de opacidad condicional, centrado y con 44px mínimos; conserva el mismo enlace y traducción. A 375px permanece visible y los textos usan la misma escala proporcional. Verificación visual pendiente de Emma.

### Reposo y revelado separados
Reposo: solo título y subtítulo con sombra de texto localizada; sin velo, descripción ni CTA visibles. Hover o foco de teclado revelan gradiente, descripción (3 líneas) y CTA de 44px en 200ms. En pantalla táctil el primer toque revela y el segundo (incluido sobre Ver más) navega por el mismo enlace; al perder foco se restablece el reposo. Reduced-motion elimina las transiciones. HomeFeaturedLink añade únicamente ese estado de presentación; datos y destinos no cambian. Esta variante sustituye la visibilidad permanente del CTA descrita arriba. Validación visual manual pendiente: desktop, 375px, ambos temas y es/en/fr.
