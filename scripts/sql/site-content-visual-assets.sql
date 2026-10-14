-- Propuesta: Emma aplica manualmente en Respaldo y luego main, antes del deploy.
BEGIN;
ALTER TABLE "SiteContent" DROP CONSTRAINT IF EXISTS "SiteContent_key_check";
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_key_check" CHECK (
  "key" IN ('about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook',
    'featured_property_id', 'contact_whatsapp', 'home_background_video', 'listing_background_image')
);
COMMIT;
