-- T-5206 — Precio de limpieza por casa (MXN, entero >= 0). NULL = «por confirmar».
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- No modifica filas: todas las casas quedan en NULL hasta que su dueño lo capture.
BEGIN;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "cleaningPrice" integer;
ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_cleaningPrice_check";
ALTER TABLE "Property" ADD CONSTRAINT "Property_cleaningPrice_check"
  CHECK ("cleaningPrice" IS NULL OR "cleaningPrice" >= 0);
COMMIT;

-- Verificación (solo lectura):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Property' AND column_name = 'cleaningPrice';
-- SELECT conname FROM pg_constraint WHERE conname = 'Property_cleaningPrice_check';
-- SELECT count(*) FILTER (WHERE "cleaningPrice" IS NOT NULL) AS con_limpieza, count(*) AS casas FROM "Property";

-- Rollback (solo si el código que la usa NO está desplegado):
-- BEGIN;
-- ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_cleaningPrice_check";
-- ALTER TABLE "Property" DROP COLUMN IF EXISTS "cleaningPrice";
-- COMMIT;
