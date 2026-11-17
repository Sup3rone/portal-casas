-- T-4944: textos e imágenes de /nosotros y /unete editables desde Panel → Contenido → Páginas.
-- Dos claves nuevas en SiteContent, cada una con un JSON ({ texts: { es, en, fr }, images }).
-- Propuesta: aplicar a mano en la rama Neon Respaldo, verificar y luego en main, ANTES del deploy.
-- Sin este SQL, guardar en «Páginas» responde «falta aplicar el SQL» y las páginas siguen con sus textos por defecto.
BEGIN;
ALTER TABLE "SiteContent" DROP CONSTRAINT IF EXISTS "SiteContent_key_check";
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_key_check" CHECK (
  "key" IN ('about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook',
    'featured_property_id', 'contact_whatsapp', 'home_background_video', 'listing_background_image',
    'about_title_es', 'about_title_en', 'about_title_fr', 'about_image', 'home_background_videos',
    'page_about', 'page_join')
);
COMMIT;

-- Verificación (debe listar page_about y page_join):
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'SiteContent_key_check';
