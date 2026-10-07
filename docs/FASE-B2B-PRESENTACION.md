# Fase B2b — Presentación editorial del detalle

Implementada sin migraciones, operaciones Neon ni cambios en editor/API B2a.
El detalle carga PropertySection en servidor tras verificar la propiedad publicada.
No hay fetch editorial del cliente ni dependencia/librería nueva en producción.
Ajuste B2b-2: dos cuadros glass y mapa/advertencias final, con ALTER CHECK pendiente.

## Contenido y convivencia con el detalle anterior

- Orden fijo destino → amenidades → habitaciones → lugar. Una fila participa si
  tiene descripción no vacía para el idioma activo o heroMediaId definido.
  No hay fallback de español para textos vacíos en inglés/francés.
- Filas inexistentes, completamente null o sin descripción activa/hero se omiten.
  La ausencia en el idioma activo conserva el comportamiento anterior de esa sección.
- Preparación pura en lib/editorial-presentation.ts: PHOTO de la misma propiedad,
  hero primero y luego fotos de la categoría, sin repetir hero. Categorías:
  destino=principal, amenidades=amenidades, habitaciones=habitaciones, lugar=lugar.
  Orden por Media.order y desempate por id, solo para la presentación nueva.
- Si solo hay texto, el bloque funciona sin imagen sobre fondo gris oscuro.
  Un hero incoherente/VIDEO no se usa; la sección conserva su narrativa y PHOTO
  válidas de categoría. B2a/FK son la protección normal contra datos incoherentes.
- Título, mosaico/lightbox y descripción general conservan sus componentes.
  La presentación mantiene su lugar en el flujo; el mapa se mueve al bloque
  final antes de reservar, y compartir sigue accesible también en encabezado.
- Amenidades/habitaciones sin narrativa editorial conservan CategorySection tal cual.
  “Lo que ofrece este lugar” conserva el array previo cuando lugar no tiene contenido.
- Para mantener los vídeos existentes, si una categoría editorial amenidades/
  habitaciones contiene VIDEO, conserva además su CategorySection original completo.
  Los vídeos no entran en el slideshow; la galería superior tampoco se modifica.
- En carga parcial, primero aparecen las secciones editoriales en su orden fijo,
  luego los CategorySection fallback originales antes de la reserva. El mapa
  sigue accesible al final aunque destino sea editorial.
- En B2b original, casas sin contenido tenían HTML SSR idéntico al previo.
  B2b-2 permite el traslado del mapa y el control compartir en encabezado;
  los demás módulos conservan su comportamiento.
  No se añade botón fijo a esas casas. En B2b-2 se permite la excepción del mapa
  movido y compartir en encabezado; no se exige igualdad del HTML completo.

## Scroll, slideshow y accesibilidad

Contenedor de N × 100svh y escenario position:sticky de 100svh. El último cuarto
de cada tramo hace aparecer suavemente el siguiente panel encima del anterior;
opacity sigue la posición mediante scroll pasivo + requestAnimationFrame.
No hay desplazamiento artificial ni captura del scroll vertical. ResizeObserver
y resize recalculan el progreso, y los listeners/RAF se liberan al desmontar.

Cada sección tiene dos cuadros glass fijos: fotos izquierda y descripción derecha.
Hasta 1023px se apilan, fotos arriba. El hero permanece de fondo; el cuadro de fotos
muestra hasta dos PHOTO y, si hay más de dos, rota manualmente con entrada de 250ms, flechas de
44px, indicadores de 44px, contador localizado y flechas de teclado cuando la
región está enfocada (o un control tiene foco). Swipe horizontal >50px cambia
foto; los gestos predominantemente verticales siguen desplazando la página.
No hay autoplay. Los indicadores se envuelven con scroll vertical limitado si
son muchos; no se crea scroll horizontal.

Paneles inactivos: inert y aria-hidden; solo el activo permite foco/interacción.
La narrativa ocupa el cuadro derecho con glass-panel y colores del tema.
Texto largo tiene altura máxima 48svh (27svh en móvil/tablet), desplazamiento
vertical enfocable y cuadros apilados antes de lg.

prefers-reduced-motion: reduce desactiva el crossfade scroll (cambio directo de
panel) y la animación de entrada de fotos. No cambia las animaciones existentes de
otros componentes ni el scroll suave global que ya tenía la app.

RESERVAR fijo apunta a #reservar, hidden lg:flex (desde 1024px). Solo se añade si
hay presentación editorial; visible durante el recorrido, incluso en el módulo
final. ReservationDatesProvider, AvailabilityCalendar, MessageForm y section#reservar
conservan código/props originales. Navbar/Footer/idioma/tema no cambian.

## Archivos

| Archivo | Cambio |
| --- | --- |
| apps/web/src/app/[locale]/casas/[slug]/page.tsx | Lectura servidor, montaje condicional, fallback por sección y CTA desktop |
| apps/web/src/lib/editorial-presentation.ts | Selección por locale, PHOTO, orden, progreso y dirección de swipe |
| apps/web/src/components/EditorialPresentation.tsx | Escenario sticky, fade por scroll y slideshow accesible |
| apps/web/src/components/EditorialPresentation.module.css | Fullscreen, overlays, controles y reduced-motion, aislados al componente |
| apps/web/messages/es.json | Labels localizados de región/descripción |
| apps/web/messages/en.json | Labels localizados de región/descripción |
| apps/web/messages/fr.json | Labels localizados de región/descripción |
| scripts/test-property-access.cjs | Harness permite CSS Modules y fuente virtual para comparar SSR anterior |
| scripts/test-editorial-presentation.cjs | Datos, swipe/progreso, SSR de vacíos y conservación de módulos |
| scripts/qa-editorial.cjs | Fixture interactiva local con componente real, imágenes/datos simulados |
| docs/CONTEXTO.md | Estado B2b y decisiones |
| docs/FASE-B2B-PRESENTACION.md | Inventario, QA y límites |

## Verificación realizada

- TypeScript pasa. ESLint: cero errores; dos warnings preexistentes en page.tsx
  por labels/categoryData sin usar, conservados fuera de alcance.
- node scripts/test-editorial-presentation.cjs: idioma sin fallback, orden,
  hero propio primero, exclusión VIDEO/ajenas, ausencia y todo-null con SSR igual
  al HEAD de partida, cuatro paneles, reserva/mapa/lightbox y vídeos conservados.
- test-gallery-share, test-inquiry y test-property-sections pasan sin red/Neon.
- Navegador en fixture local: anchos 360/375/768/1440, sin overflow horizontal;
  CTA none/none/none/flex; escenario de altura viewport; controles/indicadores,
  teclado, cambio de sección y ancla de reserva funcionando; claro/oscuro revisados.
- La fixture ?reduced=1 fuerza el estado reducido para el componente y quita
  transiciones en su CSS de prueba. No equivale a cambiar la preferencia real del
  sistema: el algoritmo reducido y la regla CSS nativa se comprueban además en código.
- Swipe: algoritmo probado; gesto táctil en dispositivo real pendiente del checklist.
- No se cargó contenido real por editor ni SQL: restricción de no tocar Neon.
  No se afirma haber realizado reserva real o publicación/despliegue.

## Cómo probar sin BD

```powershell
node scripts/test-editorial-presentation.cjs
node scripts/test-gallery-share.cjs
node scripts/test-inquiry.cjs
node scripts/test-property-sections.cjs
node scripts/qa-editorial.cjs
```

Fixture: http://127.0.0.1:3099, ?dark=1 y ?reduced=1. Usa esbuild ya instalado por
tsx, sin instalar nada; Next/Image e i18n se simulan para evitar Next/BD, y las
imágenes son SVG locales generadas por la fixture. Requiere CSS compilado local
existente en .next/dev/static/chunks, sin modificarlo. El módulo de reserva de la
fixture es un marcador: su funcionamiento real se cubre con pruebas y checklist.
El test SSR compara HEAD con el working tree: la primera ejecución se realizó
contra la versión previa; tras commit, HEAD será la nueva versión.

## Checklist manual con contenido de QA en Respaldo

Estas operaciones las hace el responsable del entorno; no se ejecutaron aquí.

1. Configurar entorno de QA para Respaldo, pnpm dev. B2a: propiedad de prueba con
   cuatro secciones, narrativa es/en/fr y PHOTO propias. Elegir hero también
   perteneciente a su categoría para verificar que no se repite en el slideshow.
2. Abrir detalle publicado; comprobar orden, foto hero primero, categorías y
   narrativa correcta en /es, /en, /fr. Borrar solo narrativa en un idioma para
   comprobar omisión si no hay hero, y bloque sin texto si sí hay hero.
3. Probar scroll lento/rápido y hacia atrás: fundido, no pantalla vacía. Flechas,
   indicadores, Tab y ←/→; swipe horizontal en simulador touch/dispositivo real.
4. 360/375/768/1440px: no scroll horizontal, texto largo legible, controles accesibles;
   botón fijo ausente en móvil/tablet y visible en desktop. Probar ambos temas.
5. DevTools Rendering → Emulate CSS prefers-reduced-motion: reduce: desaparecen
   fades, controles siguen funcionando. Volver a no-preference y verificar fades.
6. Propiedad sin filas; propiedad con todo-null; y propiedad con solo dos secciones:
   comprobar aspecto previo, fallbacks correctos y reserva. Videos previos siguen
   en galería/sliders; no aparecen en presentación nueva.
7. Abrir mosaico/lightbox, teclado/Escape/X; compartir/copia; mapa sigue accesible.
8. Seleccionar fechas calendario → formulario; editar fechas formulario → calendario;
   cotización, ocupación, validación inline y envío válido de consulta en QA. Probar
   tanto propiedad editorial como propiedad sin contenido. No probar escrituras en main.

## Supuestos y notas

- CTA solo en propiedades editoriales para cumplir cero regresión sin contenido.
- Hero inválido nunca incorpora Media ajena ni VIDEO; solo descripción puede generar
  una diapositiva sin imagen. No se inventan descripciones/traducciones.
- Mantener sliders de categorías con vídeo puede duplicar fotos ya presentes en la
  presentación: decisión conservadora para no cambiar el tratamiento de vídeos.
- Se conservan arrays fijos únicamente como fallback/slider existente; el problema
  de servicios no modelados y categoryData/labels muertos queda documentado en Fase A.
- No hay nueva implementación de lightbox: se conserva PropertyGallery original.


## Ajuste B2b-2 — mapa/advertencias y migración propuesta

La imagen de fondo conserva la hero (o primera PHOTO disponible); el índice del
mini-slideshow solo cambia las fotos del cuadro. Uno/dos elementos se muestran
estáticos; más de dos tienen flechas/indicadores/teclado/swipe. No hay autoplay.
El máximo de dos corresponde al cuadro; la hero de fondo sigue visible detrás.
Se reutiliza glass-panel y sus colores de tema, no un nuevo sistema de glass.

advertencias es la quinta sección del editor/API/schema, pero no una quinta
pantalla sticky. Se consulta con las filas ya cargadas en servidor, sin fetch extra.
Su narrativa usa el idioma activo sin fallback, y su hero opcional solo PHOTO.
El bloque final se monta si hay ambas coordenadas o descripción activa/hero definido.
LocationMap se monta una sola vez, a la izquierda, intacto; a la derecha el cuadro
glass de advertencias si hay contenido. Sin mapa, pueden aparecer solo advertencias;
sin advertencias aparece solo mapa. No se inventan advertencias ni tarjeta vacía.

El botón compartir estaba dentro de LocationMap, no en el encabezado. Se añade
la misma PropertyShareButton al encabezado para cumplir acceso arriba, conservando
la que ya trae LocationMap. Se duplica el control de compartir, **no el mapa**.
La galería/lightbox, CTA desktop y bloque de reserva no se modifican.

### SQL para Emma — NO ejecutado

Archivo: scripts/sql/property-section-advertencias.sql. Aplicar manualmente en
Respaldo antes de probar guardar advertencias; después main bajo el procedimiento
vigente. No se despliega ni se realizan operaciones de BD aquí.

```sql
BEGIN;
ALTER TABLE "PropertySection" DROP CONSTRAINT "PropertySection_section_check";
ALTER TABLE "PropertySection"
  ADD CONSTRAINT "PropertySection_section_check"
  CHECK ("section" IN ('destino', 'amenidades', 'habitaciones', 'lugar', 'advertencias'));
COMMIT;
```

El constraint debe existir con el nombre de B1. No usa IF EXISTS, siguiendo el
patrón. No cambia filas, categorías Media, PK ni FKs. Si falla antes de COMMIT,
ROLLBACK revierte ambos ALTER. Restaurar el CHECK de cuatro códigos después de
haber guardado advertencias exige retirar/reclasificar antes esas filas con
respaldo y autorización; no se propone borrado automático.

### Archivos del ajuste

- EditorialPresentation.tsx y su module.css: cuadros glass fijos, máximo dos fotos,
  fondo hero independiente y responsive/reduced-motion.
- casas/[slug]/page.tsx: compartir en encabezado, mapa movido y advertencias final.
- packages/db/src/schema.ts: quinto código en CHECK.
- lib/property-sections.ts y panel/PropertySectionsEditor.tsx: validación y editor
  de advertencias usando la misma API existente.
- scripts/sql/property-section-advertencias.sql: ALTER transaccional propuesto.
- messages/es,en,fr.json: títulos advertencias y región mapa/advertencias.
- test-editorial-presentation.cjs y test-property-sections.cjs: mapa único, ausencia
  sin coordenadas/contenido, advertencias por locale y guardado protegido del quinto código.
- qa-editorial.cjs: movimiento reducido simulado adaptado a la animación de fotos.
- CONTEXTO.md y este informe: decisiones y pasos de prueba actualizados.

### Cómo probar el ajuste

1. Emma aplica manualmente el SQL en Respaldo. pnpm dev, editor B2a: guardar
   advertencias de propiedad de prueba en es/en/fr, con/sin hero PHOTO.
2. Detalle: dos cuadros por pantalla en 1440px, fotos izquierda/narrativa derecha.
   Con 1/2 fotos: estáticas; con 3+: navegar, comprobar máximo dos, fondo hero fijo.
3. 360/375/768px: fotos arriba, texto abajo, sin scroll lateral; texto largo y
   controles accesibles. Probar teclado/swipe, ambos temas y movimiento reducido.
4. Fin de presentación: mapa único y advertencias antes de #reservar. Compartir
   sigue arriba y en la card original. Verificar mapa solo, advertencias solo,
   ambos y ausencia de ambos. Casa sin contenido conserva módulos previos salvo
   el traslado del mapa y el control compartir de encabezado.
5. Reserva calendario↔formulario y galería/lightbox/CTA sin cambios. Colaborador
   ajeno sigue 404 en GET/PUT; advertencias usa las mismas validaciones PHOTO.

Supuestos: rotación manual sin autoplay; cuadro de advertencias solo con contenido
activo o hero, sin mensajes de seguridad inventados; mini-slideshow no abre un
lightbox nuevo. No cambia la galería superior.

Verificación B2b-2: TypeScript y tests editorial, secciones, panel-render, gallery-share e inquiry pasan. ESLint sin errores, dos warnings previos. QA local a 360/375/768/1440 sin overflow lateral, apilado/lados fijos correctos, claro/oscuro y controles/teclado verificados con datos simulados. No se probó escritura real de advertencias ni se ejecutó ALTER.


## Ajuste B2b-3 — selección de fotos y autoplay (06 Oct 2026)

Implementado en código; migración PENDIENTE de aplicación manual por Emma. No se ejecutó SQL ni se accedió a Neon.

- En casas con presentación se retira el cuadro introductorio EL DESTINO/dirección. La dirección completa pasa al encabezado junto al título. En casas sin contenido editorial se conserva el cuadro y su encabezado anterior para evitar regresión.
- PropertySection.photoMediaIds es jsonb nullable tipado string[]: hasta dos ids propios PHOTO, sin duplicados, en orden de selección. No había columnas array/json previas; jsonb permite persistir directamente el array del API. CHECK limita tipo array y longitud; pertenencia/tipo/duplicados se validan en servidor y se revalidan dentro del UPSERT.
- GET existente devuelve la columna; PUT admite photoMediaIds null/[] o array. Omitirla conserva compatibilidad de payload antiguos y guarda NULL. Error 400 INVALID_SECTION_PHOTOS para selección inválida. Ownership 401/403/404 permanece intacto.
- Editor: checkboxes con miniaturas y posición seleccionada (1/2); impide una tercera selección. Desmarcar y volver a marcar cambia el orden. Botón Usar fotos de la categoría limpia incluso referencias a imágenes retiradas. Hero sigue independiente.
- Cuadro muestra una foto a la vez; con dos alterna cada 5000 ms mediante crossfade de 400 ms, con flechas/indicadores/swipe/teclado. Con una no hay controles/autoplay. Hero de fondo conserva fundido de scroll y no rota.
- Sin selección: las dos primeras PHOTO de la categoría por order/id, sin añadir hero de otra categoría. Selección explícita respeta orden y excluye imágenes inexistentes/ajenas/VIDEO en lectura. Categoría destino sigue principal; no se renombra Media.
- Hover, foco y toque pausan; se espera 5 s tras terminar la interacción antes de reactivar el temporizador (primer cambio aproximadamente 10 s después). Mientras el foco permanezca dentro, no reanuda. Reduced-motion desactiva autoplay y transición; manual permanece.
- Mapa/advertencias, reserva/calendario, lightbox y CTA conservados. Advertencias admite el nuevo campo en su editor/API común, pero su render público actual no lo consume.

### SQL final para Emma

Archivo: scripts/sql/property-section-photos.sql. Convención no idempotente: ejecutar una vez, dentro de transacción, después del CHECK de advertencias de B2b-2.

```sql
BEGIN;
ALTER TABLE "PropertySection" ADD COLUMN "photoMediaIds" jsonb;
ALTER TABLE "PropertySection" ADD CONSTRAINT "PropertySection_photos_check"
  CHECK ("photoMediaIds" IS NULL OR
    CASE WHEN jsonb_typeof("photoMediaIds") = 'array'
      THEN jsonb_array_length("photoMediaIds") <= 2 ELSE false END);
COMMIT;
```

Emma: aplicar primero en Respaldo, verificar con el editor y SELECT propertyId/section/photoMediaIds. Antes de desplegar, restore point y mismo SQL en main con autorización. Los datos existentes quedan NULL. El código nuevo requiere la columna: no desplegar antes de migrar. Si falla dentro de la transacción, ROLLBACK; si se requiere retirar el cambio después de COMMIT, coordinar primero reversión de app y ejecutar manualmente ALTER TABLE "PropertySection" DROP COLUMN "photoMediaIds" (elimina selecciones nuevas y su CHECK; no ejecutado aquí).

### Pruebas

Desde raíz: pnpm dev; node scripts/test-property-sections.cjs; node scripts/test-editorial-presentation.cjs. TypeScript: desde apps/web, node node_modules/typescript/bin/tsc --noEmit --incremental false.

1. Tras ALTER en Respaldo, entrar como dueño al panel, elegir dos PHOTO en orden inverso a su order, guardar y recargar. Revisar SELECT "propertyId", "section", "photoMediaIds" FROM "PropertySection" WHERE "propertyId" = 'ID_REAL'; debe conservar el orden. Intentar tercera, duplicada, VIDEO o ajena por API: 400 INVALID_SECTION_PHOTOS; colaborador ajeno: 404.
2. Detalle es/en/fr: hero independiente, primera selección visible, segunda a los 5 s; flechas, indicadores y swipe. Una foto: sin controles; vaciar selección: solo primeras dos de categoría, incluso con 28 imágenes.
3. Hover/foco/toque pausan; salir del cuadro y esperar unos 10 s verifica reanudación. Emular prefers-reduced-motion: sin autoplay ni fade, manual funciona.
4. Casa sin contenido: cuadro anterior y flujo conservados. Casa editorial: sin intro duplicada y título/dirección visibles en hero superior. Revisar reserva bidireccional, envío, galería/lightbox, mapa/advertencias y CTA.
5. Revisar 360/375/768/1440 px y temas claro/oscuro, sin scroll lateral.

QA realizada sin BD: TypeScript; tests reales API/SQL en SQLite en memoria y SSR es/en/fr. Fixture del componente real/CSS verificó alternancia a 5 s, pausa por foco, reanudación, reduced-motion simulado/manual y anchos sin overflow. No valida PostgreSQL real, guardado en Neon ni swipe en dispositivo físico. ESLint: cero errores, solo labels/categoryData preexistentes.

### Archivos del ajuste

- packages/db/src/schema.ts: columna jsonb nullable y CHECK de máximo dos.
- scripts/sql/property-section-photos.sql: ALTER transaccional para revisión/aplicación manual.
- apps/web/src/lib/property-sections.ts: validación de ids, PHOTO propia y UPSERT con selección.
- apps/web/src/lib/editorial-presentation.ts: hero separado y selección/fallback acotado a dos.
- apps/web/src/components/panel/PropertySectionsEditor.tsx: selección ordenada con miniaturas y limpieza.
- apps/web/src/components/EditorialPresentation.tsx y .module.css: autoplay, pausas y crossfade accesible.
- apps/web/src/app/[locale]/casas/[slug]/page.tsx: intro condicional y dirección en encabezado editorial.
- apps/web/messages/es.json, en.json, fr.json: etiquetas e instrucciones del editor.
- scripts/test-property-sections.cjs, test-editorial-presentation.cjs, qa-editorial.cjs: cobertura de ids/orden/fallback y fixture de dos fotos.
- docs/FASE-B2B-PRESENTACION.md y CONTEXTO.md: implementación, SQL y QA pendiente/manual.

Supuestos: intro se elimina solo en casas editoriales para cumplir cero regresión en casas vacías; las dos fotos rotan mostrando una a la vez; hero y selección son independientes. Nota: jsonb no tiene FK por elemento, por lo que quitar Media puede dejar ids guardados; la lectura omite referencias retiradas y el editor permite limpiar la selección. Sin nuevos cambios al borrado de Media.


## Calendario de ocupación para colaboradores — 07 Oct 2026

Implementado en código; BlockDate PENDIENTE de migración manual por Emma. No se ejecutaron migraciones ni operaciones Neon. Login/property-access permanecen intactos.

### Rutas y permisos

| Entrada | ADMIN | COLLABORATOR | CLIENT/VIEWER |
| --- | --- | --- | --- |
| /[locale]/panel/calendario | Todas las propiedades y sync | Solo ownerId propio, sin sync | Redirección a home en servidor |
| /[locale]/admin/calendario | Todas las propiedades y sync | 403 en servidor, conserva gate anterior | 403 |
| POST /api/properties/[id]/calendar-blocks | Cualquier propiedad | Solo propia, ajena 404 | 403 (anónimo 401) |

Se reutilizan requireAdmin/requirePropertyManager, panelManager, managedProperty y filtros managedProperties/managedResource. Ownership también se comprueba en INSERT SELECT; createdBy viene de sesión, nunca del cuerpo. Fechas ISO reales, fin posterior, sin cruces con Booking/BlockDate. Cuerpo inválido 400, recurso ajeno 404. Si hay ocupación nueva desde la selección, no se escribe y responde 404 siguiendo el patrón conservador del editor actual; UI informa que revise disponibilidad.

Calendario conserva leyenda Manual/Airbnb/Google en ambos roles. Cada propiedad es una sección vertical de siete columnas en móvil y desktop. Selección por clic en inicio y fin (también teclado con botones), resaltado de extremos, confirmación Guardar bloqueo. El guardado ocupa [startDate,endDate): el día final queda libre, igual que Booking. Fechas anteriores al inicio reinician; rango completo seguido de clic inicia uno nuevo. Meses/días/textos localizados es/en/fr.

Tooltip/title y aria-label: reservas con guestUserId muestran nombre de User; sin nombre registrado se indica ese límite. BlockDate creada por la sesión muestra Bloqueado por ti; de otro actor muestra Bloqueo manual. Booking host-block histórica no tiene createdBy y usa etiqueta neutral, sin inventar autor. Feeds externos no contienen nombre de huésped en el modelo actual.

### Migración propuesta (no ejecutada)

Convención existente: script transaccional, no idempotente; ejecutar una vez. Archivo scripts/sql/block-date.sql:

```sql
-- Emma: ejecutar manualmente en Respaldo y luego main antes de desplegar.
-- No modifica ni mueve los bloqueos históricos Booking.source = host-block.
BEGIN;
CREATE TABLE "BlockDate" (
  "id" text PRIMARY KEY,
  "propertyId" text NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "startDate" date NOT NULL,
  "endDate" date NOT NULL,
  "createdBy" text NOT NULL REFERENCES "User"("id") ON DELETE NO ACTION,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "BlockDate_range_check" CHECK ("endDate" > "startDate")
);
CREATE INDEX "BlockDate_property_dates_idx" ON "BlockDate" ("propertyId", "startDate", "endDate");
COMMIT;
```

Emma: confirmar destino Respaldo, aplicar manualmente y probar. Antes de desplegar, restore point y aplicación en main autorizada; después deploy solo con orden expresa. El código requiere BlockDate: no desplegar antes del SQL. No se mueven ni eliminan Booking históricas. Si falla antes de COMMIT: ROLLBACK. Para revertir después, revertir primero la app y revisar/resguardar nuevos bloqueos; DROP TABLE "BlockDate" manual elimina todos los bloqueos nuevos, por lo que requiere aprobación. No ejecutado aquí.

### Integración con disponibilidad

Nuevos bloqueos se guardan solo en BlockDate, sin duplicar Booking. Se combinan en lectura con reservas para el detalle público y el editor individual. POST /api/messages valida ambas fuentes en lectura y de nuevo en INSERT. /api/bookings/create impide reservas directas sobre BlockDate. Los bloqueos host-block del editor existente conservan almacenamiento/edición/borrado actuales y comprueban también BlockDate para evitar cruces. No se cambia la selección/validación del calendario público ni la lógica de precios.

### Archivos de este ajuste

- packages/db/src/schema.ts: tabla blockDates con autor, fechas, FK y CHECK.
- scripts/sql/block-date.sql: SQL propuesto para Emma, sin modificación de datos existentes.
- apps/web/src/lib/occupation-calendar.ts: lectura consolidada con ownership/nombre de huésped y creación protegida de bloques.
- apps/web/src/app/[locale]/panel/calendario/page.tsx: página accesible a managers y datos filtrados.
- apps/web/src/app/[locale]/admin/calendario/page.tsx: conserva requireAdmin y reutiliza carga completa.
- apps/web/src/app/[locale]/panel/layout.tsx: enlace Calendario para colaborador; enlaces admin anteriores conservados.
- apps/web/src/components/CalendarBoard.tsx: selección/guardado, sync por rol, tooltips, stack móvil e i18n.
- apps/web/src/app/api/properties/[id]/calendar-blocks/route.ts: POST con autorización, validación y revalidación de vistas.
- apps/web/src/app/[locale]/casas/[slug]/page.tsx: incorpora BlockDate a rangos ocupados enviados a los componentes existentes.
- apps/web/src/app/api/messages/route.ts: rechaza consultas que cruzan BlockDate antes de guardar.
- apps/web/src/app/api/bookings/create/route.ts: impide reserva directa sobre BlockDate.
- apps/web/src/lib/panel-resources.ts: incorpora nuevos bloqueos a la ocupación del editor individual.
- apps/web/src/lib/panel-mutations.ts: bloqueos históricos respetan los nuevos rangos ocupados.
- apps/web/messages/es.json, en.json, fr.json: namespace occupationCalendar completo.
- scripts/test-property-access.cjs: fixture SQLite para nueva tabla.
- scripts/test-occupation-calendar.cjs: permisos, filtros de propiedades/reservas, autor, validación, solapes, SSR roles/idiomas y bloqueo de consulta/reserva.
- scripts/qa-occupation-calendar.cjs: fixture interactivo sin BD para layout/selección, no guarda datos reales.
- docs/FASE-B2B-PRESENTACION.md y CONTEXTO.md: SQL, alcance, pruebas y límites.

### Cómo probar

Tras aplicar SQL en Respaldo: pnpm dev. Tests offline: node scripts/test-occupation-calendar.cjs; node scripts/test-panel.cjs; node scripts/test-panel-render.cjs; node scripts/test-inquiry.cjs; node scripts/test-editorial-presentation.cjs; node scripts/test-property-access.cjs.

1. COLLABORATOR: /es/panel → Calendario. Solo sus propiedades, leyenda completa, sin botón sync. Repetir /en y /fr.
2. Clic inicio libre y final posterior, Guardar bloqueo. Recargar; SELECT "propertyId", "startDate", "endDate", "createdBy", "createdAt" FROM "BlockDate" ORDER BY "createdAt" DESC LIMIT 10; autor correcto, tooltip Bloqueado por ti.
3. Rango que cruza reserva/bloqueo: rechazo. POST directo a propiedad ajena con el mismo payload: 404, ninguna fila nueva. Body con createdBy/ownerId: 400.
4. CLIENT/VIEWER: no panel/calendario; URL directa redirige y API da 403. ADMIN: ambas rutas muestran todas y botón sincronizar. No ejecutar sync en producción para esta QA.
5. Abrir detalle público: fechas bloqueadas no seleccionables; POST consulta y reserva directa sobre el bloque se rechazan. La salida del bloqueo queda libre bajo convención [inicio,fin).
6. Verificar tooltip de huésped registrado, datos sin huésped y bloques propios/ajenos. Probar 360/375/768/1440 px, teclado y ambos temas.

Verificación realizada: TypeScript y ESLint focalizados sin errores; tests anteriores pasando sin red/Neon. Fixture real de CalendarBoard con CSS local verificó rango y rechazo de cruce, leyenda, botón admin y 360/375/768/1440 sin overflow. No se ha validado PostgreSQL real ni el guardado desde navegador contra Respaldo. El fixture simula sesiones/datos; prueba de permisos se hace con handlers y SQL reales en memoria.

Supuestos: fin exclusivo; selección por dos clics satisface el alcance (sin arrastre); no se trasladan bloqueos históricos. Notas: edición/borrado de BlockDate nuevos no forma parte del alcance y no se añade; el editor individual los muestra como ocupación sin controles de edición. No se corrige la duplicación de sync iCal ni el solape entre Booking reales preexistente. Las comprobaciones INSERT no son una garantía serializable frente a escrituras simultáneas de sistemas externos; no se añadieron exclusiones ni cambios al importador iCal.
