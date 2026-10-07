-- B2b-3: Emma aplica manualmente en Respaldo y luego main, antes del deploy.
-- Sin cambios a filas existentes: NULL conserva el fallback de categoría.
BEGIN;
ALTER TABLE "PropertySection" ADD COLUMN "photoMediaIds" jsonb;
ALTER TABLE "PropertySection" ADD CONSTRAINT "PropertySection_photos_check"
  CHECK ("photoMediaIds" IS NULL OR
    CASE WHEN jsonb_typeof("photoMediaIds") = 'array'
      THEN jsonb_array_length("photoMediaIds") <= 2 ELSE false END);
COMMIT;
-- Los ids, PHOTO, dueño, duplicados y orden se validan en el servidor.
