# Fase A — Inventario de contenido para presentación scroll

Fecha: 06 de octubre de 2026. Estado: diagnóstico completado; implementación no iniciada.

Solo lectura de código y escritura de documentación. No se consultó ninguna BD,
no se modificó código de la app ni del esquema y no se ejecutaron migraciones.
Los veredictos evalúan lo que permite representar el modelo para una sección
con imagen protagonista y descripción propias; no confirman contenido cargado
en producción. Un campo NOT NULL puede contener texto vacío y una categoría
admitida puede no tener imágenes en una propiedad concreta.

## 1. Modelo actual y veredictos

Fuente principal: `packages/db/src/schema.ts:17` (Property) y `:40` (Media).
El paquete no define entidades Destination, Amenity, Room ni servicios por propiedad.
Booking, IcalFeed, SeasonRate y Message representan disponibilidad, tarifas y
consultas; no contienen el contenido editorial de estas cuatro secciones.

| Sección requerida | Información real representable | Lo que falta | Veredicto |
| --- | --- | --- | --- |
| EL DESTINO | Property.address, city; lat/lng opcionales. Property.descEs/descEn/descFr es descripción general de la casa, no del destino. Media con category=principal permite fotos generales, sin asignación específica destino. | Descripción editorial del destino por idioma y selección explícita de su foto protagonista. No existe destinationDescription ni equivalente. | **DATO PARCIAL** |
| AMENIDADES | Media.category=amenidades permite agrupar fotos. El texto general descEs/En/Fr podría mencionar servicios, pero no tiene semántica ni estructura de amenidades. | Amenidades reales por propiedad, descripción propia es/en/fr y foto protagonista elegida. No hay lista persistida, booleanos ni relación PropertyAmenity. | **DATO PARCIAL** (imágenes categorizables; inventario real de amenidades **DATO INEXISTENTE**) |
| HABITACIONES | Property.bedrooms: cantidad de habitaciones; bathrooms: cantidad de baños, admite fracciones; maxGuests: capacidad. Media.category=habitaciones permite fotos del conjunto. | Descripción de la sección y foto protagonista. No hay entidad Room, tipos/cantidades de camas, nombres/descripciones por habitación ni vínculo foto→habitación individual. | **DATO PARCIAL** |
| EN EL LUGAR | Media.category=lugar permite fotos. Property.address/city y descEs/En/Fr siguen siendo ubicación y descripción generales. | Descripción específica de instalaciones/servicios es/en/fr, equipamiento real por propiedad y foto protagonista elegida. No existe placeOffers ni equivalente en BD. | **DATO PARCIAL** (imágenes categorizables; inventario real de servicios **DATO INEXISTENTE**) |

**Ninguna sección tiene DATO COMPLETO** para la presentación solicitada.
La imagen y el texto general de una casa no deben atribuirse automáticamente
a todas las secciones ni interpretarse como confirmación de sus servicios.

### Qué se muestra hoy y de dónde procede

- `casas/[slug]/page.tsx:56`: el locale selecciona titleEs/En/Fr y descEs/En/Fr.
  La descripción se muestra una sola vez, fuera de las secciones categóricas.
- `page.tsx:145`: EL DESTINO muestra address/city y LocationMap si existen lat/lng;
  no presenta una narrativa del destino ni una fotografía propia.
- `page.tsx:163`: “Lo que ofrece este lugar” enumera vistas al mar, acceso a playa,
  wifi, estacionamiento, cocina y televisión mediante un array fijo de claves i18n.
- `page.tsx:185`: AMENIDADES usa fotos category=amenidades y un array fijo de wifi,
  cocina, aire, piscina y estacionamiento.
- `page.tsx:198`: HABITACIONES usa fotos category=habitaciones y textos fijos de
  ropa de cama/baños. No son descripciones de habitaciones individuales.
- `page.tsx:80`: categoryData incluye amenities, roomSlides y placeOffers; estos
  últimos contienen terraza, ascensor, seguridad y limpieza como array fijo.
  **categoryData y labels no se consumen en el JSX actual. CategoryGrid no está
  importado ni montado por esta página.** No confundir esa preparación con datos
  persistidos ni con una sección EN EL LUGAR visible.
- `CategorySection.tsx`: si no recibe imágenes, devuelve null y oculta también
  sus textos. Esto afecta a amenidades/habitaciones cuando falta esa categoría.

⚠️ Las listas traducidas son constantes globales de presentación: el modelo no
permite afirmar que cada propiedad dispone de piscina, playa, ascensor, etc.
⚠️ Actualmente el detalle no renderiza una sección independiente EN EL LUGAR,
aunque Media admite la categoría lugar y el diccionario tiene details.enLugar.
Se documenta; no se corrige en esta fase.

## 2. Gestión y asociación de imágenes

Tabla `Media`: id, propertyId (FK a Property), url, type (PHOTO/VIDEO), order
y category (varchar(50), NOT NULL, default principal).

- Las imágenes no son solo una galería global: tienen categoría por fila.
- Categorías aceptadas por el panel/API: principal, habitaciones, amenidades,
  lugar. Validación en `lib/panel-validation.ts:71`; selector en
  `components/panel/ResourceEditor.tsx:45`.
- La BD usa varchar, sin enum/CHECK de categorías: SQL directo podría guardar
  otros valores. Los consumidores filtran por coincidencia exacta.
- Cada Media tiene una categoría, no varias. No hay tabla de relación a secciones,
  roomId, caption/alt editorial ni indicador isHero/cover.
- El detalle consulta todas las Media de la propiedad, ordena por order y luego
  filtra categorías (`page.tsx:31`, `:64`). No hay desempate explícito por id si
  varias filas comparten order.
- El mosaico principal recibe principal; si esa categoría está vacía, recibe
  **toda** la Media de la propiedad (`page.tsx:68`). Las fotos pueden aparecer
  además en las secciones correspondientes.
- El panel permite añadir/editar URLs HTTPS o rutas locales existentes, categoría
  y orden. No sube archivos. Crea PHOTO y limita la edición a PHOTO; el modelo y
  las galerías también soportan videos existentes.
- No existe una categoría destino en el selector actual. principal es una galería,
  no una equivalencia editorial confirmada de EL DESTINO.

Para una versión sin migración podría elegirse convencionalmente la primera
PHOTO por categoría y redactar contenido en código; **no se recomienda** porque
no resolvería descripciones independientes ni edición por propiedad. No se tomó
esa decisión ni se implementó fallback editorial alguno.

## 3. Borrador de migración — propuesta, NO ejecutar

La presentación necesita contenido editorial por sección, no necesariamente
un catálogo completo de amenidades o habitaciones. Propuesta mínima: una tabla
PropertySection con cuatro códigos, descripción es/en/fr y una Media protagonista
opcional. Conserva Property.desc* y las categorías actuales sin reasignarlas.
Los títulos de secciones fijas pueden seguir en los diccionarios existentes.

```sql
-- BORRADOR para revisión de modelo y aprobación futura. NO aplicado.
BEGIN;

-- Permite FK compuesta: la imagen protagonista debe ser de la misma propiedad.
ALTER TABLE "Media"
  ADD CONSTRAINT "Media_id_propertyId_unique" UNIQUE ("id", "propertyId");

CREATE TABLE "PropertySection" (
  "propertyId" text NOT NULL,
  "section" varchar(20) NOT NULL
    CHECK ("section" IN ('destino', 'amenidades', 'habitaciones', 'lugar')),
  "descriptionEs" text,
  "descriptionEn" text,
  "descriptionFr" text,
  "heroMediaId" text,
  PRIMARY KEY ("propertyId", "section"),
  CONSTRAINT "PropertySection_property_fk"
    FOREIGN KEY ("propertyId") REFERENCES "Property" ("id")
    ON DELETE CASCADE,
  CONSTRAINT "PropertySection_hero_property_fk"
    FOREIGN KEY ("heroMediaId", "propertyId")
    REFERENCES "Media" ("id", "propertyId")
    ON DELETE NO ACTION
);

COMMIT;
```

### Criterios y límites del borrador

- Cero backfill automático: no copia desc* cuatro veces, no inventa servicios,
  no cambia usuarios, dueños, tarifas, reservas ni categorías existentes.
- Máximo una fila por propiedad/sección. Los campos permiten NULL durante la
  carga editorial; la futura publicación debe validar descripción traducida
  e imagen para cada sección requerida. La tabla por sí sola no exige cuatro filas.
- El hero debe pertenecer a la misma propiedad; puede tener una categoría diferente
  sin modificar la galería existente. La futura validación debe exigir PHOTO si
  “imagen protagonista” excluye videos: esa restricción no está implementada aquí.
- NO ACTION impide borrar una Media referenciada mientras conserve el vínculo.
  El futuro editor deberá quitar/cambiar heroMediaId antes de eliminar esa imagen.
  La eliminación de Property conserva el cascade del modelo existente.
- La PK ya sirve de índice por propertyId; no se propone un índice redundante.
- Auditar compatibilidad y ensayar el DDL en un entorno autorizado antes de aplicarlo.
  No se validó contra PostgreSQL ni contra datos vivos en esta fase.
- Si el cliente pide filtros de amenidades o ficha por habitación, este modelo
  editorial no basta: harán falta entidades PropertyAmenity/Room y relación
  RoomMedia, con decisión de negocio previa. No se proponen esas migraciones
  adicionales porque la presentación de cuatro secciones no las exige.
- Mostrar/editar estas filas requerirá trabajo futuro de schema Drizzle, APIs,
  validación de ownerId, panel y contenido es/en/fr; no forma parte de Fase A.

## 4. Componentes reutilizables y límites

| Componente/función actual | Reutilización prevista |
| --- | --- |
| ReservationDatesProvider | **Tal cual**, envolviendo calendario y formulario juntos; mantiene sincronía bidireccional. |
| AvailabilityCalendar | **Tal cual**, con Booking y restricciones actuales; no usar la animación para alterar selección. |
| MessageForm | **Tal cual**, con propertyId, locale, pricing, maxGuests y compact; conserva validación/API. |
| lib/pricing y lib/reservationDates; validación de consultas | **Tal cual** como lógica existente del módulo de reserva. No inventar cálculo de precio. |
| PropertyGallery | **Tal cual** como mosaico con lightbox integrado, si se conserva una galería. Lightbox no está exportado como componente independiente: abrirlo desde una imagen externa requeriría integración futura. |
| LocationMap y PropertyShareButton | **Tal cual** para mapa/compartir, con las mismas coordenadas, dirección y título localizado. |
| SectionSlider | **Tal cual** si alguna galería secundaria sigue usando slider. No es una imagen protagonista fija ni implementación scroll-driven. |
| CategorySection | **No tal cual para la presentación nueva**: renderiza dos columnas y slider, lista de items y se oculta sin fotos. El tratamiento scroll y descripción editorial requieren otro montaje futuro. |
| CategoryGrid | No se monta en el detalle actual; no es parte de la reutilización necesaria. |
| Navbar, Footer, LocaleSwitcher, ThemeToggle y loading existente | **Tal cual**; la presentación no requiere modificar autenticación, i18n global ni carga. |

El módulo de reserva **ya está al final** en `section#reservar` (`page.tsx:209`).
La futura CTA persistente puede apuntar a ese ancla sin modificar el formulario.
Actualmente no hay un botón RESERVAR persistente en esta página; requerirá trabajo
de interfaz en una fase posterior. No hay mecanismo scroll-driven implementado
en estos componentes ni un modelo de datos que por sí mismo lo proporcione.

## 5. Decisiones pendientes y supuestos

1. “Descripción” se interpreta como narrativa propia de cada sección y propiedad,
   disponible en es/en/fr; descEs/En/Fr general no sustituye esas cuatro narrativas.
2. “Imagen protagonista” se interpreta como una PHOTO elegida explícitamente,
   no necesariamente la primera foto de la categoría. Pendiente de confirmar con cliente.
3. EN EL LUGAR corresponde a instalaciones/servicios de la propiedad y se diferencia
   de AMENIDADES editorialmente; el cliente debe definir esa separación para evitar duplicados.
4. Las cuatro secciones son fijas. El borrador no incluye títulos editables ni
   reordenación; si se requieren, debe revisarse antes de implementar.
5. No se asume que haya Media o traducciones completas en ninguna propiedad viva.
   Hace falta inventario editorial por casa con el cliente antes de publicar.
6. No se requiere modelar habitaciones individuales para una narrativa general;
   si el cliente sí las quiere, cambia el alcance del modelo.

Conclusión: disponibilidad/reserva y galerías son reutilizables. El impedimento de
contenido está en las descripciones específicas y servicios reales por propiedad,
no en la posibilidad actual de agrupar fotos. La fase siguiente debe confirmar
el modelo editorial y el contenido antes de diseñar la presentación scroll.
