-- T-4736 (2.ª parte) · Permiso para que un COLLABORATOR cree sus propios enlaces de referido.
-- PROPUESTA NO EJECUTADA. Requiere scripts/sql/referral-program.sql ya aplicado.
-- Orden: Respaldo → verificar → QA → main (con restore point) → deploy del código.
-- ⚠️ El código nuevo lee "Partner"."userId" y "User"."canCreateReferralLinks": sin este SQL
--    fallan /panel (menú), /panel/referidos, /panel/usuarios y los cambios de rol.
-- Aditivo: todos los usuarios quedan sin permiso y los Partner existentes sin usuario ligado.
BEGIN;

ALTER TABLE "User"
  ADD COLUMN "canCreateReferralLinks" boolean NOT NULL DEFAULT false;

-- Usuario COLLABORATOR ligado (se crea al conceder el permiso); null = colaborador externo sin cuenta.
ALTER TABLE "Partner"
  ADD COLUMN "userId" text REFERENCES "User"("id") ON DELETE RESTRICT;
ALTER TABLE "Partner"
  ADD CONSTRAINT "Partner_userId_unique" UNIQUE ("userId");

-- Auditoría del permiso (mismo patrón que PUBLICATION_PERMISSION).
ALTER TABLE "AdminUserAudit"
  DROP CONSTRAINT IF EXISTS "AdminUserAudit_action_check";
ALTER TABLE "AdminUserAudit"
  ADD CONSTRAINT "AdminUserAudit_action_check"
  CHECK ("action" IN ('ROLE_CHANGE', 'PASSWORD_RESET', 'PUBLICATION_PERMISSION', 'REFERRAL_PERMISSION'));

COMMIT;

-- Verificación posterior (solo lectura):
-- SELECT column_name FROM information_schema.columns
--   WHERE (table_name = 'User' AND column_name = 'canCreateReferralLinks') OR (table_name = 'Partner' AND column_name = 'userId');  -- 2 filas
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'AdminUserAudit_action_check';  -- incluye REFERRAL_PERMISSION
-- SELECT count(*) FROM "User" WHERE "canCreateReferralLinks";  -- 0 justo después de aplicar
--
-- Reversa (solo en Respaldo):
-- BEGIN;
-- ALTER TABLE "Partner" DROP CONSTRAINT "Partner_userId_unique", DROP COLUMN "userId";
-- ALTER TABLE "User" DROP COLUMN "canCreateReferralLinks";
-- ALTER TABLE "AdminUserAudit" DROP CONSTRAINT "AdminUserAudit_action_check";
-- ALTER TABLE "AdminUserAudit" ADD CONSTRAINT "AdminUserAudit_action_check"
--   CHECK ("action" IN ('ROLE_CHANGE', 'PASSWORD_RESET', 'PUBLICATION_PERMISSION'));
-- COMMIT;
