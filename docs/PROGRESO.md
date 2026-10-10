# Progreso del Proyecto - Portal-Casas

Última actualización: 05 Oct 2026

---

## ✅ Completado

### 1. Internacionalización (i18n) - Página de Inicio
**Fecha:** 02 Oct 2026
**Archivos modificados:** `apps/web/src/app/[locale]/page.tsx` + diccionarios (`es.json`, `en.json`, `fr.json`)
**Cambios:**
- Todos los textos fijos en español reemplazados por claves `t('clave')`.
- Formulario de búsqueda ya no forza `/es/casas`; mantiene el locale elegido.
- 7 claves nuevas agregadas en los tres idiomas.
**Validación:** TypeScript ✓ | ESLint ✓ (3 advertencias preexistentes)

### 2. Conexión Calendario ↔ Formulario de Reserva
**Fecha:** 02 Oct 2026
**Archivos creados/modificados:**
- `ReservationDatesProvider.tsx` (estado compartido)
- `reservationDates.ts` (reglas de selección)
- `AvailabilityCalendar.tsx` (selección de rango)
- `MessageForm.tsx` (inputs sincronizados)
- `page.tsx` (conexión de componentes)
**Funcionalidad:**
- Primer clic en fecha disponible → LLEGADA (check-in).
- Segundo clic en fecha posterior → SALIDA (check-out).
- Clic en fecha anterior reinicia selección.
- Fechas ocupadas bloquean o invalidan la selección.
- Precio total recalculado automáticamente.
- Sincronización bidireccional (editar inputs actualiza calendario).
**Validación:** TypeScript ✓ | 17 pruebas de selección ✓ | ESLint ✓

### 3. Contraste Visual del Rango Seleccionado
**Fecha:** 02 Oct 2026
**Archivos modificados:** `AvailabilityCalendar.tsx` (estilos)
**Cambios:**
- Día de rango seleccionado: tono verde MÁS OSCURO vs. día disponible.
- Texto blanco sobre fondo oscuro para legibilidad.
- Mantenida estética de bordes redondeados y tamaño de celda.
**Validación pendiente:** Prueba visual en navegador

### 4. Glassmorphism en Página de Inicio
**Fecha:** 02 Oct 2026
**Archivos modificados:** Estilos de paneles principales en la home
**Cambios:**
- Fondo translúcido + desenfoque (`backdrop-filter: blur()`) aplicado.
- Coherencia con página de detalle de casas.
- Legibilidad mantenida sobre fondo desenfocado.
**Validación:** "Se ve bien" ✓ (confirmación manual)

---

## ⏳ En Proceso

### 5. Eliminación Barra de Progreso Redundante
**Fecha:** 02 Oct 2026
**Objetivo:** Quitar barra verde superior, mantener solo skeletons.
**Estado:** Prompt listo, pendiente de ejecución.

### 6. Internacionalización Completa - Página de Detalle de Casa
**Fecha:** 02 Oct 2026
**Archivos afectados:** `apps/web/src/app/[locale]/casas/[slug]/` (+ componentes hijos)
**Texto identificado:**
- Sección detalle, amenidades, formulario, calendario, controles de fotos, mapa.
- Menú y footer compartidos también tienen texto en español.
- Títulos/descripciones de casas: ya salen de BD por idioma ✓
**Enfoque:**
- Usar `Intl` para meses/días del calendario.
- Inputs `type="date"` mantienen formato día/mes/año según locale del navegador.
**Estado:** Agent trabajando (inventario de textos en curso)

---

## 🔜 Pendiente de Planificación

| Prioridad | Tema | Notas |
|-----------|------|-------|
| High | Validación de formulario de consulta | Email válido, fechas futuras posibles, huéspedes > 0 |
| Medium | Responsive calendario en móvil | Columnas apretujadas en pantallas pequeñas |
| Low | Meta título y descripción multilingüe | SEO tags por idioma |

---

## 📝 Decisiones Técnicas

1. **Fecha dd/mm/aaaa:** se mantiene formato en todos los idiomas (no regionalizado).
2. **Skeletons > Barra de progreso:** preferido por estética limpia.
3. **Provider compartido:** `ReservationDatesProvider` para estado de reservas.
4. **i18n en `Intl`:** días/meses del calendario usando `Intl.DateTimeFormat` con el locale activo.

---

## 🐛 Bugs Conocidos / Notas

- Navbar compartido: "PROPIEDADES" sigue en español en `Navbar.tsx:30`.
- Algunas rutas precargadas pueden abrir sin mostrar loading.
- Advertencias ESLint preexistentes (3) no fueron alteradas.

---

## 📊 Métricas de este Sprint (02 Oct 2026)

| Tipo | Cantidad |
|------|----------|
| Archivos modificados | ~19 archivos |
| Líneas agregadas | +500 aprox. |
| Líneas eliminadas | -90 aprox. |
| Tests pasados | 17 |
| Errores TS/ESLint | 0 nuevos |

---

### 7. Fase 1 — Rol colaborador y propiedad con dueño
**Estado:** Completada y validada en Respaldo según confirmación del usuario.
- Autorización Auth.js/rol vigente y filtros por dueño en el servidor.
- Colaborador: 200 propia / 404 ajena; admin: 200 en ambas.
- Se conserva la prueba de login/cookie/sesión sin red en `scripts/test-auth-session.cjs`.

### 8. Fase 2 — Panel del colaborador
**Fecha:** 05 Oct 2026
**Estado:** Implementado y validado con pruebas automatizadas sin red; pendiente checklist manual en navegador contra Respaldo.
- Panel privado es/en/fr: propiedades propias, creación, edición, temporadas, imágenes por URL, disponibilidad y consultas/reservas filtradas.
- Toda creación asigna dueño desde sesión y nace en borrador; publicación solo por admin. Despublicación disponible; sin borrado físico de propiedades.
- Reutiliza AvailabilityCalendar/ReservationDatesProvider y SectionSlider, sin modificar sus archivos ni el flujo público.
- Nuevas APIs verifican rol y dueño antes de tocar datos y dentro del SQL. Recursos ajenos: 404.
- Sin migraciones, despliegues ni escrituras de prueba en Neon/main.
- Validación: tests de APIs/permisos y render SSR es/en/fr, regresiones Fase 1/Auth.js, TypeScript y ESLint de los archivos de Fase 2.
- Checklist pendiente: prueba visual móvil/escritorio, edición real y aprobación/publicación por admin en Respaldo.
- Decisiones S1–S4, inventario de archivos y mapa de rutas: `docs/FASE2-PANEL.md`.

### 9. Lote de limpieza — correcciones menores acumuladas
**Fecha:** 05 Oct 2026
**Estado:** Los cuatro pendientes resueltos en código; comprobación del idioma en BD Respaldo pendiente de ejecución manual.
- [x] Footer es/en/fr localizado y error ESLint del enlace corregido; navegación comprobada en navegador en en/fr.
- [x] Galería: dots limitados al ancho disponible y con wrapping. Comprobados 55 puntos: tres filas a 360px, una a 1440px, sin overflow y con selección del último punto funcionando.
- [x] CategorySection: investigación previa confirmó regresión (map eliminado en 36db0df1). Listado restaurado con estilos anteriores, sin borrar props/datos ni alterar su ocultación sin fotos.
- [x] Consultas: el formulario envía lang desde el locale activo; API y esquema existentes se conservan. Persistencia es/en/fr verificada en memoria.
- Validación: TypeScript, ESLint de los componentes (0 errores; advertencia previa de img en slider), tests de consultas y render del panel es/en/fr.
- Sin migraciones, conexión directa a Neon, borrados ni cambios de validación/calendario/panel.
- Inventario, diagnóstico y pruebas manuales: `docs/LIMPIEZA-MENOR.md`.

### 10. Detalle — mosaico/lightbox y compartir desde el mapa
**Fecha:** 05 Oct 2026
**Estado:** Implementado; pruebas automatizadas y de navegador realizadas. Envío nativo a una app móvil y reproducción de videos pendientes de comprobación manual.
- PropertyGallery sustituye el hero de detalle; SectionSlider se conserva en categorías, CategoryGrid y panel.
- Mosaico de 2/3/4 columnas con 8 miniaturas y acceso a todos los medios mediante lightbox; dialog, teclado, foco, cierre, scroll y animación accesibles.
- Botón del mapa comparte título y URL con locale; fallback de copia y feedback es/en/fr. Cancelación nativa probada sin enviar datos a otra app.
- Es/en/fr comprobados a 360, 375, 768 y 1440px sin scroll horizontal; imágenes verticales y horizontales mantienen proporción.
- TypeScript, ESLint (solo warnings previos de datos sin uso en la página), test-gallery-share y regresiones de consultas/panel pasan.
- Sin librerías, backend, migraciones ni cambios en calendario/formulario/validación. Checklist y decisión en `docs/GALERIA-COMPARTIR.md`.

## Actualización — 6 de octubre 2026

### ✅ COMPLETADO Y DEPLOYADO EN PRODUCCIÓN
- i18n completo home/detalle/panel (es/en/fr)
- Calendario ↔ formulario de reserva bidireccional con precio dinámico
- Glassmorphism, skeletons con shimmer (barra verde eliminada)
- Fase 1: rol COLLABORATOR + ownerId + property-access.ts (matriz 200/404 validada)
- Fase 2: panel del colaborador (crear/editar propiedades, temporadas, imágenes, bloques, consultas propias)
- Deploy a producción: migración en main de Neon ANTES del código (checkpoint creado)
- Validación formulario de consulta: cliente + servidor (inquiry-validation.ts), 400 con code/fields
- Responsive de reserva: celdas 41-43px, flechas/inputs 44px, sin scroll horizontal (ver RESPONSIVE-RESERVA.md)
- Lote de limpieza: footer locale, dots galería, CategorySection restaurada (regresión commit 36db0df1), lang de consultas (ver LIMPIEZA-MENOR.md)
- Galería en mosaico + lightbox accesible + botón compartir mapa (Web Share API + fallback copiar) (ver GALERIA-COMPARTIR.md)

### 📋 PENDIENTES
- **Fase 3 — Invitaciones/gestión usuarios: BLOQUEADA esperando las 4 respuestas del cliente**
  (calendarios/Airbnb, manejo de mensajes, aprobación de publicación, reglas de precio)
- Columna huéspedes en Message (se valida, no se persiste) — requiere migración BD
- lastSyncedAt/iCal: columna de sincronización sin terminar — investigar
- Advertencia <img> en detalle (ESLint) — cosmética
- Pruebas pendientes en dispositivo real: compartir nativo en móvil, Safari/iOS, reproducción de videos en lightbox
- Cuenta meniblu@hotmail.com quedó COLLABORATOR en producción — cuenta de pruebas documentada
- Supuestos vigentes: "hoy" = America/Mexico_City en validación; mosaico diseñado para ≤8 miniaturas

### 🔑 INFRAESTRUCTURA ACTUAL
- Producción: código nuevo + main de Neon migrado (Vercel)
- Desarrollo local: branch Neon "Respaldo" (todo el testing aquí)
- Regla de deploy: migración en main ANTES de desplegar código, siempre con checkpoint previo
- Usuarios: admin susudone@proton.me; colaborador prueba meniblu@hotmail.com
- Convención de trabajo con el agente: prompts cerrados, reportes EN TEXTO (no capturas), auditoría manual tras cada entrega, verificar que NO toque main de Neon

## Actualización — 9 de octubre 2026

### Compresión automática de fotos (cliente)

- Implementada sin librerías en photo-upload.ts/ResourceEditor: umbral >1MB, JPEG .82, lado mayor 1920px sin upscale, orientación from-image, fallback al original y nombre .jpg saneado. Peso final validado con límite C1 vigente 4MB; servidor/Blob intactos.
- Nuevos mensajes de optimización/pesos es/en/fr; test-image-compression cubre canvas/decode/umbrales/fallback. Subida y cambio de propiedad mantienen permisos, categorías/orden y abort. QA real de cámara/verticales y calidad en Respaldo pendiente, sin operaciones Neon/Blob aquí.

### Home: búsqueda y Sobre nosotros/redes

- Corregido listado: consume guests/start/end, capacidad >= huéspedes y disponibilidad Booking/BlockDate en servidor; vacío/aviso y limpiar filtros es/en/fr. El buscador existente no ofrece destino.
- Implementado SiteContent key/value y editor exclusivo ADMIN /panel/contenido (GET/PUT /api/panel/site-content), narrativas es/en/fr de 2000 caracteres y redes HTTPS. Home muestra contenido guardado bajo el hero con Reveal y SVG locales; valores vacíos lo ocultan.
- SQL scripts/sql/site-content.sql PROPUESTO, NO EJECUTADO. Pendiente aplicación manual por Emma: Respaldo → validación → restore point/main antes del deploy autorizado. Tabla requerida por home; no desplegar sin ella.
- Tests offline nuevos: test-property-search.cjs y test-site-content.cjs; validación visual/BD real pendiente. Detalle, reservas y panel de propiedades intactos.

### Correcciones menores/medianas de auditoría

- Implementados los nueve puntos autorizados: config Drizzle sin safe, label email traducido, error de contraseña corta visible con token válido, lang inválido 400 INVALID_LANG, modal con salida estrictamente posterior, Date inválido 400 INVALID_DATES, reduced-motion sin reset de scroll, login por locale y .env.example sin secretos.
- Pruebas offline específicas: test-audit-fixes.cjs y extensiones de auth-session, inquiry y detail-scroll. Sin operaciones Neon/migraciones ni cambios a permisos, schema o flujos del panel.
- QA manual: en localhost/Respaldo verificar olvide/reset en es/en/fr (para probar el rechazo servidor, omitir validación HTML temporalmente), modal con fechas iguales deshabilitado y scroll interno conservado con reduced-motion. Solapamientos e iCal siguen pendientes y fuera de este lote.

### ✅ COMPLETADO (validado localmente por Emma; PENDIENTE de push/deploy)

**Sistema de imágenes — migración a Vercel Blob (CERRADA)**
- 84 fotos servidas desde Blob (dominio
  `eorinf4h9dcvcdit.public.blob.vercel-storage.com`), URLs de Media
  corregidas en main.
- Carpeta `apps/web/public/fotos` eliminada del repo.

**Scroll reveal público (08 Oct)**
- `components/Reveal.tsx`: IntersectionObserver, 700ms ease-out,
  distancia 48px, revelado único. Cascada en cards del listado
  (index*120ms, tope 600ms). Respeta prefers-reduced-motion y SSR.
  Aplicado a home, listado, detalle y footer público.

**Renta anual + contacto WhatsApp por propiedad**
- Schema: `rentalType` ('nocturna'|'anual', default 'nocturna'),
  `contactName`, `whatsapp` en Property.
- Panel: campos en PropertyForm + validación servidor
  (panel-validation.ts). Badge "Renta anual" en PropertyCard.
- Detalle: botón de WhatsApp secundario debajo del botón de
  reserva, con mensaje prellenado por idioma.
- ⚠️ Migración `scripts/sql/property-rental-contact.sql` PROPUESTA,
  AÚN NO EJECUTADA en Neon (Respaldo → main).

**Detalle — viaje de escenas full-screen (09 Oct) ✅ confirmado por Emma**
- Estructura: mosaico → 4 editoriales (destino/amenidades/
  habitaciones/lugar) → mapa/advertencias → reserva+WhatsApp.
- EditorialPresentation.tsx: avance por scroll (sin autoplay),
  contenidos y estilos internos conservados.
- Secciones no-editoriales con imagen de fondo personalizable
  elegida desde el panel (biblioteca de fotos; "ninguna" = blanco).
- Navbar inteligente (se oculta al bajar, reaparece al subir) y
  botón flotante ↑ (PropertyDetailScroll.tsx).
- Footer fuera del snap, pie de página normal al final del scroll.
- Eliminado velo blanco que lavaba la imagen de fondo.
- Docs: DETALLE-SCROLL-SNAP.md (checklist), CONTEXTO.md.
- Nota de entorno: navegador automatizado de QA caído en Windows
  (sandbox); el QA visual fue manual (checklist de Emma).

### 📋 PENDIENTES (prioridad)

1. **Bugs conocidos:** iCal sync no deduplica eventos (reservas
   duplicadas al repetir sync); `bookings/create` no valida
   solapamientos de fechas.
2. QA manual de calendario para colaboradores: tooltips de origen y desbloqueo host implementados; BlockDate de la grilla permanece solo lectura (sin endpoint DELETE existente).
3. Navbar post-login: fix aplicado, falta confirmación final.
4. QA de compresión cliente implementada: cámara >5MB, orientación/legibilidad y peso final en Respaldo.
5. Aplicación manual por Emma de `scripts/sql/site-content-featured.sql` (Respaldo → main) y QA de Propiedad destacada en home.
6. Aplicación manual de `scripts/sql/site-content-contact.sql` después del ALTER de destacada y QA del footer global (redes + WhatsApp, 375px y es/en/fr).

### Footer — redes y WhatsApp global (09 Oct 2026)

- Implementado: mismas URLs Instagram/Facebook de SiteContent, WhatsApp opcional con número visible/formato genérico, SVG inline, accesibilidad y estilos compartidos de redes; email intacto.
- Selector/campo ADMIN en Contenido del sitio, regex 8–15 dígitos y 400 INVALID_CONTACT_WHATSAPP; contexto del layout alimenta ambos footers, incluido detalle, sin modificar home/nav/detalle.
- Excepción aprobada: ALTER del CHECK para séptima clave contact_whatsapp; SQL preparado y PENDIENTE de ejecución manual por Emma. Cero tablas/columnas nuevas y ninguna conexión a BD.
- Pruebas offline: 30 scripts pasan, TypeScript web limpio y ESLint 0 errores/8 warnings preexistentes. QA real en Respaldo pendiente (vaciar individualmente, enlaces, 375px, tres idiomas y temas).

### Propiedad destacada en home (09 Oct 2026)

- Implementado: selector ADMIN en Contenido del sitio, clave featured_property_id por GET/PUT existentes, validación de publicada y tarjeta tras Sobre nosotros/cierre del video.
- Primera portada por coverOrder, fallback PHOTO por order/id; sin foto, eliminada o despublicada oculta. Descripción breve localizada, CTA localizado, animación existente de Sobre nosotros y hover respetando reduced-motion.
- Excepción mínima aprobada: ALTER del CHECK SiteContent en `scripts/sql/site-content-featured.sql`, PENDIENTE de ejecución manual. No hay nuevas columnas/tablas ni conexiones a Neon.
- Pruebas: `test-featured-property.cjs` y regresión `test-site-content.cjs`; suite de 29 scripts pasa, TypeScript web limpio y ESLint 0 errores/8 warnings preexistentes. QA visual 375px/es/en/fr/temas y BD Respaldo pendiente de Emma.

### Calendario del panel — origen y desbloqueo host (09 Oct 2026)

- Implementado: detalles por mouse/foco/toque con rango y origen es/en/fr; colores diferenciados, aviso de solo lectura, confirmación de eliminación completa de host-block, aviso flotante y actualización sin recarga completa.
- Reutilizado DELETE de bloques existente: propiedad propia/ADMIN; reserva directa/iCal no eliminables; property-access y endpoints sin cambios. Sin SQL/Neon.
- Tests offline: interacción cliente y permisos/DELETE real con SQLite en memoria; los 28 scripts pasan, TypeScript web limpio y ESLint 0 errores/8 warnings preexistentes. Validación visual y contra Respaldo pendiente de Emma (375px, es/en/fr, ambos temas).
- Decisiones: el bloqueo creado desde la grilla sigue siendo BlockDate; crear host-block desde el editor individual para este flujo. Sin desbloqueo parcial ni Deshacer (no hay restauración existente).
