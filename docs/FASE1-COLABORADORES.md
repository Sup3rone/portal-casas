# Fase 1: colaboradores, dueños y seguridad

Implementación basada en los archivos del repositorio. No se consultó con éxito ni se modificó Neon. La migración queda para ejecución manual en el entorno local del usuario.

## Permisos

| Recurso | ADMIN | COLLABORATOR | CLIENT / VIEWER / anónimo |
| --- | --- | --- | --- |
| Catálogo y detalle publicados | Lectura | Lectura | Lectura |
| GET /api/properties (inventario de gestión) | Todas | Solo propias, también no publicadas | 403 con sesión; 401 sin sesión |
| PATCH /api/properties/ID (textos, datos, publicación y precios base) | Cualquier propiedad | Solo propia | Denegado |
| Añadir/borrar SeasonRate (acciones existentes) | Cualquier propiedad | Solo propia | Denegado |
| Marcar/borrar Message | Todos | Solo los de propiedades propias | Denegado |
| Crear Booking / sincronizar IcalFeed | Cualquier propiedad | Solo propia | Denegado |
| POST /api/messages (consulta del huésped) | Solo publicadas | Solo publicadas, también ajenas | Solo publicadas |
| Historial personal de consultas/reservas | Solo el del usuario actual | Solo el del usuario actual | Solo el del usuario actual autenticado |
| Páginas /admin | Permitido | Denegado en fase 1 | Denegado |
| Cambiar roles u ownerId por API | No hay endpoint | Denegado | Denegado |

La creación de consultas públicas y la lectura del historial personal son excepciones explícitas a los permisos de gestión; conservan el flujo de huésped existente. El historial no revela el título de una propiedad que ya no está publicada.

## Autorización

- `src/lib/property-access.ts` verifica Auth.js y consulta el rol vigente en User. Ni el rol aportado por el cliente ni la antigua cookie admin_session conceden acceso.
- Cada query/mutación de gestión incluye la comprobación de rol/dueño en SQL. Las inserciones usan INSERT SELECT sobre la propiedad autorizada, evitando validar un id y luego escribir sin filtro. Recursos ajenos/inexistentes devuelven 404, sin revelar su existencia.
- Los listados administrativos validan ADMIN también en el servidor, sin depender del proxy. No se permite entrar a colaboradores en las pantallas admin, ni se crea ninguna interfaz nueva.
- Las acciones de tarifas verifican permisos incluso si se invocan directamente. El PATCH usa una lista de campos permitidos, sin ownerId, id, createdAt, slug ni role.
- El JWT actualiza el rol en cada evaluación. La autorización sigue verificando el rol en BD y dentro de la sentencia SQL, también si una sesión o un manager quedan obsoletos.
- Booking.guestUserId: un colaborador solo puede vincular huéspedes ya relacionados con esa misma propiedad por Message o Booking. El admin conserva el comportamiento anterior.
- La sincronización solo descarga feeds autorizados y revalida la propiedad/feed al escribir después del fetch.

## Modelo y migración manual

- Se conserva VIEWER como rol legado y CLIENT como valor por defecto; se añade COLLABORATOR sin privilegios de admin.
- ownerId ya existe en el esquema y se conserva, con índice para consultas por dueño.
- Booking.propertyId obtiene FK a Property. La FK compuesta (icalFeedId, propertyId) evita asociar una reserva a un feed de otra propiedad.
- Media, Message, SeasonRate e IcalFeed ya tienen FK a Property. No duplican ownerId: heredan el permiso por su propertyId.
- `packages/db/migrations/001-collaborator-ownership.sql` es autocontenido, con BEGIN/COMMIT. Sustituir REEMPLAZAR_ID_ADMIN por el id confirmado del admin actual. No se elige un usuario por orden de creación o por email supuesto.
- TODAS las propiedades que existan al ejecutar la migración se asignan a ese admin. Antes, OwnershipMigrationAudit registra propertyId, previousOwnerId, assignedOwnerId, changed y fecha, incluso para propiedades cuyo dueño no cambia. No se borran filas de negocio ni se cambian sus precios/reservas.
- La transacción rechaza un admin inválido, recursos huérfanos, dueños anteriores inexistentes y reservas con feeds ajenos/ausentes. Si falla, no ejecutar COMMIT: ejecutar ROLLBACK manualmente y revisar el motivo. No corrige ni elimina datos silenciosamente.
- Una ejecución posterior con el mismo historial activo no reasigna propiedades nuevas o transferidas. La auditoría no lleva FK para sobrevivir a eliminaciones futuras y se incluye en el esquema Drizzle.
- `001-collaborator-ownership-rollback.sql` restaura los dueños anteriores y marca la reversión. Rechaza dueños eliminados o reasignaciones posteriores; no borra auditoría, tablas, columnas, enum ni FKs. Si ownerId originalmente era nullable, permite volver a NULL. Es una reversión de datos; tras ella no desplegar esta versión si el modelo original admitía propiedades sin dueño.
- Ensayar primero en una copia PostgreSQL local de la BD. Comparar dueños y conteos antes/después, ejecutar dos veces para verificar idempotencia y probar el rollback en la copia. Ningún script SQL fue ejecutado desde este chat. No usar db:push para sustituir el backfill auditado.
- Orden de despliegue: backup/copia local, ensayo de SQL, revisión de auditoría, aplicar SQL manualmente, desplegar código. Las asignaciones de colaboradores para pruebas se hacen después del COMMIT de la migración.

## Pruebas sin red

Desde la raíz, ejecutar `node scripts/test-property-access.cjs` con Node 24. Usa el SQL generado por Drizzle y los handlers reales sobre SQLite en memoria, con sesiones controladas. Neon, fetch de iCal y envío de correo están sustituidos: no conecta ni envía mensajes reales.

Cubre anónimo/CLIENT/VIEWER/usuario eliminado, admin, colaboradores, JWT con rol obsoleto/falsificado, actualización propia/ajena, asignación masiva de ownerId, lectura/borrado de mensajes, acciones de tarifas, reservas, huésped ajeno, feeds propios, revocación del rol y consulta pública solo a propiedades publicadas. SQLite normaliza los casts PostgreSQL de texto/fecha: estas pruebas NO validan DDL, enum, PLpgSQL ni locks de PostgreSQL.

## Pruebas manuales en el entorno local

1. Aplicar el SQL revisado en una copia local y revisar OwnershipMigration y OwnershipMigrationAudit. Crear dos cuentas de prueba mediante el registro normal existente; promoverlas manualmente en SQL: `UPDATE "User" SET "role" = 'COLLABORATOR' WHERE "id" = 'HOST_A_ID';` y lo mismo para HOST_B.
2. Asignar una propiedad de prueba a cada host después de la migración: `UPDATE "Property" SET "ownerId" = 'HOST_A_ID' WHERE "id" = 'PROPERTY_A_ID';`. Conservar IDs/dueños anteriores para restaurar la copia al terminar.
3. Iniciar sesión por separado en /es/login como admin y cada host. En DevTools del mismo origen, `fetch('/api/properties').then(r => r.json()).then(console.log)`: admin ve todas, cada host ve solo las suyas. El menú admin no se muestra a hosts.
4. Como HOST_A, ejecutar `fetch('/api/properties/PROPERTY_B_ID', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({titleEs:'Intento ajeno'})}).then(async r => ({status:r.status, body:await r.json()})).then(console.log)`: debe devolver 404 y dejar la propiedad B intacta. Repetir con A: 200. Probar ownerId o role en el payload: 400.
5. Para /api/messages/read y /api/messages/delete, enviar POST JSON `{id:'MESSAGE_B_ID'}` como HOST_A: 404 sin cambios. Para /api/bookings/create, enviar propertyId de B y fechas válidas: 404 sin reserva/correo. Admin debe poder operar sobre A y B. Hacer estos ensayos solo con recursos de prueba; delete sí elimina el mensaje si está autorizado.
6. Probar tarifas invocando las acciones desde una prueba de integración con la sesión del host: propertyId/id propios permitidos, ajenos rechazados. Las pantallas /admin siguen vedadas al host; no se abre esa UI para poder probarlas.
7. Sin sesión, GET inventario y mutations de gestión: 401; con CLIENT/VIEWER: 403. Una cookie admin_session aislada no autoriza. Cambiar el rol del host a CLIENT y repetir con la sesión abierta: pierde inmediatamente el permiso del servidor.
8. Anónimo: home, listado, detalle publicado, calendario, cotización y envío de consulta funcionan igual. Detalle no publicado: 404; POST consulta a un id no publicado/inexistente: 404.

## Supuestos y notas

- Nombre interno del rol: COLLABORATOR, siguiendo los roles en mayúsculas existentes.
- No se habilita crear/borrar propiedades ni transferir dueños/roles por API, ni pantallas o invitaciones de colaboradores. El inventario y PATCH son endpoints de backend sin nueva UI.
- Cambio de seguridad visible solo en casos fuera del flujo público válido: ya no se aceptan consultas a propiedades no publicadas; el historial del huésped conserva la entrada pero usa el fallback existente si su propiedad dejó de publicarse.
- No se consultó con éxito Neon ni se ejecutó/ensayó SQL en PostgreSQL desde aquí. Es necesario el ensayo local indicado antes de aplicación.
- Fuera de alcance: endpoint de login admin antiguo que todavía emite admin_session (ya no aceptada para gestionar recursos), idioma del backend de consultas/correos y duplicación de eventos iCal existente. No se cambian en esta fase.
