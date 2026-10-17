-- PROPUESTA: NO ejecutada por el agente.
-- Emma: ejecutar primero en la branch Respaldo de Neon, verificar en el panel
-- las tres opciones, guardar correo válido/vacío y comprobar omisión iCal anual.
-- Solo después de verificar, ejecutar el mismo SQL en main antes del despliegue.
-- No cambia ninguna modalidad existente; conserva default 'nocturna'.
BEGIN;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "contactEmail" text;
ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_rentalType_check";
ALTER TABLE "Property" ADD CONSTRAINT "Property_rentalType_check"
  CHECK ("rentalType" IN ('nocturna', 'anual', 'ambas'));
COMMIT;

-- Verificación de solo lectura, después de aplicar:
-- SELECT "rentalType", count(*) FROM "Property" GROUP BY "rentalType";
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
-- WHERE table_name = 'Property' AND column_name = 'contactEmail';
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conname = 'Property_rentalType_check';
