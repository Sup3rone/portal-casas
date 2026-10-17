-- PROPUESTA, NO ejecutada. Emma: Respaldo primero, después main.
-- Aplicar antes de guardar Contenido del sitio con el editor nuevo.
-- Sin columnas ni tablas nuevas; conserva las nueve claves anteriores.
BEGIN;
ALTER TABLE "SiteContent" DROP CONSTRAINT "SiteContent_key_check";
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_key_check" CHECK (
  "key" IN ('about_es', 'about_en', 'about_fr', 'social_instagram',
    'social_facebook', 'featured_property_id', 'contact_whatsapp',
    'home_background_video', 'listing_background_image',
    'about_title_es', 'about_title_en', 'about_title_fr', 'about_image')
);
COMMIT;
