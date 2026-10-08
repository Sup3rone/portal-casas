# Biblioteca y portada independientes

Implementado en código, SQL PENDIENTE de aplicación manual por Emma. Sin conexiones/escrituras Neon ni deploy desde esta tarea.

## Modelo y criterio

Media conserva category y order para la biblioteca, galerías y presentación editorial. Añade isCover (boolean NOT NULL DEFAULT false) y coverOrder (integer nullable, posiciones 0–4). Se usa un orden independiente porque reutilizar order modificaría también el detalle; reservar category=COVER sacaría las fotos de sus categorías existentes. No se duplican archivos ni URLs.

La card /casas muestra solo PHOTO seleccionadas, hasta cinco, por coverOrder/id, como mosaico dentro de su tamaño actual. Con una sola foto conserva la imagen única. Sin selección usa exclusivamente la primera PHOTO por order/id, sin prioridad de categoría; sin fotos conserva placeholder. El backfill mantiene el criterio anterior (principal/order/id) como selección explícita inicial, para no cambiar las portadas existentes al migrar.

Biblioteca: ResourceEditor conserva subida C1, URL manual, eliminación, categoría y orden. Portada: CoverEditor aparece inmediatamente después de Imágenes, integrado en ResourceEditor, con miniaturas, selección de máximo cinco y botones Subir/Bajar; no sube archivos. Vaciar la selección activa fallback. Editar la URL de una foto seleccionada actualiza su portada; borrar una foto la elimina de la selección, y borrar la última activa fallback. Orden/categoría de biblioteca no alteran portada explícita.

## API

GET y PUT `/api/properties/[id]/cover`: requirePropertyManager y managedProperty; ADMIN cualquiera, COLLABORATOR propia, ajena 404, CLIENT/VIEWER 403, anónimo 401. GET devuelve mediaIds ordenados; PUT recibe exclusivamente `{ "mediaIds": ["id1", "id2"] }`, reemplaza toda la selección en un solo UPDATE y devuelve success/mediaIds. IDs únicos, hasta cinco, PHOTO de la misma propiedad. 400 INVALID_COVER_SELECTION o INVALID_COVER_PHOTO; códigos de acceso siguen sectionError existente. Dueño/PHOTO se revalidan dentro del UPDATE. Selección vacía válida.

La validación del máximo global de cinco es del API; el CHECK SQL valida cada fila (PHOTO, posición 0–4, null si no es portada). No crear selecciones mediante SQL directo sin comprobar límite y posiciones únicas. El listado limita defensivamente a cinco. No altera endpoints ni lógica de permisos existentes. Mutaciones de Media revalidan también /casas para reflejar URL/eliminación/fallback.

## SQL pendiente

Script completo: `scripts/sql/media-cover.sql`, transaccional, no idempotente siguiendo la convención del repo. Añade columnas, marca la PHOTO actual de cada propiedad con row_number y agrega CHECK. No modifica category/order ni crea Media. Propiedades sin PHOTO no se marcan. El rollback comentado elimina exclusivamente campos/constraint de portada y pierde sus selecciones; requiere volver al código anterior.

Emma debe aplicar primero en Respaldo y verificar el código allí. Después crear restore point en main, aplicar manualmente el SQL en main ANTES de desplegar este código, y desplegar solo con autorización. El código necesita ambas columnas: sin SQL, consultas de Media fallarán. No repetir el backfill después de que usuarios hayan elegido portadas.

Comprobaciones manuales tras SQL:

```sql
SELECT "propertyId", count(*) FROM "Media" WHERE "isCover"
GROUP BY "propertyId" HAVING count(*) > 5;
SELECT "propertyId", "coverOrder", count(*) FROM "Media" WHERE "isCover"
GROUP BY "propertyId", "coverOrder" HAVING count(*) > 1;
SELECT id, "propertyId", url, category, "order", "isCover", "coverOrder"
FROM "Media" ORDER BY "propertyId", "coverOrder", "order", id;
```

Las dos primeras consultas deben quedar vacías. Revisar que cada propiedad con PHOTO conserve su portada anterior.

## Cómo probar

```powershell
pnpm dev
node scripts/test-listing-cover.cjs
pnpm lint
# Desde apps/web:
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

1. Tras aplicar SQL en Respaldo, entrar como dueño y abrir el editor de una propiedad (para nueva, crear primero y continuar en su editor).
2. Subir más de cinco fotos en Imágenes; comprobar que conserva edición URL, categorías y orden. La colección completa del detalle no cambia.
3. En Portada elegir cinco fotos de distintas categorías, moverlas y guardar. La sexta selección debe estar deshabilitada; desmarcar una permite otra.
4. Abrir /casas: solo esas cinco aparecen en ese orden. Guardar otro orden y comprobarlo. Volver al detalle y verificar galería/lightbox y secciones existentes, sin filtros nuevos.
5. Cambiar category/order en biblioteca: portada explícita conserva su orden. Cambiar URL o quitar una seleccionada: verificar actualización del listado. Vaciar portada: verificar una sola PHOTO por order/id. Sin fotos: placeholder.
6. COLLABORATOR sobre ajena por URL/API: 404; CLIENT/VIEWER: 403 API; ADMIN sobre cualquiera: permitido. PUT con seis IDs, repetido, ajeno o VIDEO: 400.
7. Repetir en es/en/fr y 360/1440px, ambos temas. QA visual con BD real pendiente de Emma.

Pruebas offline: backfill en SQLite (no DDL PostgreSQL), 80+ fotos, API real/ownership/validación/reordenado/fallback, biblioteca intacta, render de selector y mosaico en tres idiomas, handlers de selección/límite/movimiento. Regresiones panel/render/uploader también verificadas. No sustituyen ensayo de migración en PostgreSQL.

Supuestos: mosaico estático de hasta cinco fotos dentro de la card, sin carrusel nuevo; orden de portada independiente de biblioteca; selección vacía permitida para activar fallback. No se toca detalle, editor editorial, reserva ni subida C1.
