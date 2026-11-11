-- T-4767 · El dueño (COLLABORATOR) administra sus propios referidores.
-- PROPUESTA NO EJECUTADA. Requiere scripts/sql/referral-program.sql y referral-collaborator-permission.sql ya aplicados.
-- Orden: Respaldo → verificar → QA → main (con restore point) → deploy del código.
-- ⚠️ El código nuevo lee "Partner"."ownerId": sin este SQL falla TODO /panel para el COLLABORATOR
--    (el menú consulta collaboratorPartner) y /panel/referidos + /api/panel/partners* para todos. /mi-cuenta no lo lee.
-- Aditivo: los Partner existentes quedan con ownerId NULL (altas del ADMIN; solo los ve el ADMIN).
-- No toca usuarios, roles, enlaces ni reservas.
BEGIN;

ALTER TABLE "Partner"
  ADD COLUMN "ownerId" text REFERENCES "User"("id") ON DELETE RESTRICT;
CREATE INDEX "Partner_ownerId_idx" ON "Partner" ("ownerId");

COMMIT;

-- Verificación posterior (solo lectura):
-- SELECT column_name, is_nullable FROM information_schema.columns
--   WHERE table_name = 'Partner' AND column_name = 'ownerId';          -- 1 fila, YES
-- SELECT count(*) FROM "Partner" WHERE "ownerId" IS NOT NULL;         -- 0 justo después de aplicar
-- SELECT indexname FROM pg_indexes WHERE indexname = 'Partner_ownerId_idx';  -- 1 fila
--
-- Opcional, SOLO si el negocio lo decide (no forma parte de esta tarea): pasar al dueño un referidor
-- que hoy creó el ADMIN. Revisar antes el id del dueño (propietario@delcanto.mx) y del partner.
-- UPDATE "Partner" SET "ownerId" = '<ID_DEL_DUEÑO>', "updatedAt" = now() WHERE "id" = '<ID_PARTNER>' AND "ownerId" IS NULL;
--
-- Reversa (solo en Respaldo):
-- BEGIN;
-- DROP INDEX "Partner_ownerId_idx";
-- ALTER TABLE "Partner" DROP COLUMN "ownerId";
-- COMMIT;
