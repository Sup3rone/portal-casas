-- PROPUESTA NO EJECUTADA: Emma aplica manualmente primero en Respaldo,
-- verifica y después repite en main con un restore point.
-- La columna queda en false para todos los usuarios existentes: un ADMIN
-- concede el permiso explícitamente desde /panel/usuarios.
BEGIN;

ALTER TABLE "User"
  ADD COLUMN "canPublishProperties" boolean NOT NULL DEFAULT false;

-- La tabla de auditoría ya existe; ampliar su CHECK para registrar el permiso.
ALTER TABLE "AdminUserAudit"
  DROP CONSTRAINT IF EXISTS "AdminUserAudit_action_check";
ALTER TABLE "AdminUserAudit"
  ADD CONSTRAINT "AdminUserAudit_action_check"
  CHECK ("action" IN ('ROLE_CHANGE', 'PASSWORD_RESET', 'PUBLICATION_PERMISSION'));

COMMIT;

-- Verificación posterior:
-- SELECT "id", "email", "role", "canPublishProperties" FROM "User" ORDER BY "email";
-- Un COLLABORATOR con false debe recibir 403 al PATCH {"published":true|false}.
-- Tras activar desde Usuarios, solo debe poder cambiar "published" de sus propias propiedades.
