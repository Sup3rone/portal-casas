-- PROPUESTA: Emma aplica manualmente en Respaldo y luego main, con restore point.
-- Convención no idempotente; no ejecutar dos veces. No modifica datos existentes.
BEGIN;
CREATE TABLE "SiteContent" (
  "key" text PRIMARY KEY,
  "value" text NOT NULL DEFAULT '',
  CONSTRAINT "SiteContent_key_check" CHECK (
    "key" IN ('about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook')
  )
);
COMMIT;
