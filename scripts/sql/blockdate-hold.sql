-- T-5209 — «Apartar» del vendedor: el bloqueo de fechas queda ligado a su consulta, y dos bloqueos de la
-- misma casa no pueden traslaparse (la carrera de dos vendedores la gana solo uno, también en paralelo).
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- No modifica filas.

-- 0) ANTES (solo lectura): debe devolver 0 filas; si hay bloqueos traslapados, el paso 2 falla y hay que resolverlos.
-- SELECT a."id", b."id", a."propertyId", a."startDate", a."endDate", b."startDate", b."endDate"
--   FROM "BlockDate" a JOIN "BlockDate" b ON a."propertyId" = b."propertyId" AND a."id" < b."id"
--    AND a."startDate" < b."endDate" AND a."endDate" > b."startDate";

BEGIN;
-- 1) La consulta que originó el bloqueo (sin FK, como Booking.referralMessageId: las consultas se pueden borrar).
ALTER TABLE "BlockDate" ADD COLUMN IF NOT EXISTS "messageId" text;
CREATE INDEX IF NOT EXISTS "BlockDate_messageId_idx" ON "BlockDate" ("messageId") WHERE "messageId" IS NOT NULL;
-- 2) Sin traslapes entre bloqueos de la misma casa: [startDate, endDate), la noche de salida no ocupa.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "BlockDate" DROP CONSTRAINT IF EXISTS "BlockDate_no_overlap";
ALTER TABLE "BlockDate" ADD CONSTRAINT "BlockDate_no_overlap"
  EXCLUDE USING gist ("propertyId" WITH =, daterange("startDate", "endDate", '[)') WITH &&);
COMMIT;

-- Verificación (solo lectura):
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'BlockDate' AND column_name = 'messageId';
-- SELECT conname FROM pg_constraint WHERE conname = 'BlockDate_no_overlap';
-- SELECT extname FROM pg_extension WHERE extname = 'btree_gist';

-- Rollback (solo si el código que la usa NO está desplegado):
-- BEGIN;
-- ALTER TABLE "BlockDate" DROP CONSTRAINT IF EXISTS "BlockDate_no_overlap";
-- DROP INDEX IF EXISTS "BlockDate_messageId_idx";
-- ALTER TABLE "BlockDate" DROP COLUMN IF EXISTS "messageId";
-- COMMIT;
-- (btree_gist puede quedarse: no afecta a nada más.)
