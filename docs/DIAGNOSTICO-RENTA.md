# Diagnóstico del flujo de reservas y tipo de renta

Fecha: 2026-10-16. Inspección estática del árbol de trabajo actual, incluidos cambios locales previos. No se consultó Neon, no se probaron servicios externos ni navegador. Único archivo creado en esta tarea: este informe. No se propone ni implementa una solución.

Las decisiones futuras «anual / por días / ambas» son contexto del encargo, **no describen funcionalidad ya implementada**.

## 1. Modelo de datos actual

Fuente: `packages/db/src/schema.ts`, definiciones Drizzle para PostgreSQL, no Prisma.

| Tabla | Columnas relevantes | Relaciones y significado actual |
| --- | --- | --- |
| Property | `id` text PK; `ownerId` text NOT NULL; `published` boolean NOT NULL default false | Dueño → User. Publicación independiente de tarifas, calendario y tipo de renta. |
| Property | `rentalType` text NOT NULL default `nocturna` | Tipo TypeScript y CHECK solo permiten `nocturna` y `anual`. No existe `ambas`. |
| Property | `baseWeekdayPrice`, `baseWeekendPrice` integer nullable | Precio base por noche; consumo público en MXN. No hay columna específica de precio anual ni moneda por propiedad. |
| Property | `maxGuests` integer, `bedrooms` integer, `bathrooms` double precision; todos NOT NULL | Capacidad/datos básicos; huéspedes interviene en búsqueda y validación de consultas. |
| SeasonRate | `id` text PK, `propertyId` text NOT NULL, `name` text, `startDate`/`endDate` date, `weekdayPrice`/`weekendPrice` integer, `priority` integer default 0, `createdAt` timestamp con zona | FK a Property con cascade. Campos anteriores NOT NULL. Temporadas por rango; gana mayor prioridad en cotización. No condicionadas por rentalType. |
| Booking | `id` text PK UUID generado, `propertyId` text NOT NULL, `icalFeedId` text nullable, `startDate`/`endDate` date NOT NULL, `source` text NOT NULL default `manual`, `guestUserId` text nullable | FKs a Property, IcalFeed y User; FK compuesta feed/propiedad. Reservas manuales, bloqueos `host-block` y ocupación externa comparten tabla. |
| BlockDate | `id` text PK, `propertyId` text, `startDate`/`endDate` date, `createdBy` text, `createdAt` timestamp; NOT NULL | Bloqueos en tabla separada; FK Property cascade y User; CHECK salida > entrada; índice propiedad/fechas. Coexiste con Booking.source=`host-block`. |
| IcalFeed | `id` text PK, `propertyId` text, `url` text, `source` text default `MANUAL`; NOT NULL | FK Property cascade; relación compuesta con Booking. No tiene columna `lastSyncedAt`. |
| Message | `id` text PK; `propertyId`, `name`, `email`, `lang`, `body` NOT NULL; `phone`, `startDate`, `endDate`, `userId` nullable; `read` NOT NULL default false; `createdAt` NOT NULL | FK Property cascade y User. Es consulta, no reserva confirmada. No guarda huéspedes, cotización ni modalidad de consulta. |

No existe una tabla de días disponibles que deba llenarse previamente: disponibilidad significa ausencia de Booking/BlockDate que bloquee el rango. Property no contiene una bandera «calendario configurado».

## 2. Creación y edición

1. `/[locale]/panel/nueva/page.tsx` autoriza con `panelManager` y renderiza `PropertyForm`.
2. `PropertyForm.tsx` envía POST `/api/properties`; se crea borrador, owner=usuario gestor y slug derivado del título español + id. Redirige a `/panel/propiedades/{id}`.
3. La página de edición obtiene propiedad autorizada, recursos y secciones; renderiza PropertyForm, PropertyPresentationEditor, ResourceEditor de tarifas, AvailabilityEditor, biblioteca/fotos y PropertySectionsEditor. Los controles de tarifas y disponibilidad se renderizan **también para anual**.
4. Los formularios guardan por separado. PropertyForm hace PATCH `/api/properties/{id}`. PropertyPresentationEditor hace PATCH de `sectionTitles`: video del hero y títulos por sección/idioma. No administra precios ni disponibilidad.
5. PublicationButton es independiente; publicar está reservado a ADMIN en el PATCH. No se exige tener tarifas, reservas ni feed iCal para guardar/publicar en esa ruta.

Validaciones concretas (`panel-validation.ts`, `propertyInput`): títulos y descripciones es/en/fr y dirección son textos no vacíos al crear; maxGuests entero >=1, bedrooms entero >=0, bathrooms finito >=0. Precios base son opcionales/null o enteros >=0. Coordenadas opcionales con rangos de latitud/longitud. Estado/ciudad del catálogo válidos en pareja, o ninguno; `city` legacy se conserva y al crear sin texto se escribe cadena vacía. Tipo de renta solo nocturna/anual. Contacto opcional, nombre <=100 caracteres, WhatsApp 8–15 dígitos.

Temporadas se guardan como recursos independientes: nombre, rango válido con salida posterior, precios enteros >=0 y prioridad entera. AvailabilityEditor usa fechas obligatorias para crear/editar bloqueos `host-block`; no exige configurar disponibilidad para guardar Property. Existe además la vista `/admin/tarifas`, con acciones propias: valida campos y fechas; sus comprobaciones de precios no son idénticas al validador de recursos (rechaza cero por condición falsy, sin comprobar ahí mínimo/entero). Ambas rutas tienen scoping de propiedad.

PropertyPresentationEditor admite cada título vacío en los tres idiomas (fallback), o completo en los tres, máximo 150 caracteres por idioma. Ninguno de estos pasos implementa una modalidad «ambas».

## 3. Búsqueda pública

Fuentes: `PropertySearchForm.tsx`, `lib/property-search.ts`, `/[locale]/casas/page.tsx` y `lib/reservationDates.ts`.

- GET: `start`, `end`, `guests`, `state`, `destinationCity`. No hay filtro por precio en este flujo.
- El parser rechaza arrays, huéspedes no enteros/menores a 1, fechas inválidas/pasadas, una sola fecha o salida <= llegada, y combinaciones de ubicación no válidas. Ciudad requiere estado reconocido; compara normalizado contra catálogo y devuelve el nombre canónico.
- Filtros se combinan con AND: `published=true`, igualdad state/destinationCity cuando vienen, `maxGuests >= guests` cuando viene, ausencia de ocupación cuando vienen ambas fechas.
- Fechas: dos NOT EXISTS contra Booking y BlockDate, con `ocupado.startDate <= end` y `ocupado.endDate > start`. El criterio impide que checkout caiga en un día de llegada ocupado, en consonancia con el selector actual; no es simplemente una comprobación de noches [start,end).
- Sin Booking ni BlockDate: ambos NOT EXISTS se cumplen y **la propiedad se incluye**, aunque carezca de tarifas, feed o calendario previamente usado. No se rompe por ausencia de esas filas.
- Sin tarifas: no se excluye; SeasonRate/precios no se consultan para decidir resultados.
- `rentalType` no aparece en los predicados: hoy una anual publicada puede aparecer **con y sin fechas**. Solo hay distintivo «Renta anual» en PropertyCard.
- Filtros inválidos → lista vacía sin ejecutar consulta de propiedades; UI localizada de error/vacío y acción limpiar. Solo ciudad sin fechas funciona si la URL incluye su estado correspondiente.

## 4. Sincronización Airbnb/iCal

Fuente: POST `/api/ical/sync`, invocado desde CalendarBoard. Requiere ADMIN o COLLABORATOR; carga feeds vinculados a propiedades permitidas (admin todas; colaborador propias).

| Situación | Comportamiento observable en código |
| --- | --- |
| Propiedad sin IcalFeed | No hay feed que recorrer; no participa. Si no hay ninguno para el gestor: 200, synced=0. |
| Con feed, sin tarifas ni Booking anteriores | Sí participa; no se leen tarifas ni se exige calendario. Los VEVENT se insertan en Booking. |
| Anual con feed | Participa igual: no hay filtro rentalType ni published. |
| Feed vacío/no objeto | Se omite ese feed y continúa. |
| Error de descarga/parser | Catch global: error 500 salvo error de acceso; no hay aislamiento por feed. |

`feed.source === 'airbnb'` produce Booking.source=`airbnb`; cualquier otro valor produce `google`. Se revalida autorización al insertar. Se asigna UUID nuevo a cada evento; el UID solo se agrega a un array local y **no se usa para upsert ni deduplicación**. Tampoco hay borrado de eventos retirados ni actualización lastSyncedAt en esta ruta. No puede afirmarse que repetir la sincronización sea idempotente. No se ejecutó sincronización real ni se verificaron feeds configurados en BD.

## 5. Mensajes y confirmación

Flujo público identificado: `MessageForm` → FormData POST `/api/messages` → INSERT Message → vistas «Mis consultas» y «Mensajes». No se crea Booking al enviar el formulario.

Contrato actual: propertyId, lang es/en/fr, name, email, phone opcional, body, startDate, endDate y guests. Cliente y servidor comparten `validateInquiry`: nombre 2–100; email con formato y <=254; teléfono opcional con formato/dígitos validados; mensaje no vacío; fechas válidas, no pasadas, salida posterior, disponibilidad; huéspedes entero positivo dentro de capacidad. Hoy no hay modo sin fechas. `inquiryToday()` usa America/Mexico_City.

La API limita 5 intentos/IP/15min antes de procesar, exige propiedad publicada y revalida capacidad/ocupación al insertar para cambios concurrentes. Devuelve 201; errores 400 con code/campos, 404 si no publicada/inexistente, 429 o 500. Asocia userId si existe sesión; no requiere login público. No consulta rentalType ni tarifas para admitir el mensaje. **No envía email de notificación al dueño desde esta ruta**: guarda en BD. Mailer se usa en confirmación de Booking.

Presentación en panel:

- `/panel/consultas/page.tsx` + `panel/Inquiries.tsx`: consultas de propiedades autorizadas, filtros propiedad/leída, miniatura, enlace público, cliente/email/teléfono, texto, fechas localizadas, noches y estimación prudente. Total solo para nocturna con precio uniforme entre semana/fin y sin temporada superpuesta. Pasadas = checkout < hoy (fecha calculada en servidor); al final ordenadas por checkout descendente. Sin fechas no sería pasada; muestra texto de fechas no disponibles y no calcula noches/total.
- `/admin/mensajes/page.tsx` + MensajesList: permite ambos roles con scoping. Incluye idioma, contactos, texto, fechas opcionales, usuario asociado y estado. Título de propiedad consultado en español. Ambas listas abren MessageModal.
- Marcar leída y eliminar usan `/api/messages/read` y `/api/messages/delete`, con `managedResource`. No implican reserva.
- MessageModal permite ajustar fechas locales y confirmar mediante `/api/bookings/create`; no persiste esas fechas sobre Message. Confirmar requiere fechas presentes y start < end. Inserta Booking.source=`manual`; intenta email al huésped, y fallo de correo no revierte la reserva. La ruta comprueba BlockDate; no contiene un NOT EXISTS de otros Booking en ese INSERT.

Compatibilidad observada con el futuro contacto simple (sin diseño propuesto): Message ya permite fechas nulas y los listados ya reciben campos opcionales; **el contrato de entrada, la validación compartida y la confirmación del modal siguen acoplados a fechas/huéspedes**. Por tanto, el formulario simple descrito por el encargo no puede enviarse por el flujo actual sin cambios posteriores. No hay discriminador persistido que distinga contacto anual de consulta nocturna.

## 6. WhatsApp y correo

- `Property.whatsapp`: text nullable, 8–15 dígitos, sin + ni espacios; editable en PropertyForm.
- `Property.contactName`: text nullable, <=100 caracteres. Se guarda en el mismo formulario; la ficha actual no muestra este nombre ni lo incorpora en su mensaje de WhatsApp.
- Ficha: enlace condicional **solo por presencia de whatsapp**, bajo MessageForm. URL `https://wa.me/{numero}?text={mensaje localizado con título de propiedad}`. PropertyWhatsAppLink registra `whatsapp_clicked` con slug; rentalType no altera la condición.
- **Property no tiene email de contacto propio.** `ownerId` relaciona User, cuyo email existe; no se consulta ni expone como contacto público en esta sección. El email mostrado en los mensajes es el del visitante, no el del dueño.
- SiteContent.contact_whatsapp es contacto global del footer, independiente del WhatsApp por propiedad; no sustituye los datos anteriores.

## 7. Reserva en ficha y dependencias de composición

`/[locale]/casas/[slug]/page.tsx` obtiene propiedad publicada primero; después lee en Promise.all Media, PropertySection, Booking, BlockDate y SeasonRate, además de traducciones. Combina Booking+BlockDate y construye `pricing`. Estas lecturas ocurren también para anual.

La sección `SectionBackground id="reservar" name="reservation"` siempre se renderiza, con título localizado/editable, Reveal y grid de dos columnas. `ReservationDatesProvider key={property.id}` contiene ambos paneles:

| Pieza | Props/dependencias | Comportamiento actual |
| --- | --- | --- |
| AvailabilityCalendar | `bookings: {startDate,endDate}[]`; contexto ReservationDatesProvider | Calendario seleccionable y rangos ocupados; escritorio a la derecha, móvil arriba. No depende directamente de precios. |
| MessageForm | propertyId, propertySlug opcional, locale, pricing, maxGuests, compact opcional | Formulario a la izquierda en escritorio y debajo del calendario en móvil. Usa contexto de fechas obligatoriamente; no es hoy un formulario de contacto independiente. |
| PricingInfo | base weekday/weekend nullable; seasons start/end/weekday/weekend/priority; booked start/end | Cotización por noche, sábado/domingo fin de semana; temporadas incluyen sus extremos y mayor prioridad. Si falta precio en alguna noche: total null, «consultar», sin impedir por sí mismo consultar fechas libres. |
| PropertyWhatsAppLink | propertySlug y props de enlace | Independiente del contexto/calendario; bajo formulario si hay número; nueva pestaña. |
| Reveal | children/className y opciones delay/distance/as | Misma envoltura existente: formulario desde izquierda, calendario desde derecha, una vez; reduced-motion. |

El ancla `#reservar` y CTA flotante cuando hay editoriales apuntan a esta sección. Fullpage está conservado pero desactivado (`DETAIL_FULLPAGE_ENABLED=false`). No existe el layout de contacto simple con icono de correo a la derecha; la derecha actual es el calendario. Las piezas de presentación y enlace son separables en la composición, pero el formulario actual tiene las dependencias de fechas descritas, no una variante anual ya disponible.

## Alcance comprobado y archivos revisados

No se verificaron schema efectivamente aplicado, datos vivos, correo entregado, feeds remotos, gestos ni comportamiento visual. No se ejecutaron tests/build porque esta tarea es inspección y documentación sin cambios ejecutables. No se modificaron archivos previos del árbol de trabajo.

Rutas relativas a la raíz del repositorio:

- `packages/db/src/schema.ts`.
- `apps/web/src/lib/{panel-validation,panel-resources,property-access,property-search,inquiry-validation,reservationDates,occupation-calendar,rate-limit}.ts`.
- `apps/web/src/components/panel/{PropertyForm,PropertyPresentationEditor,AvailabilityEditor,Inquiries}.tsx`.
- `apps/web/src/components/{MessageForm,MessageModal,MensajesList,AvailabilityCalendar,ReservationDatesProvider,SiteAnalytics}.tsx`.
- `apps/web/src/components/PropertyCard.tsx` y `PropertySearchForm.tsx` (referencias de búsqueda/uso; el filtrado efectivo está en page.tsx).
- `apps/web/src/app/[locale]/casas/{page.tsx,[slug]/page.tsx}`.
- `apps/web/src/app/[locale]/panel/{nueva/page.tsx,propiedades/[id]/page.tsx,consultas/page.tsx}`.
- `apps/web/src/app/[locale]/admin/{mensajes/page.tsx,tarifas/page.tsx,tarifas/actions.ts}`.
- `apps/web/src/app/api/properties/{route.ts,[id]/route.ts,[id]/[resource]/route.ts}`.
- `apps/web/src/app/api/messages/{route.ts,read/route.ts,delete/route.ts}`.
- `apps/web/src/app/api/{bookings/create/route.ts,ical/sync/route.ts}`.

No se elige almacenamiento, migración, UI futura ni estrategia de implementación en este informe.
