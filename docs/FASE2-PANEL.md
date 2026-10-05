# Fase 2 — Panel del colaborador

Fecha: 05 Oct 2026. Implementado sin cambios de esquema, migraciones ni despliegues. La aplicación conserva DATABASE_URL; el usuario indica que apunta a la rama Respaldo. Las pruebas automatizadas descritas aquí usan memoria y no conectan a Neon. La prueba manual de navegador contra Respaldo sigue pendiente.

## Rutas y permisos

| Ruta | Método / función | Validación del servidor |
| --- | --- | --- |
| /[locale]/panel | Página de listado | Auth.js y rol vigente ADMIN/COLLABORATOR; ownerId para host, todas para admin |
| /[locale]/panel/nueva | Crear propiedad | Mismo guard de rol; formulario privado |
| /[locale]/panel/propiedades/[id] | Editar datos, temporadas, bloqueos e imágenes | Mismo guard y propietario; ajena/inexistente: 404 |
| /[locale]/panel/consultas | Consultas y reservas | Queries de Messages/Booking unidas a Property y filtradas con managedProperties |
| /api/properties | GET inventario / POST crear | requirePropertyManager; POST asigna ownerId desde la sesión y published=false |
| /api/properties/[id] | PATCH datos, precios base y publicación | Propiedad autorizada antes de leer payload y filtro SQL en UPDATE; solo admin puede published=true |
| /api/properties/[id]/resources | GET temporadas, disponibilidad y Media | Propiedad autorizada y filtros por propiedad en cada query hija |
| /api/properties/[id]/{rates,blocks,media} | POST recurso | Rol/dueño antes de tocar datos e INSERT SELECT con permiso dentro de la sentencia |
| /api/properties/[id]/{rates,blocks,media}/[resourceId] | PATCH / DELETE recurso | Rol, dueño, parent id y child id en servidor/SQL; blocks solo source=host-block |
| /api/messages/read | POST marcar consulta leída | Guard existente de Fase 1 por propiedad del mensaje |

CLIENT, VIEWER y anónimos se redirigen a /[locale] desde las páginas. Las APIs mantienen 401 sin sesión y 403 sin rol de gestión. Los recursos ajenos responden 404. No existe DELETE de propiedades ni endpoints de usuarios/invitaciones. Las pantallas /admin siguen reservadas a ADMIN.

## Supuestos S1–S4

- S1: el host gestiona temporadas y bloqueos propios. Un bloqueo se guarda en Booking con source=host-block, sin huésped ni feed. Puede editarlo o quitarlo; no puede usar estas rutas para modificar reservas manuales o de iCal. Los intervalos de disponibilidad siguen [startDate,endDate), sin ocupar la noche de salida. Los bloques que cruzan otras reservas/bloqueos se rechazan. Esto no añade una garantía de exclusión transaccional de reservas concurrentes.
- El modo de edición reutiliza AvailabilityCalendar y ReservationDatesProvider dentro de AvailabilityEditor, sin modificar sus archivos ni el modo público. Al editar un bloqueo se excluye ese mismo bloqueo de la ocupación del calendario para poder ajustar sus fechas; el resto sigue ocupado.
- S2: el host ve consultas y reservas de sus propiedades, incluidas las no publicadas. Las tarjetas mantienen el patrón visual existente y añaden filtros de propiedad y leída/no leída. Puede marcar como leída con la API existente; esta pantalla no elimina consultas ni confirma reservas.
- S3: toda propiedad nueva nace en borrador y necesita aprobación del ADMIN. Con el modelo booleano published, no se distingue un borrador nunca enviado de uno pendiente de aprobación: se presenta como «Borrador · pendiente de aprobación». El admin ve todas en /panel y puede aprobar/publicar; el host solo puede despublicar. Editar una propiedad ya publicada no la despublica automáticamente.
- S4: se conservan baseWeekdayPrice/baseWeekendPrice y SeasonRate (fechas, precios, prioridad), sin nuevas fórmulas de precio ni cambios en la cotización pública. MXN se conserva como moneda.
- Imágenes: no existe almacenamiento/subida de archivos en el repo. Se reutiliza Media con URL HTTPS o ruta local existente, categoría y orden; las nuevas entradas son PHOTO. SectionSlider se reutiliza como vista previa. Los videos existentes se muestran, pero no se editan en esta fase.
- El slug se genera al crear a partir del título español y un sufijo del id; no se edita después. Todos los títulos/descripciones por idioma y los campos obligatorios del modelo se validan en servidor.

## Archivos de esta fase

Todos los paths siguientes son relativos a la raíz del repositorio.

| Archivo | Cambio |
| --- | --- |
| apps/web/src/app/[locale]/panel/layout.tsx | Guard privado y navegación localizada del panel |
| apps/web/src/app/[locale]/panel/page.tsx | Listado filtrado, estado y acciones de aprobación/despublicación |
| apps/web/src/app/[locale]/panel/nueva/page.tsx | Formulario privado de creación |
| apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx | Edición autorizada y recursos propios |
| apps/web/src/app/[locale]/panel/consultas/page.tsx | Queries filtradas de consultas/reservas |
| apps/web/src/app/api/properties/route.ts | POST con dueño de sesión y borrador; conserva GET protegido |
| apps/web/src/app/api/properties/[id]/route.ts | Validación compartida, 404 ajena y aprobación exclusivamente admin |
| apps/web/src/app/api/properties/[id]/resources/route.ts | Lectura autorizada de recursos de una propiedad |
| apps/web/src/app/api/properties/[id]/[resource]/route.ts | Creación autorizada de temporada, bloqueo o imagen |
| apps/web/src/app/api/properties/[id]/[resource]/[resourceId]/route.ts | Edición/quita del recurso con filtros padre/hijo |
| apps/web/src/lib/panel-validation.ts | Validación compartida de datos, fechas, precios y URLs |
| apps/web/src/lib/panel-server.ts | Guard de páginas y consulta de propiedad autorizada |
| apps/web/src/lib/panel-resources.ts | Queries filtradas y tipos de los recursos |
| apps/web/src/lib/panel-mutations.ts | Escrituras con autorización dentro del SQL |
| apps/web/src/lib/panel-response.ts | Respuestas de error sin exponer datos privados |
| apps/web/src/components/panel/PropertyForm.tsx | Crear/editar los campos del modelo |
| apps/web/src/components/panel/PublicationButton.tsx | Aprobar como admin o despublicar |
| apps/web/src/components/panel/ResourceEditor.tsx | Crear/editar/quitar temporadas e imágenes |
| apps/web/src/components/panel/AvailabilityEditor.tsx | Calendario existente en edición de bloqueos |
| apps/web/src/components/panel/Inquiries.tsx | Consultas localizadas con filtros y marcado de lectura |
| apps/web/src/components/panel/request.ts | Peticiones, errores localizados y clases del panel |
| apps/web/src/components/Navbar.tsx | Enlace al panel solo para ADMIN/COLLABORATOR |
| apps/web/messages/es.json | Namespace panel en español, sin modificar las traducciones existentes |
| apps/web/messages/en.json | Namespace panel en inglés |
| apps/web/messages/fr.json | Namespace panel en francés |
| scripts/test-property-access.cjs | Harness compartido con Media, render JSX y nuevos helpers; ajusta 404 de payload ajeno |
| scripts/test-panel.cjs | Regresión de APIs, borrador/aprobación, recursos y permisos |
| scripts/test-panel-render.cjs | Render SSR es/en/fr y guard de páginas |
| docs/CONTEXTO.md | Convenciones y seguridad de Fase 2 |
| docs/PROGRESO.md | Estado, validaciones y pendientes de Fase 2 |
| docs/FASE2-PANEL.md | Este mapa de rutas, inventario, decisiones y checklist |

## Pruebas automatizadas sin red

Desde la raíz con Node 24:

```powershell
node scripts/test-panel.cjs
node scripts/test-panel-render.cjs
node scripts/test-property-access.cjs
node scripts/test-auth-session.cjs
```

Los tests ejecutan handlers/queries reales con el SQL de Drizzle sobre SQLite en memoria, normalizando casts PostgreSQL. Las pruebas SSR usan las páginas/componentes reales y diccionarios completos con navegación simulada. No sustituyen interacción visual en un navegador, concurrencia PostgreSQL ni validación contra Respaldo. No envían correos, no descargan feeds y no crean/eliminan registros en Neon.

## Checklist manual — únicamente Respaldo

1. Confirmar en la configuración local que DATABASE_URL sigue apuntando a Respaldo, no a main. Iniciar `pnpm dev` (o el comando de Next local existente) sin instalar dependencias ni migrar.
2. Iniciar sesión por /es/login con un host ya existente. Abrir el enlace Panel del colaborador o /es/panel: ver solo sus propiedades. Probar CLIENT/VIEWER/anónimo: redirección a home.
3. Crear una propiedad de prueba con los títulos/descripciones es/en/fr y campos obligatorios. POST debe devolver 201; ownerId debe ser el del host y published=false. No debe aparecer en el listado público todavía.
4. Editar sus datos/precios: PATCH 200. Probar /panel/propiedades/ID_AJENO directamente y PATCH a ese id: 404, sin cambios. Probar inyectar ownerId/role/id en su payload: 400. Probar published=true como host: 403, sigue en borrador.
5. Añadir/editar una SeasonRate, una imagen y un bloqueo. Verificar que cada recurso pertenece a su propiedad. Intentar PATCH/POST/DELETE contra un padre o recurso ajeno: 404. Las fechas inválidas se rechazan; no se permite modificar una reserva normal o importada mediante blocks.
6. En disponibilidad, seleccionar llegada y salida con el calendario: rellena el formulario de bloqueo. Editar un bloqueo desde la lista y comprobar la selección bidireccional. Verificar que checkout no ocupa noche y que no se puede cruzar otro rango ocupado. Quitar solo un bloqueo de prueba mediante el botón y su confirmación.
7. Ver /panel/consultas: solo mensajes y reservas propios. Probar filtros de propiedad y leída/no leída; marcar una de prueba como leída. No deben aparecer consultas ajenas.
8. Iniciar sesión como admin: /panel muestra todas, incluidas borradores de hosts. Aprobar/publicar la nueva: PATCH 200. En ventana anónima, comprobar que aparece en el listado y detalle públicos con sus datos, imagen y disponibilidad.
9. Como host, despublicar una propiedad propia de prueba: deja de estar publicada. No hay botón ni endpoint de borrado físico de propiedades.
10. Repetir navegación, creación/edición y errores en /en/panel y /fr/panel; comprobar todas las etiquetas y mensajes. Mantener los títulos/descripciones del modelo en sus idiomas correspondientes.
11. Revisar en móvil/escritorio que formularios, filtros y calendario caben y se leen. Verificar que home/listado/detalle públicos mantienen estilos glass y sincronía calendario/formulario anteriores.

## Notas fuera de alcance

- Invitaciones, registro de colaboradores, gestión de usuarios, transferencia de dueño y borrado físico de propiedades quedan para otras fases.
- Subida de archivos/almacenamiento, edición de videos y un estado separado «solicitud de publicación enviada» requieren decisiones posteriores.
- No se añade gestión de feeds iCal ni confirmación/cancelación de reservas desde el panel del host. Se muestran reservas y solo se editan bloqueos del panel.
- La duplicación de MessageModal en MensajesList administrativo, textos administrativos antiguos y el enlace fijo del footer a /es/casas no se modifican.
- El flujo público y los diccionarios existentes no se cambian; solo hay un enlace adicional para cuentas de gestión y los datos que un dueño/admin decida guardar/publicar.
