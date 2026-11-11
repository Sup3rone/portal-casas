-- T-4736 · Programa de referidos (colaboradores / partners).
-- PROPUESTA NO EJECUTADA. La aplica una persona, en este orden:
--   1. Rama Neon «Respaldo»: correr este archivo completo y la verificación de abajo.
--   2. QA (preview de Vercel apuntando a Respaldo): checklist humana del PR
--      (link ?ref= → consulta → confirmar reserva → atribución visible en /panel/referidos).
--   3. main/producción: restore point en Neon, correr el archivo y repetir la verificación.
--   4. SOLO DESPUÉS desplegar el código de la rama alia/T-4736_referidos.
--      ⚠️ El código nuevo escribe "referredByPartnerId"/"referralLinkId" en Message y Booking:
--      si se despliega antes de este SQL, fallan las consultas y las reservas.
--   5. Después aplicar también scripts/sql/referral-collaborator-permission.sql (mismo orden).
--      ✅ Este archivo ya se aplicó en Respaldo el 10-11-2026 (verificado por lectura).
--
-- Nada se borra: los FKs son RESTRICT y el panel solo desactiva ("active" = false).
-- Todo es aditivo y nullable: consultas y reservas existentes quedan con NULL (sin atribución).
BEGIN;

CREATE TABLE "Partner" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "commissionPercent" numeric(5,2) NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "Partner_name_check" CHECK (btrim("name") <> ''),
  CONSTRAINT "Partner_commission_check" CHECK ("commissionPercent" >= 0 AND "commissionPercent" <= 100)
);

-- "propertyId" NULL = enlace general (home); con valor = enlace a esa ficha.
CREATE TABLE "ReferralLink" (
  "id" text PRIMARY KEY,
  "partnerId" text NOT NULL REFERENCES "Partner"("id") ON DELETE RESTRICT,
  "propertyId" text REFERENCES "Property"("id") ON DELETE RESTRICT,
  "code" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "ReferralLink_code_unique" UNIQUE ("code"),
  -- Mismo formato que normalizeReferralCode() en apps/web/src/lib/referral.ts.
  CONSTRAINT "ReferralLink_code_check" CHECK ("code" ~ '^[A-Z0-9-]{4,32}$')
);
CREATE INDEX "ReferralLink_partnerId_idx" ON "ReferralLink" ("partnerId");
CREATE INDEX "ReferralLink_propertyId_idx" ON "ReferralLink" ("propertyId");

-- La consulta pública (Message) es lo que crea el visitante: ahí se lee la cookie.
ALTER TABLE "Message"
  ADD COLUMN "referredByPartnerId" text REFERENCES "Partner"("id") ON DELETE RESTRICT,
  ADD COLUMN "referralLinkId" text REFERENCES "ReferralLink"("id") ON DELETE RESTRICT;
CREATE INDEX "Message_referredByPartnerId_idx" ON "Message" ("referredByPartnerId");

-- La reserva la crea el gestor desde la consulta y copia su atribución.
-- "referralMessageId": de qué consulta salió (sin FK porque las consultas se pueden borrar desde el panel);
--   el índice único parcial garantiza que una consulta atribuya como mucho UNA reserva.
-- "commissionPercent": % congelado al confirmar; editar al colaborador no cambia lo ya atribuido.
ALTER TABLE "Booking"
  ADD COLUMN "referredByPartnerId" text REFERENCES "Partner"("id") ON DELETE RESTRICT,
  ADD COLUMN "referralLinkId" text REFERENCES "ReferralLink"("id") ON DELETE RESTRICT,
  ADD COLUMN "referralMessageId" text,
  ADD COLUMN "commissionPercent" numeric(5,2);
CREATE INDEX "Booking_referredByPartnerId_idx" ON "Booking" ("referredByPartnerId");
CREATE UNIQUE INDEX "Booking_referralMessageId_unique" ON "Booking" ("referralMessageId") WHERE "referralMessageId" IS NOT NULL;

COMMIT;

-- Verificación posterior (solo lectura):
-- SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns
--   WHERE table_name IN ('Partner', 'ReferralLink') OR column_name IN ('referredByPartnerId', 'referralLinkId', 'referralMessageId', 'commissionPercent')
--   ORDER BY table_name, ordinal_position;
-- SELECT count(*) FROM "Booking" WHERE "referredByPartnerId" IS NOT NULL;  -- 0 justo después de aplicar
-- SELECT indexname FROM pg_indexes WHERE indexname = 'Booking_referralMessageId_unique';  -- 1 fila
-- Prueba de restricción (debe fallar con 23514): INSERT INTO "ReferralLink" ("id","partnerId","code") VALUES ('x','x','a b');
--
-- Reversa (solo en Respaldo, si hiciera falta repetir el ensayo):
-- BEGIN;
-- ALTER TABLE "Booking" DROP COLUMN "commissionPercent", DROP COLUMN "referralMessageId", DROP COLUMN "referralLinkId", DROP COLUMN "referredByPartnerId";
-- ALTER TABLE "Message" DROP COLUMN "referralLinkId", DROP COLUMN "referredByPartnerId";
-- DROP TABLE "ReferralLink"; DROP TABLE "Partner";
-- COMMIT;
