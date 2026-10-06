# Administración de usuarios — ADMIN

## Estado y entorno

Implementado en código, sin despliegue ni operaciones contra Neon. Código en Git
main según el flujo vigente; la BD para esta tarea es exclusivamente Neon Respaldo.
El usuario confirmó el destino de la URL facilitada. No había .env.local ni en la
raíz ni en apps/web. No se guardó la credencial ni se abrió conexión a esa URL.
Antes de iniciar la app, configurar localmente DATABASE_URL para ese branch y las
variables Auth.js existentes; no usar una configuración heredada que apunte a main.

Migración de auditoría aprobada por el usuario para revisión, NO ejecutada.
Debe aplicarse manualmente en Respaldo antes de probar las mutaciones nuevas.
Si falta AdminUserAudit, el statement completo falla: no se cambia el usuario
sin registrar auditoría. No ejecutar db:push ni aplicar migraciones a main aquí.

## Rutas y permisos

| Entrada | Validación |
| --- | --- |
| /[locale]/panel/usuarios | requireAdmin mediante adminUsersPage, denegación 404 |
| /[locale]/panel/usuarios/[id] | Igual; usuario inexistente 404 |
| GET /api/panel/users | requireAdmin; filtro email/rol; 50 filas y señal de siguiente página |
| GET /api/panel/users/[id] | requireAdmin; datos sin hash y propiedades del usuario |
| PATCH /api/panel/users/[id] | requireAdmin en handler y servicio, confirmed=true obligatorio |

Las APIs devuelven 401 sin sesión, 403 a CLIENT/VIEWER/COLLABORATOR y 404 para
usuario inexistente. Las páginas rechazan desde el servidor antes de leer usuarios.
El menú añade Usuarios solo para ADMIN; los enlaces actuales del colaborador y
las APIs de ownership existentes no se alteran. /admin/* sigue intacto y convive
con /panel; su consolidación queda fuera de alcance.

PATCH role: {action:"role",role:"COLLABORATOR"|"CLIENT",confirmed:true}.
CLIENT/VIEWER pueden promoverse; COLLABORATOR puede revertirse a CLIENT.
No se permite asignar ADMIN, cambiar el propio rol ni cambiar el rol de otro ADMIN.
Los dueños y propiedades no se reasignan al revertir el rol.

PATCH password: {action:"password",confirmed:true}. Genera 18 bytes aleatorios
codificados como base64url (24 caracteres), hash bcryptjs coste 10, y devuelve la
contraseña solo en esa respuesta con Cache-Control:no-store. La UI exige confirmación
nativa y muestra el secreto solo en memoria hasta ocultarlo o abandonar la página.
No existe endpoint para recuperarlo; no se persiste en storage/BD/auditoría.
Se eligió confirmación explícita, no un rate limit distribuido, según el alcance.

Mutación y auditoría forman un único statement PostgreSQL con CTE. Revalida el rol
del actor y el rol previo del objetivo dentro del UPDATE; si cambia concurrentemente,
no modifica y responde 403. El log contiene IDs actor/objetivo, acción, roles y fecha.
No contiene contraseña ni hash. IDs sin FK para preservar el historial.

## SQL completo — aplicación manual, no ejecutado

Fuente: scripts/sql/admin-user-audit.sql. No modifica usuarios existentes.

```sql
BEGIN;
CREATE TABLE "AdminUserAudit" (
  "id" text PRIMARY KEY,
  "actorId" text NOT NULL,
  "targetUserId" text NOT NULL,
  "action" text NOT NULL CHECK ("action" IN ('ROLE_CHANGE', 'PASSWORD_RESET')),
  "previousRole" text,
  "newRole" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "AdminUserAudit_target_created_idx"
  ON "AdminUserAudit" ("targetUserId", "createdAt");
COMMIT;
```

## Inventario

| Archivo | Cambio |
| --- | --- |
| apps/web/src/lib/admin-users.ts | Lecturas sin secretos, filtros, guards y mutación auditada atómica |
| apps/web/src/app/[locale]/panel/usuarios/page.tsx | Tabla con filtros y paginación de 50 usuarios |
| apps/web/src/app/[locale]/panel/usuarios/[id]/page.tsx | Detalle, propiedades y acciones por rol |
| apps/web/src/components/panel/UserActions.tsx | Confirmaciones, acciones y visualización única del secreto |
| apps/web/src/app/api/panel/users/route.ts | API de listado exclusiva ADMIN |
| apps/web/src/app/api/panel/users/[id]/route.ts | API de detalle y mutaciones exclusivas ADMIN |
| apps/web/src/app/[locale]/panel/layout.tsx | Enlace Usuarios exclusivo ADMIN |
| packages/db/src/schema.ts | Definición de la tabla de auditoría, sin aplicación a BD |
| scripts/sql/admin-user-audit.sql | SQL propuesto para aplicación manual en Respaldo |
| apps/web/messages/es.json | Namespace adminUsers en español |
| apps/web/messages/en.json | Namespace adminUsers en inglés |
| apps/web/messages/fr.json | Namespace adminUsers en francés |
| scripts/test-admin-users.cjs | Guards/API, lecturas, bcrypt, SQL generado y SSR en memoria |
| docs/CONTEXTO.md | Convención del panel ADMIN y entorno de esta fase |
| docs/PANEL-USUARIOS.md | SQL, inventario, decisiones y pruebas |

## Pruebas

Desde la raíz: node scripts/test-admin-users.cjs, node scripts/test-panel.cjs,
node scripts/test-panel-render.cjs, node scripts/test-property-access.cjs.
TypeScript desde apps/web: node node_modules/typescript/bin/tsc --noEmit --incremental false.
No usan red ni BD real. Las lecturas y guards usan SQL SQLite en memoria. El CTE
de mutación PostgreSQL se inspecciona con PgDialect, con ejecución simulada; no
se afirma haber probado su ejecución ni rollback en PostgreSQL.

Checklist manual, después de configurar exclusivamente Neon Respaldo y aplicar SQL:

1. pnpm dev. Login ADMIN; /es/panel muestra Usuarios; filtrar por email y por cada
   rol, revisar propiedad count, fecha y paginación (más de 50 usuarios de prueba).
2. Abrir un CLIENT de prueba, cancelar promoción: ningún cambio/log. Confirmar:
   rol COLLABORATOR; iniciar sesión como ese usuario y comprobar acceso al panel.
3. Revertir ese colaborador a CLIENT; pierde gestión, propiedades conservan dueño.
4. Intentar cambiar el propio rol, otro ADMIN y asignar ADMIN por API directo: 403
   o 400 según caso, sin cambio/log. Cambiar rol de VIEWER de prueba si existe.
5. Cancelar reset: sin cambio/log. Confirmar reset de usuario de prueba; copiar
   secreto por canal seguro, ocultar: no reaparece al recargar. Login con nueva
   contraseña; la anterior falla. Sin expiración/cambio obligatorio automático.
6. Consultar manualmente el log, sin campos secretos:
   SELECT "actorId", "targetUserId", "action", "previousRole", "newRole", "createdAt"
   FROM "AdminUserAudit" ORDER BY "createdAt" DESC LIMIT 20;
7. Ensayar localmente con datos desechables un fallo del INSERT de auditoría:
   comprobar que el UPDATE se revierte. No eliminar tablas ni alterar main para esto.
8. COLLABORATOR: menú sin Usuarios; URL de listado/detalle 404; GET/PATCH APIs 403,
   aun enviando confirmed=true. Anónimo 401 APIs. Repetir con CLIENT/VIEWER.
9. Repetir UI/confirmaciones en /en y /fr. Probar regresión propia 200/ajena 404,
   creación y consultas del colaborador sin cambios.

## Supuestos y notas

- Estado significa contraseña configurada/sin contraseña: User no tiene active,
  disabled ni deletedAt. No se inventó una política de bloqueo.
- La contraseña temporal no caduca ni fuerza cambio, porque no hay ese modelo.
  El usuario puede cambiarla mediante la recuperación existente. La UI lo avisa.
- Reset no invalida JWT activos ni tokens de recuperación pendientes; limitaciones
  existentes, sin rediseñar Auth.js. ADMIN puede resetear su contraseña y la de
  otro ADMIN tras confirmar; solo los cambios de rol están restringidos así.
- No hay invitaciones ni correo automático ni reasignación/borrado de usuarios.
- Se mantienen bugs conocidos de duplicación iCal y solapamientos en bookings/create.
- El historial administrativo se conserva sin FK; no es una auditoría inmutable
  contra quien tenga acceso SQL directo a la BD.
- Pruebas en vivo y ejecución PostgreSQL pendientes de aplicación manual del SQL.
