# Errores del panel — 13 Oct 2026

Corrección puntual de los sitios de `AUDITORIA-UX-PANEL.md`. Sin cambios de estilos, esquema, permisos, calendario ni negocio de reservas.

## Contrato

`panelRequest(url, method, body?)` conserva su firma y respuesta de éxito. Ahora lanza `PanelRequestError`: `message` es una clave del namespace `panel`, `status` y `code` conservan el diagnóstico. Los consumidores existentes que hacen `t(error.message)` reciben automáticamente las nuevas traducciones.

`panelResponseError(status, payload)` aplica el mismo mapa al uploader multipart; `panelErrorKey(error, fallback)` permite un fallback contextual al marcar consultas. Se reconocen únicamente códigos estructurados conocidos o claves exactas `error/message` de la lista permitida; nunca se analiza texto libre ni se muestran errores SQL al usuario. HTTP401 siempre pide re-login;403 significa permisos salvo `SESSION_USER_NOT_FOUND`, que identifica sesión inválida.

Los call sites adaptados son MarkAsReadButton (mensajes admin antiguos), Inquiries (Mis consultas) y el manejo de errores de ResourceEditor/uploader. No cambia el transporte ni la lógica de subida. Las restantes acciones que ya usan panelRequest conservan su firma y reciben los mensajes nuevos sin reescritura.

## Mensajes implementados

| Señal | Mensaje/acción es (también traducido en en/fr) |
|---|---|
|401 / UNAUTHENTICATED / SESSION_USER_NOT_FOUND|Tu sesión expiró o ya no es válida. Inicia sesión de nuevo para continuar.|
|403 / FORBIDDEN / ROLE_NOT_ALLOWED|No tienes permiso para esta operación.|
|Fetch rechazado por red|Hubo un problema de conexión. Comprueba tu red y vuelve a intentar; no se pudo confirmar la operación.|
|Fallo no diagnosticable al marcar leída|No se pudo marcar la consulta como leída. Vuelve a intentar.|
|Portada|Hasta5sin duplicados / elegir PHOTO vigente propia|
|Fondos/hero/editoriales|Foto válida de la propiedad, sección/contenido válidos, máximo2fotos sin duplicados|
|SiteContent|Sobre nosotros≤2000, URL HTTPS válida, WhatsApp8–15dígitos, destacada publicada/disponible|
|Subida|Tipo JPEG/PNG/WebP, tamaño4MB, solicitud con archivo válida o fallo de almacenamiento explícito|
|Tarifa antigua|Seleccionar propiedad; nombre; fecha inicio/fin válida; fin posterior; precio entre semana/fin de semana válido y no cero|

Tarifas: el único error anterior `?error=datos` se desglosa en claves de campo por la propia Server Action, sin inferencias. La página ahora lee searchParams y muestra un alert localizado. El redirect de validación usa el locale activo. El caso legado `datos` o clave desconocida conserva validación general. Precios negativos y prioridad mantienen la regla existente: no se amplía esta tarea a cambiar esas reglas; no se presentan mensajes que prometan validar más de lo que se valida.

MarkAsReadButton verifica response.ok mediante panelRequest, muestra alert y no refresca ante rechazo. Detiene la propagación del clic para que el artículo de MensajesList no abra su modal y oculte el feedback. Texto/clases del botón y aspecto de las vistas se conservan. Inquiries usa el mismo fallback contextual. Para cambios rechazados por red no se afirma que el servidor no escribió: podría haberse perdido la respuesta después de una mutación.

## Requiere cambio en API (no implementado)

- PropertyForm y recursos generales: `PanelValidationError('validation')` no identifica campo. Se conserva validación general; no se adivina qué dato falló.
-401 distingue falta/fin de sesión por HTTP. Algunos endpoints, incluido `/api/messages/read`, descartan `SESSION_USER_NOT_FOUND` y devuelven403sin code: no se puede separar usuario eliminado de permisos; se mantiene mensaje de permisos hasta que esos endpoints preserven el code.
-404 de algunos bloqueos/reservas combina recurso inaccesible y rango ocupado. Se mantiene mensaje neutro de recurso no disponible, sin revelar propiedades ajenas ni inventar ocupación.
-409sin code identifica conflicto, pero no el campo/recurso concreto; fallback de conflicto, sin atribuirlo a email/fechas. La UI de usuarios no edita email.
-500sin code conocido: fallback general, o «No se pudo marcar…» en esa acción.429sin code reconocido no permite un mensaje específico ni duración fiable desde este helper.
-Respuesta2xxcon JSON vacío/malformado conserva el comportamiento anterior del helper; validación completa de respuestas de éxito queda pendiente, fuera de estos cambios.
-CalendarBoard/MessageModal/traducción tienen transportes propios; no se reescriben en esta tarea como si fueran call sites del helper. Mantienen sus mensajes hasta una tarea específica.

## Verificación realizada

-Petición local a `/api/messages/read` SIN cookies: HTTP401, cuerpo `{"error":"No autorizado"}`. La autenticación rechaza antes de consultas/mutaciones; no se marcó ningún mensaje real.
-`test-panel-errors.cjs`: helper real ante401/403/code conocido/desconocido/mensaje estructurado/red; componente MarkAsReadButton con fetch simulado401, rechazo de red y500: alert traducido correcto, sin refresh, clic sin abrir modal. Tarifas con nombre vacío, fecha inválida/rango inválido y precio inválido: redirect por campo, alert localizado y ninguna escritura; es/en/fr.
-No hay sesión de panel disponible para provocar visualmente estos fallos con usuarios reales. Los resultados de UI anteriores son pruebas de componente, no capturas de una sesión autenticada. QA manual de navegador pendiente.

## Pruebas manuales para Emma

1. `pnpm dev`; iniciar sesión en panel es y abrir una consulta sin leer. En otra pestaña cerrar sesión; volver a la pestaña abierta y pulsar Marcar como leída. Debe mostrarse «Tu sesión expiró o ya no es válida. Inicia sesión de nuevo para continuar», sin marcar ni refrescar como éxito. Repetir en admin/mensajes: el clic no abre el modal.
2. Con la consulta visible y sesión válida, DevTools → Network → Offline, pulsar Marcar como leída. Debe aparecer el mensaje de conexión; no se refresca ni desaparece la consulta. Volver Online para reintentar SOLO en entorno de prueba autorizado. Si una respuesta500se simula, debe mostrarse «No se pudo marcar la consulta como leída. Vuelve a intentar».
3. Simular403sin code en Network/entorno de prueba: mensaje de permisos, distinto al anterior; `SESSION_USER_NOT_FOUND` con code debe pedir re-login. No cambiar roles reales para probarlo.
4. En tarifas admin de entorno de prueba: introducir fin anterior/igual a inicio, enviar: alert indica el rango. Para nombre/propiedad faltante o precio0, HTMLrequiredpuede impedir enviar: usar un mock de Server Action o una petición de prueba equivalente, sin crear tarifas en producción. Verificar clave/campo correcto y locale del redirect.
5. Repetir en en/fr; simular INVALID_COVER_PHOTO / INVALID_SOCIAL_URL en sus editores y comprobar mensaje específico. Una code desconocida nunca debe mostrar SQL ni el mensaje arbitrario del servidor.

Supuestos:401 significa sesión no autenticada; no se distingue expiración de nunca haber iniciado sesión porque ambas exigen re-login. Se usa una lista explícita de codes/claves. No se deducen causas desde frases libres; no se realizan cambios de API fuera de la validación puntual de tarifas autorizada.
