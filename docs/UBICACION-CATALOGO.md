# Ubicación de propiedades: catálogo y transición

Implementación 2026-10-15. **SQL preparado, no ejecutado.** No se consultó ni modificó Neon en esta tarea. El inventario de cuatro propiedades es información aportada por Emma; el intento de lectura de la auditoría anterior falló por red.

## Campos y compatibilidad

- `city` sigue siendo texto legacy en `Property`, sin borrar ni renombrar la columna ni sus valores existentes. Deja de ser obligatorio en el formulario/API. Al crear sin texto legacy se inserta `''` para satisfacer su NOT NULL histórico; editar desde el formulario no envía ni sobreescribe ese campo.
- Nuevas columnas nullable: `state` + `destinationCity`. No se puede agregar otra columna `city` con el mismo nombre: `destinationCity` es la ciudad nueva del catálogo, equivalente al `city` del objeto conceptual aprobado.
- `PropertyDestinationValue` en `destinations.ts` tipa el par estado/destino persistido. El schema usa text nullable; la API verifica pertenencia al catálogo y la BD verifica par completo o ambos NULL. No se importa código de la aplicación desde packages/db.
- `DestinationValue` conserva el tipo conceptual anterior `{ state, city }`. No se cambian los 44 destinos ni sus denominaciones históricas.
- POST/PATCH acepta combinaciones exactas del catálogo o ambos campos null/vacíos. Un PATCH que cambia destino debe enviar los dos campos; uno solo o una pareja inválida produce 400 `INVALID_DESTINATION` y mensaje localizado. PATCH que omite ambos conserva lo guardado. Clientes antiguos pueden seguir enviando `city` legacy, pero el editor ya no ofrece ese input libre.

## Editor y visualización

`PropertyForm` muestra selects dependientes Estado → Ciudad. Cambiar estado vacía ciudad; con estado elegido, ciudad es obligatoria. Sin estado, ciudad está desactivada. Ambos vacíos significan “Sin seleccionar”, preservando el fallback legacy. Un aviso es/en/fr indica que una ciudad ausente requiere contactar al administrador; no existe alta de destinos para colaboradores. Agregar destinos sigue requiriendo editar la constante mediante commit.

`propertyLocation()` da prioridad a un par válido y devuelve `Ciudad, Estado`; sin él devuelve el texto legacy recortado, sin inferencias. Lo consumen destacadas de home, tarjeta del listado, ficha y listado de propiedades del panel. La ficha conserva dirección aparte y pasa la etiqueta nueva al compartir/mapa, sin modificar sus componentes ni coordenadas. Se retira únicamente la conversión forzada a mayúsculas de la ciudad; no cambian títulos, SEO ni filtros.

## SQL separados: instrucciones para Emma

1. Confirmar en Neon que está seleccionada la branch **Respaldo** y conservar un respaldo/restore point según el protocolo existente.
2. Ejecutar `scripts/sql/property-destinations.sql`: añade las dos columnas, CHECK de pareja y comentarios. No transforma filas. Es un ALTER de una sola aplicación: no ejecutarlo de nuevo si las columnas ya existen.
3. Revisar el SELECT final: campos nuevos NULL y `city` legacy intacto.
4. Revisar y ejecutar `scripts/sql/property-destinations-backfill.sql`. Dentro de transacción toma lock, imprime el inventario y aborta si ya no hay 2 filas Nuevo Vallarta, 1 Guadalajara, Jalisco y 1 mas aya. El lock es para una ejecución manual breve, sin tráfico de escritura concurrente.
5. Mapeo esperado: Nuevo Vallarta ×2 → `Nayarit` / `Nuevo Vallarta`; Guadalajara, Jalisco ×1 → `Jalisco` / `Guadalajara`. Solo actualiza parejas NULL/NULL y no reemplaza elecciones nuevas existentes. No usa coincidencias parciales.
6. `mas aya` no se interpreta ni se actualiza: con columnas nuevas queda NULL/NULL. El script lista su id/slug como **REVISIÓN MANUAL**. Emma debe confirmar la ubicación real y seleccionarla en el editor. Hasta entonces el fallback público continúa mostrando el legacy; no se inventa otro lugar.
7. Comprobar RETURNING/SELECT: tres filas mapeadas en la primera ejecución sobre el inventario indicado, una pendiente. Reejecutar el backfill no sobreescribe pares completos; puede devolver cero UPDATE si ya se aplicó.
8. Probar el código contra Respaldo. Solo tras validar, repetir ambos SQL en **main**, con el respaldo previo y la autorización de ejecución que gestiona Emma. Aplicar columnas en main **antes** del despliegue: select de propiedades completas con schema nuevo requiere que existan.

El backfill usa lower/btrim para los tres textos proporcionados; no es un reconciliador general de ubicaciones ni utiliza similitud. Filas adicionales con otros textos quedan fuera del UPDATE y, si no tienen par, aparecen en el listado final de pendientes.

## Checklist humana

1. Respaldo: aplicar ALTER, luego backfill; revisar los tres pares esperados y la fila `mas aya` pendiente, conservando los cuatro legacy originales.
2. Editar propiedad: aparecen Estado/Ciudad, no el input libre antiguo. Nayarit ofrece Nuevo Vallarta; cambiar a Jalisco borra ciudad y ofrece sus tres destinos. Guardar sin ciudad con estado elegido debe impedir el envío o dar validación 400.
3. Elegir Guadalajara/Jalisco, guardar y reabrir: selecciones persisten. Vaciar estado deja ambos sin seleccionar; guardar mantiene el legacy sin borrarlo.
4. Crear una propiedad con par válido sin llenar texto legacy: guardar funciona. Dirección sigue siendo un campo aparte y obligatorio.
5. Colaborador: ve el aviso de ciudad no disponible. No puede editar propiedades ajenas (404 conservado). ADMIN conserva sus permisos.
6. Home destacadas, /casas y ficha: `Nuevo Vallarta, Nayarit` en formato natural. Una fila sin pareja sigue mostrando legacy. Comprobar dirección/pin sin cambios.
7. Repetir en es/en/fr, 1440px/375px y ambos temas. Estados/destinos son nombres propios del catálogo mexicano y no se traducen.

## Verificación offline

- `node scripts/test-property-destinations.cjs`: POST/PATCH, persistencia legacy, combinaciones inválidas, permisos, opciones dependientes, render es/en/fr en home/listado/ficha y UPDATE del backfill en SQLite. No sustituye el ensayo PostgreSQL del DO/LOCK/DDL por Emma.
- `node scripts/test-destinations.cjs`: los 44 destinos, emparejamientos y normalización.
- `node scripts/test-panel-render.cjs`: formulario de alta con los nombres nuevos de selects.
- TypeScript y ESLint del workspace web; suite existente sin navegador. La verificación visual permanece manual.

Resultado de esta entrega: TypeScript limpio; ESLint 0 errores y 5 warnings existentes. Suite completa: 47/48 scripts pasan. `test-public-chrome.cjs` falla por el selector `.home-brand`: exige que todo selector incluya public-header/public-footer. Tanto ese test como public-chrome.css están idénticos a HEAD; el fallo es anterior a esta tarea y no se modificó fuera de alcance. Los tests específicos de catálogo, destinos de propiedad y render de panel pasan. No se ejecutó el DDL ni el DO/LOCK del backfill en PostgreSQL.
