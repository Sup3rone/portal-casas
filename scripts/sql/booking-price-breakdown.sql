-- T-4738 · Desglose de precio por reserva (para facturar): renta, aseo e impuestos.
-- PROPUESTA NO EJECUTADA. Requiere referral-program.sql (T-4736) ya aplicado:
-- el snapshot del % del colaborador YA existe como "Booking"."commissionPercent" y no se toca aquí.
--
-- Orden (lo aplica una persona):
--   1. Rama Neon «Respaldo»: correr este archivo y la verificación de abajo.
--   2. QA (local o preview contra Respaldo): checklist del PR (editar desglose en /panel/reservas/[id],
--      calcular a mano una comisión y comparar).
--   3. main/producción: restore point, correr el archivo, repetir verificación.
--   4. SOLO DESPUÉS desplegar la rama alia/T-4738_desglose-reserva.
--      ⚠️ Sin este SQL NO solo falla /panel/reservas/[id]: Drizzle incluye todas las columnas del schema en
--      cada INSERT de "Booking" (rellena con DEFAULT), así que fallarían también el sync iCal, los bloqueos
--      y cualquier alta de reserva. Aplicar SIEMPRE antes del deploy.
--
-- Todo es aditivo y NULLABLE: las reservas existentes quedan con NULL (sin desglose), sin cálculo retroactivo.
-- numeric(12,2): hasta 9,999,999,999.99 MXN, centavos exactos (sin flotantes).
BEGIN;

ALTER TABLE "Booking"
  ADD COLUMN "rentAmount" numeric(12,2),
  ADD COLUMN "cleaningCost" numeric(12,2),
  ADD COLUMN "taxes" numeric(12,2);

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_rentAmount_check" CHECK ("rentAmount" IS NULL OR "rentAmount" >= 0),
  ADD CONSTRAINT "Booking_cleaningCost_check" CHECK ("cleaningCost" IS NULL OR "cleaningCost" >= 0),
  ADD CONSTRAINT "Booking_taxes_check" CHECK ("taxes" IS NULL OR "taxes" >= 0);

COMMIT;

-- Verificación posterior (solo lectura):
-- SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable FROM information_schema.columns
--   WHERE table_name = 'Booking' AND column_name IN ('rentAmount', 'cleaningCost', 'taxes', 'commissionPercent');  -- 4 filas
-- SELECT count(*) FROM "Booking" WHERE "rentAmount" IS NOT NULL OR "cleaningCost" IS NOT NULL OR "taxes" IS NOT NULL;  -- 0 al aplicar
-- Prueba (debe fallar con 23514, dentro de una transacción con ROLLBACK):
--   BEGIN; UPDATE "Booking" SET "taxes" = -1 WHERE "id" = (SELECT "id" FROM "Booking" LIMIT 1); ROLLBACK;
--
-- Reversa (solo en Respaldo):
-- BEGIN;
-- ALTER TABLE "Booking" DROP COLUMN "taxes", DROP COLUMN "cleaningCost", DROP COLUMN "rentAmount";
-- COMMIT;
