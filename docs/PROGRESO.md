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
