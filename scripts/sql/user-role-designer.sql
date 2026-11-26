-- T-5322: rol DESIGNER (diseñador) — edita solo Panel → Contenido.
-- PROPUESTA NO EJECUTADA: Emma aplica manualmente primero en Respaldo,
-- verifica y después repite en main con un restore point.
--
-- ALTER TYPE ... ADD VALUE no se envuelve en BEGIN/COMMIT: el valor nuevo
-- no puede usarse dentro de la misma transacción que lo crea.
-- Es idempotente (IF NOT EXISTS) y no cambia el rol de nadie.
-- Desplegar el código ANTES o DESPUÉS da igual: sin el valor, nadie puede
-- tener el rol y asignarlo desde Usuarios falla con 500 (no se escribe nada).

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DESIGNER';

-- AdminUserAudit."previousRole"/"newRole" son text sin CHECK: no hace falta tocarlos.

-- Verificación posterior:
-- SELECT unnest(enum_range(NULL::"UserRole"));   -- debe incluir DESIGNER
-- Desde /panel/usuarios/<id> de un cliente: «Hacer diseñador» → rol Diseñador.
-- Con esa cuenta: entra a /panel/contenido y guarda; /panel/usuarios, /panel,
-- /panel/reservas y /admin/* lo sacan (Contenido o login).
