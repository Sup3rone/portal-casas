-- PROPUESTA NO EJECUTADA. Emma: aplicar primero en Respaldo, completar QA,
-- luego aplicar en main antes de desplegar el código que lee la nueva columna.
-- NULL conserva inferencia por datos para propiedades existentes; no hay UPDATE.
-- El POST de nuevas propiedades guarda opcionales=false y reserva=true.
BEGIN;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "sectionsEnabled" jsonb;
COMMIT;
-- Verificación de solo lectura:
-- SELECT "id", "sectionsEnabled" FROM "Property" ORDER BY "id";
-- Al apagar un módulo comprobar que PropertySection y Media siguen intactos.
