-- T-5324 — Tema por temporada (clave 'site_season' en SiteContent).
-- PROPUESTA NO EJECUTADA por el agente: aplicar MANUALMENTE en Respaldo, verificar, y después en main.
-- Solo amplía el CHECK de claves permitidas con 'site_season'. No modifica filas.
-- Sin este SQL el sitio funciona igual (tema «normal»); solo el selector responde «falta el SQL».
-- Lista tomada del CHECK vigente en Respaldo el 25-11-2026 (incluye page_about/page_join de T-4944).
BEGIN;
ALTER TABLE "SiteContent" DROP CONSTRAINT IF EXISTS "SiteContent_key_check";
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_key_check" CHECK (
  "key" IN ('about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook',
    'featured_property_id', 'contact_whatsapp', 'home_background_video', 'listing_background_image',
    'about_title_es', 'about_title_en', 'about_title_fr', 'about_image', 'home_background_videos',
    'page_about', 'page_join', 'site_season')
);
COMMIT;

-- Verificación (solo lectura):
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'SiteContent_key_check';
-- SELECT key, value FROM "SiteContent" WHERE key = 'site_season';   -- vacío hasta que alguien elija un tema
