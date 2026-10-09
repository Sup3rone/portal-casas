# Detalle por escenas y footer en flujo normal

## Fondos personalizados de inicio/mapa/reserva (09 Oct 2026)

Los tres fondos se configuran desde el editor privado con SectionBackgroundEditor, debajo de la biblioteca. Selección exclusiva de PHOTO propia, miniaturas y Ninguna (blanco). Guardado independiente por sección mediante PATCH /api/properties/[id]; mismo gate dueño/admin, 404 propiedad ajena, 400 INVALID_BACKGROUND_PHOTO para VIDEO/URL ajena o fuera de biblioteca. La creación permanece NULL hasta tener biblioteca. No se ejecutó SQL/BD/Blob ni deploy.

Property incorpora sectionBgInicio/sectionBgMapa/sectionBgReserva nullable text. Son URLs verificadas, no nuevas relaciones: cambiar/borrar Media no actualiza automáticamente el fondo guardado. El panel muestra aviso si esa URL dejó de estar en la biblioteca; elegir otra o Ninguna. No se modifican Media ni las migraciones existentes.

SectionBackground conserva las tres secciones dentro del stage completo actual. Fondo cover decorativo de ancho de viewport SIN velo blanco/oscuro global; cuerpo largo puede desplazarse con fondo mientras la capa sigue a 100dvh. Sin URL, superficie del tema intacta. Con imagen las tarjetas/calendario/formulario tienen fondo blanco opaco (gray-900 opaco en oscuro), y los títulos directos Inicio/RESERVAR son blancos con text-shadow sutil, sin caja de fondo. Etiquetas grises conservan el refuerzo de contraste. Sin imagen, las reglas nuevas no aplican. No se transforman ni modifican EditorialPresentation, sus fondos/cuadros, galería/lightbox, mapa interactivo o calendario/formulario.

### SQL pendiente (scripts/sql/property-section-backgrounds.sql)

Convención del repo: transacción no idempotente; ejecutar una sola vez por branch. Emma verifica primero Respaldo. Antes de despliegue autorizado, restore point y mismo SQL manualmente en main. No se conectó con ninguna BD aquí.

```sql
BEGIN;
ALTER TABLE "Property"
  ADD COLUMN "sectionBgInicio" text,
  ADD COLUMN "sectionBgMapa" text,
  ADD COLUMN "sectionBgReserva" text;
COMMIT;
```

Propiedades existentes quedan NULL. El schema nuevo selecciona estos campos, por lo que aplicar la migración ANTES de usar ese código contra la BD real.

### QA manual de fondos para Emma

1. Aplicar SQL en Respaldo, sin repetirlo. Ejecutar pnpm dev; login como dueño/admin y abrir una propiedad con biblioteca PHOTO y un VIDEO para comparar.
2. En Fondos de las secciones elegir una foto diferente para Inicio, Mapa y Reserva; guardar cada una. Reabrir editor y verificar persistencia. Si faltan fotos, subirlas con uploader existente; no hay subida en estos selectores.
3. Abrir detalle es/en/fr: comprobar SOLO los tres fondos elegidos, cover a todo el ancho, sin bordes laterales blancos añadidos ni scroll horizontal. Editoriales deben verse idénticas al compararlas antes/después, con sus propias imágenes/narrativas/glass.
4. Probar lightbox, compartir, mapa/zoom y elección de fechas/formulario/WhatsApp. Volver entre escenas: no se pierde estado. Nada cambia en el motor, snap, navbar/↑ o reduced-motion.
5. Repetir 375px y desktop, claro/oscuro, con fotos muy blancas y muy oscuras. Revisar contraste AA (4.5:1 texto normal, 3:1 grande) de título, etiquetas, fechas, placeholders y botones con DevTools; registrar cualquier contraste insuficiente antes de aceptar QA. Offline no certifica contraste renderizado real.
6. Elegir Ninguna en cada selector, guardar y recargar: vuelve la superficie clara actual, o la oscura del tema, sin imagen ni ajustes locales nuevos de tarjetas/títulos. No se impone blanco literal en tema oscuro.
7. COLLABORATOR: PATCH de propiedad ajena → 404; URL de PHOTO ajena/VIDEO/no registrada en propiedad propia → 400 INVALID_BACKGROUND_PHOTO. CLIENT/VIEWER siguen sin permisos; ADMIN conserva acceso total, pero la foto debe ser de la propiedad editada.
8. Si una foto seleccionada se edita/retira de la biblioteca, el fondo mantiene su URL anterior hasta reemplazarlo/vaciarlo. Verificar aviso del selector y que se puede guardar otro fondo sin tocar los demás.

Validación nueva: scripts/test-section-backgrounds.cjs + suite completa de 23 scripts, TypeScript limpio, ESLint 0 errores/8 warnings heredados. Supuestos: las columnas almacenan URL verificada como selección guardada; se mantienen las escenas actuales dentro del stage, y sin selección se conserva el tema actual. QA visual manual pendiente.

Corrección vigente del 09 Oct 2026: se rechaza el híbrido. Las secciones de contenido permanecen en un único stage hasta Reserva; el footer vuelve al flujo normal después del recorrido. Sin BD/migraciones/deploy. QA visual manual pendiente.

## Composición exacta

Una sola instancia de EditorialPresentation con API slides conservada:
- scenes: primera escena de mosaico/título/datos/compartir/descripcion/fallbacks.
- slides: destino → amenidades → habitaciones → lugar, solo cuando contienen datos.
- afterScenes: mapa/advertencias (condicional) y calendario/reserva/WhatsApp. Footer inDetail se monta después del escenario, fuera de afterScenes.

Casa completa: siete escenas seguidas del footer normal, sin capa, altura forzada ni snap propio. Navbar/↑ y CTA son controles globales, no zonas de contenido. PropertyGallery, LocationMap, AvailabilityCalendar, MessageForm, ReservationDatesProvider, Footer, Navbar y diccionarios no se modifican internamente.

## Footer normal: frontera externa de snap

DetailFooterFlow.tsx envuelve Footer inDetail después del stage, sin cambiar Footer.tsx ni su estilo/Reveal. Wrapper flow-root contiene el margen original, sin 100dvh/posición sticky/snap. IntersectionObserver marca la llegada del pie al viewport (fallback scroll/resize). Mientras está visible, CSS suspende el snap obligatorio del documento para evitar rebotes a la última escena; al volver arriba lo restaura. No se modifica EditorialPresentation, las escenas/fondos, navbar/↑ ni #reservar. La prueba test-detail-scroll verifica ubicación única fuera del stage, frontera y cleanup. Seis regresiones (detalle/editoriales/fondos/Reveal/galería/consulta) pasan, TypeScript limpio y ESLint 0 errores/8 warnings heredados. QA visual nativo pendiente.

## Mecánica y controles

Cada capa y stage: 100dvh exactos. Cada intervalo snap también es un viewport; la longitud del contenido no añade tiempo de transición ni pantallas. El cuerpo de cada capa tiene overflow-y:auto nativo: scroll interno para el contenido largo, seguido por encadenamiento al documento al llegar al límite. El motor mantiene todas las capas montadas y NO reinicia sus posiciones internas. En mapa/reserva los controles son activos mientras la escena no cambia por scroll exterior.

Fondos/narrativas/cuadros glass editoriales intactos. Fundido del mismo motor atraviesa mosaico, editoriales, mapa y reserva; no autoplay. Progreso de fotos separado del de capas. Foco se transfiere explícitamente antes de desactivar una capa; lightbox pausa las actualizaciones y sigue siendo el diálogo existente, sin transformaciones de su contenido. Mapa conserva sus gestos, sin interceptarlos. Durante teclado móvil abierto con input activo el motor no avanza por cambios accidentales del viewport; al salir del campo/teclado se vuelve a medir. Safe-area/navbar/↑ conservados.

#reservar se resuelve al punto snap de su capa, no a la posición superpuesta del elemento oculto. Funciona desde CTA, hash inicial y cambio de hash; reduced-motion conserva navegación nativa con capas en orden. Reveal existente se difiere visualmente hasta primera activación de la capa; no se reescribe su hook ni se repite la entrada en siguientes visitas.

Reduced-motion: todas las capas y fotos accesibles sin fundido ni autoplay dentro del stage, a 100dvh y en orden; contenido largo con scroll interno. Footer es flujo normal posterior, sin fundido editorial.

## Pruebas automatizadas

22 scripts test-*.cjs offline pasan, TypeScript limpio, ESLint 0 errores/8 warnings heredados. test-detail-scroll inspecciona el árbol de la página y rechaza secciones/controles fuera del stage excepto el footer normal, verifica una copia fuera de afterScenes y siete paneles dentro del stage, atributos/CSS de 100dvh, puntos uniformes y altura total incluso con contenido largo. Verifica conservación de scrollTop, foco, pausa de diálogo, teclado/reduced-motion y navegación #reservar. test-editorial-presentation conserva SSR/idiomas y condiciones de datos. DOM simulado no certifica altura/snap nativo en navegador.

```powershell
pnpm dev
# Otra terminal, raíz:
node scripts/test-detail-scroll.cjs
node scripts/test-editorial-presentation.cjs
pnpm lint
# Desde apps/web:
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

## Checklist visual para Emma

1. Abrir casa QA completa en /es/casas/<slug>, 1440px. Deben existir siete escenas: mosaico, destino, amenidades, habitaciones, lugar, mapa/notas y reserva. El footer aparece después en flujo normal.
2. Primera escena: título, datos, mosaico original y descripción/fallbacks. Su capa ocupa una pantalla; contenido que exceda el alto se recorre dentro. Abrir/navegar/cerrar lightbox (X/Escape/exterior), comprobar retorno de foco y scroll de fondo bloqueado sin mover capas.
3. Recorrer las cuatro editoriales con scroll: fondos y cuadros glass iguales, textos correctos, fundido continuo. Esperar no avanza. Retroceder conserva contenido; fotos solo cambian por progreso de scroll.
4. Mapa/notas: ocupa una pantalla del mismo stage. Hacer zoom/gestos del iframe; desplazar contenido desde el margen si excede el alto. Mientras se usa el mapa no se cambia de capa; continuar fuera de su scroll lleva a reserva.
5. Reserva: calendario/formulario/WhatsApp dentro de UNA pantalla del stage, con scroll interno en móvil. Elegir fechas, comprobar sincronía/precio, llenar campos de prueba, salir por scroll y volver: valores/fechas y posición interna deben conservarse.
6. Probar validaciones y rango ocupado; enviar solo una consulta QA autorizada. WhatsApp sigue debajo del submit: abrir link y verificar número/mensaje sin enviar mensajes reales.
7. #reservar desde CTA y desde URL con hash: entra en la escena correcta, no regresa al inicio del stage. ↑ vuelve a primera escena. Navbar se oculta al bajar, reaparece al subir/inicio/foco, sin afectar controles.
8. Después de Reserva seguir scrolleando: aparece el footer normal una sola vez, con altura propia y sin snap/fundido del motor. Recorrerlo completo sin rebote a Reserva; subir devuelve al recorrido. Pulsar ↑ desde el footer vuelve al inicio. Probar 375px, es/en/fr y ambos temas.
9. Tab desde mosaico y editorial hacia nuevas escenas: no deja foco en capas inertes. Lightbox abierto detiene transiciones. En reserva con teclado móvil abierto, escribir/scroll interno no avanza accidentalmente a footer; cerrar teclado y salir permite continuar.
10. Repetir en 375px y 360px, luego 768px: scroll interno permite leer TODO, tocar calendario, acceder al submit y WhatsApp; sin scroll horizontal. Girar dispositivo; safe-area/↑ no cubren campos.
11. Repetir /en y /fr y ambos temas: mismo orden, textos/narrativas correctos y contraste original. Reveal de mapa/calendario/formulario aparece al llegar a su escena; el footer conserva su Reveal propio normal, no antes ni de nuevo al volver.
12. Activar reduced-motion antes de cargar y a mitad del recorrido: todo contenido/fotos visible sin animación, cada capa sigue dentro del stage, scroll interno para textos largos; #reservar/↑ funcionan sin smooth obligatorio.
13. Casa sin editoriales: mosaico → mapa si existe → reserva dentro del stage, luego footer normal, sin capas editoriales vacías. Casa sin fotos y sin mapa/notas: datos/fallbacks → reserva → footer accesibles, sin imágenes o información inventadas.
14. Registrar alturas de capas en DevTools (100dvh), continuidad de fondo, comportamiento de scroll interno/exterior y cualquier pérdida de foco/datos. Estos aspectos visuales/nativos quedan pendientes hasta completar este checklist.

Supuestos: las escenas vacías se omiten como antes; el contenido largo conserva un cuerpo desplazable en lugar de aumentar la altura de la diapositiva. En reduced-motion todas las capas están expuestas en orden dentro del mismo stage, sin fundido, conservando altura y scroll interno. No se cambia lógica de reservas ni datos.
