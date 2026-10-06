-- PROPUESTA: revisión y aprobación antes de aplicar MANUALMENTE en Neon Respaldo.
-- No modifica usuarios existentes. No guarda contraseñas ni hashes.
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
-- IDs de auditoría sin FK: conservar historial aunque un usuario se elimine.
