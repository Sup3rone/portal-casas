-- PROPUESTA aprobada: Emma aplica en Respaldo y luego main, con restore point.
-- No ejecutar desde la app. Amplía únicamente el CHECK; conserva filas existentes.
BEGIN;
ALTER TABLE "SiteContent" DROP CONSTRAINT "SiteContent_key_check";
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_key_check" CHECK (
  "key" IN ('about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook', 'featured_property_id')
);
COMMIT;
