-- PROPUESTA aprobada: Emma aplica manualmente en Respaldo y luego main.
-- Amplía solo el CHECK; no crea columnas/tablas ni modifica las filas existentes.
BEGIN;
ALTER TABLE "SiteContent" DROP CONSTRAINT "SiteContent_key_check";
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_key_check" CHECK (
  "key" IN ('about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook', 'featured_property_id', 'contact_whatsapp')
);
COMMIT;
