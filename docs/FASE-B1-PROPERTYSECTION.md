# Fase B1 — Capa de datos PropertySection

Estado: completada en código. Migración PENDIENTE de aplicación manual por Emma
en Neon Respaldo y posteriormente en main. No se ejecutó ninguna operación de BD.
Sin UI, endpoints nuevos, mutaciones ni cambios en la página de detalle.

## Modelo y exportación

`packages/db/src/schema.ts` exporta `propertySections`, con nombre SQL
`PropertySection`. `packages/db/src/index.ts` ya usa `export * from './schema'`:
la tabla queda exportada por el paquete sin modificar ese archivo.

- PK compuesta propertyId/section, con CHECK de cuatro códigos.
- Descripciones es/en/fr y heroMediaId nullable, sin backfill ni defaults editoriales.
- FK propertyId→Property.id con ON DELETE CASCADE.
- FK heroMediaId/propertyId→Media.id/propertyId con ON DELETE NO ACTION.
- Media incorpora UNIQUE(id, propertyId) para soportar esa FK compuesta.
- El hero debe pertenecer a la **misma propiedad**. NULL permite una sección todavía
  sin hero. La FK no exige type=PHOTO ni coincidencia de category: validación futura.
- Si se intenta borrar una Media que es hero, NO ACTION lo impide; primero se debe
  cambiar/quitar el vínculo. No se cambian categorías existentes.

## Lectura backend

El detalle carga Property, Media, Booking y SeasonRate directamente en
`apps/web/src/app/[locale]/casas/[slug]/page.tsx`; no hay un endpoint/data-function
compartido que cargue ese detalle con sus relaciones. `panel-server.ts` y
`panel-resources.ts` son cargadores privados del panel, no del detalle público.
Por la condición del alcance, **no se añadieron lecturas** ni se modificó la página.
Las secciones vacías no alteran el detalle actual; su consumo queda para otra fase.

## SQL final

Archivo ejecutable: `scripts/sql/property-section.sql`.
Se sigue `admin-user-audit.sql`: BEGIN/COMMIT, sin IF NOT EXISTS. **No idempotente**;
ejecutar una sola vez. Si ya existe tabla/constraint, parar y revisar su definición,
no borrar ni ignorar el error automáticamente. No se usa db:push.

```sql
BEGIN;

ALTER TABLE "Media"
  ADD CONSTRAINT "Media_id_propertyId_unique" UNIQUE ("id", "propertyId");

CREATE TABLE "PropertySection" (
  "propertyId" text NOT NULL,
  "section" varchar(20) NOT NULL,
  "descriptionEs" text,
  "descriptionEn" text,
  "descriptionFr" text,
  "heroMediaId" text,
  PRIMARY KEY ("propertyId", "section"),
  CONSTRAINT "PropertySection_section_check"
    CHECK ("section" IN ('destino', 'amenidades', 'habitaciones', 'lugar')),
  CONSTRAINT "PropertySection_property_fk"
    FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE,
  CONSTRAINT "PropertySection_hero_property_fk"
    FOREIGN KEY ("heroMediaId", "propertyId") REFERENCES "Media" ("id", "propertyId")
    ON DELETE NO ACTION
);

COMMIT;
```

## Pasos manuales de Emma — Respaldo

1. Confirmar en Neon que el branch seleccionado es **Respaldo**; confirmar que
   DATABASE_URL de la app usa ese endpoint. No deducir el branch por el hostname.
2. Crear restore point o respaldo antes de la migración. Comprobar que existen
   Property y Media con los campos del schema. Verificar si B1 ya fue aplicada:

```sql
SELECT to_regclass('public."PropertySection"') AS tabla;
SELECT conname, pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = '"Media"'::regclass
  AND conname = 'Media_id_propertyId_unique';
```

3. Si no está aplicada, ejecutar el script completo en una misma sesión. Con psql:
   `psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/property-section.sql`
   desde la raíz, usando solo la URL de Respaldo. Alternativamente, pegar todo
   el script en el SQL Editor del branch correcto.
4. Verificar tabla vacía y constraints:

```sql
SELECT COUNT(*) FROM "PropertySection";
SELECT conname, pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = '"PropertySection"'::regclass
ORDER BY conname;
```

5. Con la tabla vacía, `pnpm dev`: abrir un detalle publicado, calendario,
   formulario y galería. Deben funcionar igual; la página no consulta la nueva tabla.
6. Elegir una propiedad de prueba y reemplazar el ID; confirmar que no tenga ya
   esa sección. Insertar una fila para probar lectura desde el paquete:

```sql
INSERT INTO "PropertySection"
  ("propertyId", "section", "descriptionEs", "descriptionEn", "descriptionFr", "heroMediaId")
VALUES
  ('<ID_PROPIEDAD_PRUEBA>', 'destino', 'Prueba B1', 'B1 test', 'Test B1', NULL)
RETURNING *;

SELECT * FROM "PropertySection"
WHERE "propertyId" = '<ID_PROPIEDAD_PRUEBA>';
```

7. Desde la raíz, con `apps/web/.env.local` configurado localmente para Respaldo,
   comprobar el SELECT de Drizzle sin añadir un endpoint a la app:

```powershell
pnpm --filter @portal/db exec tsx --env-file=../../apps/web/.env.local -e 'import { db, propertySections } from "./src/index.ts"; void db.select().from(propertySections).limit(5).then(console.log);'
```

La ruta del env es un ejemplo: ajustar si el archivo local se encuentra en otro
lugar. No compartir credenciales ni ejecutar este comando contra main en la prueba.
El comando no se ejecutó aquí. Abrir el detalle con pnpm dev comprueba regresión,
pero por sí solo **no prueba la lectura de PropertySection**, porque aún no la consume.

8. Ensayar en Respaldo con datos de prueba: sección duplicada debe fallar por PK;
   código distinto de los cuatro permitidos debe fallar por CHECK; propertyId
   inexistente debe fallar por FK. Para el hero, usar un ID de Media de la misma
   propiedad (aceptado) y otro de una propiedad diferente (rechazado). Hacer cada
   ensayo negativo en su propia transacción y ROLLBACK tras el error.
9. Retirar únicamente la fila editorial de prueba al terminar si no debe quedar.
   No eliminar propiedades ni Media para limpiar esta prueba.

## Rollback

Si falla cualquier sentencia antes de COMMIT, la transacción revierte todos los
cambios; en una sesión que queda abortada ejecutar `ROLLBACK;`. Revisar el error
antes de repetir. No ejecutar el rollback destructivo si la migración no se aplicó.

Si ya hubo COMMIT y Emma decide revertir B1, exportar primero cualquier contenido
editorial existente y comprobar dependencias nuevas. Este rollback **borra todas
las filas de PropertySection**. Ejecutarlo solo con autorización del responsable:

```sql
BEGIN;
DROP TABLE "PropertySection";
ALTER TABLE "Media" DROP CONSTRAINT "Media_id_propertyId_unique";
COMMIT;
```

No usa CASCADE: si otra fase añadió dependencias, falla y obliga a revisarlas.
No borra Property ni Media. El schema del código seguiría declarando la tabla;
revertir también la versión de B1 o restaurar la migración antes de introducir
consumidores. La página actual sigue sin leerla.

## Secuencia posterior en main

Tras validar Respaldo, la aplicación a main sigue pendiente de ejecución manual
por Emma y autorización correspondiente. Regla: **main de Neon primero, creando
restore point antes de modificarlo; después, cualquier deploy solo con orden expresa**.
Esta fase no autoriza ni propone ejecutar un deploy ni migrar main desde aquí.

## Verificación local y supuestos

- TypeScript de apps/web comprobado sin conectar a BD.
- Metadata Drizzle revisada: PK, CHECK, columnas nullable, UNIQUE y ambas FKs.
- SQL no ensayado en PostgreSQL: esa validación pertenece a los pasos manuales.
- Se supone schema SQL public, como el modelo y los scripts existentes.
- No se exige contenido ni cuatro filas al crear una propiedad; serán reglas
  editoriales de una fase posterior. No se añade validación de PHOTO aquí.
