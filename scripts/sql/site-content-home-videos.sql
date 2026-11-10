-- T-4679 — Lista de videos del hero de la home.
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- No fue ejecutado por el agente.
-- Solo amplía el CHECK de claves permitidas con 'home_background_videos'.
-- No modifica filas: 'home_background_video' (video anterior) queda intacta.
BEGIN;
ALTER TABLE "SiteContent" DROP CONSTRAINT IF EXISTS "SiteContent_key_check";
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_key_check" CHECK (
  "key" IN ('about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook',
    'featured_property_id', 'contact_whatsapp', 'home_background_video', 'listing_background_image',
    'about_title_es', 'about_title_en', 'about_title_fr', 'about_image', 'home_background_videos')
);
COMMIT;

-- Verificación (solo lectura):
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'SiteContent_key_check';
-- SELECT key, left(value, 120) FROM "SiteContent" WHERE key LIKE 'home_background_video%';
