-- T-4783 · Confirmación de correo al registrarse.
-- PROPUESTA NO EJECUTADA. Orden: Respaldo → verificar → QA → main (con restore point) → deploy del código.
-- ⚠️ El código nuevo escribe en "EmailVerificationToken" al registrarse y al reenviar: sin esta tabla el
--    registro SIGUE funcionando (el error se registra y Mi cuenta ofrece «Reenviar»), pero no llega correo
--    y /confirmar-correo da 500 al consultar la tabla.
-- Aditivo: no toca "PasswordResetToken". Desde T-4783 esa tabla guarda el SHA-256 del token en la misma
--    columna "token"; los enlaces de recuperación emitidos antes del deploy dejan de servir (duraban 1 hora).
BEGIN;

CREATE TABLE "EmailVerificationToken" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" text NOT NULL UNIQUE,
  "expiresAt" timestamp with time zone NOT NULL,
  "usedAt" timestamp with time zone,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken" ("userId");

COMMIT;

-- Opcional, decidido con el dueño (T-4783): las cuentas que ya existen se dan por confirmadas en su
-- fecha de alta, para que no vean el aviso «Confirma tu correo». Correr en el MISMO momento que el SQL de
-- arriba (antes de abrir el registro con el código nuevo), o se marcarían también altas nuevas sin confirmar.
-- BEGIN;
-- UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;
-- COMMIT;

-- Verificación posterior (solo lectura):
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'EmailVerificationToken' ORDER BY ordinal_position;   -- 6 filas
-- SELECT indexname FROM pg_indexes WHERE tablename = 'EmailVerificationToken'; -- pkey, tokenHash_key, userId_idx
-- SELECT count(*) FROM "User" WHERE "emailVerifiedAt" IS NULL;               -- 0 si se aplicó el backfill
--
-- Reversa (solo en Respaldo):
-- BEGIN;
-- DROP TABLE "EmailVerificationToken";
-- COMMIT;
-- (El backfill no se revierte: no hay forma de distinguir después quién confirmó de verdad.)
