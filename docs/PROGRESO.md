# Progreso del Proyecto - Portal-Casas

Última actualización: 02 Oct 2026

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

*Documento mantenido manualmente. Se recomienda actualizar tras cada sprint o hito importante.*
