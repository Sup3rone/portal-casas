# Diagnóstico del campo de ubicación

Fecha: 2026-10-15. Inspección de solo lectura del código actual. Único archivo creado: este informe. Sin cambios de código, schema, datos ni configuración; sin navegador automatizado. No se proponen soluciones.

## 1. Definición actual del modelo

El modelo es Drizzle/PostgreSQL, no Prisma: `properties` corresponde a la tabla `Property` en `packages/db/src/schema.ts:35–38`.

| Campo exacto | Tipo PostgreSQL / TypeScript | Nulabilidad | Naturaleza |
|---|---|---|---|
| `Property.city` | `text` / `string` | NOT NULL; sin default | Ciudad como texto libre. No es enum, catálogo ni FK. |
| `Property.address` | `text` / `string` | NOT NULL; sin default | Dirección como texto libre, independiente de `city`. |
| `Property.lat` | `double precision` / `number` | Nullable; sin default | Latitud. |
| `Property.lng` | `double precision` / `number` | Nullable; sin default | Longitud. |

No existen campos de estado/provincia/región, país, código postal, identificador de destino ni `placeId` en `Property`. No existe un campo persistido llamado `location` o `ubicacion`: el detalle construye una variable `location` concatenando dirección y ciudad.

`city` y `address` no tienen variantes por idioma: el mismo valor se utiliza en es/en/fr. El formulario traduce sus etiquetas (Ciudad/City/Ville y Dirección/Address/Adresse), no sus valores.

La API exige strings no vacíos después de `trim()` para ambos campos (`panel-validation.ts`, función `text` y lista `texts`). No normaliza mayúsculas, acentos o abreviaturas ni contrasta el contenido con un catálogo. El schema no declara un CHECK de texto no vacío, longitud ni correspondencia entre ciudad, dirección y coordenadas. NOT NULL por sí solo no impide cadenas vacías insertadas fuera de la API.

## 2. Usos actuales

Rutas relativas a la raíz del repositorio; líneas aproximadas.

| Área | Archivo | Uso observado |
|---|---|---|
| Editor | `apps/web/src/components/panel/PropertyForm.tsx:13–25,46–52` | `address` y `city` son inputs de texto libre obligatorios. Se incluyen en el payload POST/PATCH; no son selects ni tienen autocompletado de ciudad. |
| Editor de coordenadas | `apps/web/src/components/panel/MapsLocationInput.tsx:8–44` | Acepta un enlace de Maps, extrae lat/lng y ofrece edición numérica avanzada. No rellena ciudad o dirección. |
| Validación | `apps/web/src/lib/panel-validation.ts:7–10,31–34,67–78` | Recorta extremos y exige texto; valida rangos numéricos de coordenadas. No hay normalización geográfica. |
| Crear propiedad | `apps/web/src/app/api/properties/route.ts:9–24` | Persiste `address`, `city`, `lat` y `lng` en el INSERT. GET devuelve propiedades completas del ámbito autorizado. |
| Editar propiedad | `apps/web/src/app/api/properties/[id]/route.ts:11–39` | Valida y persiste los cambios mediante el UPDATE existente. |
| Carga del editor | `apps/web/src/lib/panel-server.ts:15–25` y `apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx` | Lee la propiedad completa autorizada y la pasa a PropertyForm. |
| Tipado de editor | `apps/web/src/lib/panel-resources.ts` | `PanelProperty` deriva del schema; no crea otro formato de ubicación. |
| Panel de propiedades | `apps/web/src/app/[locale]/panel/page.tsx:18` | Muestra `property.city` junto al estado de publicación. |
| Destacadas de home | `apps/web/src/app/[locale]/page.tsx:97` | Subtítulo de cada tarjeta: ciudad y huéspedes; no usa dirección ni coordenadas. |
| Opciones de destacadas | `apps/web/src/lib/site-content.ts:76` y `apps/web/src/app/[locale]/panel/contenido/page.tsx:13` | Consulta ciudad de propiedades publicadas para las opciones del selector. |
| Selector de destacadas | `apps/web/src/components/panel/SiteContentEditor.tsx:80` | Etiqueta de opción: título localizado y ciudad sin traducir. |
| Listado público | `apps/web/src/app/[locale]/casas/page.tsx` | Consulta la propiedad completa y la entrega a PropertyCard; no filtra ni agrupa por `city` o `address`. |
| Tarjeta del listado | `apps/web/src/components/PropertyCard.tsx:13,56` | Declara `city: string` y muestra su valor guardado. |
| Ficha pública | `apps/web/src/app/[locale]/casas/[slug]/page.tsx:85,101–107,173` | Concatena dirección y ciudad con coma; muestra ciudad en mayúsculas en los datos del título; pasa ubicación a mapa y compartir. El bloque de destino de respaldo utiliza esa ubicación cuando no hay editoriales. |
| Mapa | `apps/web/src/components/LocationMap.tsx:13–31` | Usa coordenadas para el iframe; dirección en título accesible y pie del mapa; ciudad y dirección en las props de compartir. En la ficha se monta solo con ambas coordenadas no nulas. |
| Compartir ubicación | `apps/web/src/components/PropertyShareButton.tsx:7–16,34–48` | Prioriza coordenadas válidas; si faltan, búsqueda Maps por dirección+ciudad; sin ubicación, URL de página. Texto: título y ciudad. |
| Buscador compartido | `apps/web/src/components/PropertySearchForm.tsx` | Envía únicamente `start`, `end`, `guests` por GET a `/{locale}/casas`. No hay input de ciudad/destino. Se reutiliza en el panel de búsqueda de Navbar; el render central del hero está desactivado. |
| Interpretación de filtros | `apps/web/src/lib/property-search.ts` | Tipo y validación solo para huéspedes y fechas. No admite un filtro de ubicación implementado. |
| Consulta filtrada | `apps/web/src/app/[locale]/casas/page.tsx:31–69` | Filtra publicación, capacidad y ocupación por fechas. No aplica comparación sobre ciudad/dirección. Un query param de ciudad no participa en esa consulta. |
| SEO de ficha | `apps/web/src/app/[locale]/casas/[slug]/page.tsx:29–36` | Metadata usa título, descripción y foto. No agrega `city`, `address`, `lat` o `lng` como datos estructurados ni como campos específicos de metadata. Pueden aparecer si forman parte del título/descripción escritos. |
| Helpers SEO | `apps/web/src/lib/seo.ts` y `apps/web/src/lib/seo-property.ts` | Canonical/OG/hreflang se construyen por locale/slug; no por ubicación. La lectura de propiedad incluye esos campos, pero la metadata no los usa directamente. |
| Sitemap | `apps/web/src/app/sitemap.ts` | Incluye slugs publicados y versiones por idioma; no genera rutas de ciudad ni usa coordenadas. |

## 3. Inventario real de valores

**No disponible.** El usuario confirmó en esta tarea que `DATABASE_URL` del entorno local apunta a **Respaldo**. Se intentó consultar mediante el SDK de Neon con la carga del entorno de `apps/web`. La conexión devolvió `NeonDbError` con fallo de conexión/red, sin código SQL disponible. Se repitió fuera del sandbox con el mismo resultado. No se obtuvo ningún conjunto de filas ni se accedió intencionadamente a main.

No se incluyen valores de fixtures, seeds, capturas o documentación como si fueran inventario real.

| Valor de `city` | Frecuencia de propiedades | Publicadas |
|---|---|---|
| No disponible: consulta sin conexión | No disponible | No disponible |

Tampoco se conocen el total de propiedades ni el número de valores distintos. La consulta solicitada incluía todas las propiedades, publicadas y borradores, y habría conservado los valores originales sin normalizarlos:

```sql
SELECT city,
       count(*)::int AS properties,
       count(*) FILTER (WHERE published)::int AS published
FROM "Property"
GROUP BY city
ORDER BY count(*) DESC, city NULLS FIRST;
```

Se intentó además una consulta de conteos de nulos, blancos, espacios exteriores y coordenadas ausentes/parciales. Tampoco devolvió resultados. Las únicas operaciones previstas y enviadas fueron SELECT; no se realizaron escrituras ni migraciones.

## 4. Inconsistencias: comprobadas y no verificables

| Aspecto | Estado observado |
|---|---|
| Mayúsculas mezcladas en los datos guardados | No verificable sin inventario. El código acepta cualquier combinación. |
| Variantes del mismo lugar, acentos o abreviaturas | No verificable sin inventario. No existe catálogo ni comparación normalizada en la validación. |
| Ciudades vacías o nulas en filas reales | No verificable. Schema exige NOT NULL; API rechaza blancos. No equivale a haber verificado el contenido de la BD desplegada. |
| Direcciones vacías o nulas en filas reales | No verificable; mismas distinciones entre schema/API y datos reales. |
| Estado o país pegados al texto de ciudad | No verificable en filas reales. `city` acepta texto libre y no hay otros campos estructurados donde separarlos. |
| Espacios exteriores o interiores repetidos | API elimina espacios exteriores; no colapsa los interiores. No se pudo medir su presencia real. |
| Diferencia visual entre ficha y tarjetas | Comprobada en código: ficha aplica `city.toUpperCase()`; tarjetas muestran `city` tal cual. Una diferencia visible de caja entre vistas no demuestra que existan dos valores distintos en BD. |
| Repetición entre dirección y ciudad | La ficha concatena ambos con coma sin deduplicación. Sin datos no se puede afirmar que hoy exista una repetición concreta. |
| Consistencia entre ubicación textual y pin | Son entradas independientes; pegar Maps modifica coordenadas, no ciudad/dirección. No se pudo verificar si hay contradicciones reales. |

No se recorrieron rutas en navegador, conforme al protocolo de verificación humana. No se atribuyen inconsistencias concretas a propiedades sin haber leído sus datos.

## 5. Otros campos y mecanismos de ubicación

- **Dirección:** `address`, texto obligatorio independiente de `city`.
- **Coordenadas:** `lat` y `lng`, nullable. La API acepta valores finitos dentro de ±90/±180 respectivamente; pueden actualizarse individualmente, sin un CHECK de pareja declarado en el schema.
- **Link de Google Maps:** no hay columna para guardarlo. `MapsLocationInput` mantiene el enlace en estado local, reconstruyéndolo al abrir el editor con coordenadas existentes. Solo los inputs `lat` y `lng` se incluyen en el guardado.
- **Parser:** `apps/web/src/lib/panel-maps-url.ts` acepta URLs HTTPS de hosts Google permitidos con coordenadas en pin `!3d/!4d`, query `q`/`query` o cámara `@`; prioriza el pin. Rechaza enlaces cortos y devuelve error localizado. No realiza geocodificación ni consulta un catálogo externo.
- **Maps público:** iframe generado con `https://maps.google.com/maps?q={lat},{lng}&z=15&hl={locale}&output=embed`.
- **Enlace compartido:** `PropertyShareButton` construye la búsqueda Google Maps según coordenadas o texto; no guarda el enlace en BD.
- **Narrativa de destino:** `PropertySection` contiene descripciones localizadas de `destino`; son contenido editorial libre, no campos estructurados de ciudad/estado/país ni filtros geográficos.

## Archivos revisados

1. `packages/db/src/schema.ts`
2. `packages/db/src/index.ts`
3. `apps/web/src/components/panel/PropertyForm.tsx`
4. `apps/web/src/components/panel/MapsLocationInput.tsx`
5. `apps/web/src/lib/panel-maps-url.ts`
6. `apps/web/src/lib/panel-validation.ts`
7. `apps/web/src/lib/panel-server.ts`
8. `apps/web/src/lib/panel-resources.ts`
9. `apps/web/src/app/api/properties/route.ts`
10. `apps/web/src/app/api/properties/[id]/route.ts`
11. `apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx`
12. `apps/web/src/app/[locale]/panel/page.tsx`
13. `apps/web/src/app/[locale]/page.tsx`
14. `apps/web/src/lib/site-content.ts`
15. `apps/web/src/app/[locale]/panel/contenido/page.tsx`
16. `apps/web/src/components/panel/SiteContentEditor.tsx`
17. `apps/web/src/app/[locale]/casas/page.tsx`
18. `apps/web/src/components/PropertyCard.tsx`
19. `apps/web/src/app/[locale]/casas/[slug]/page.tsx`
20. `apps/web/src/components/LocationMap.tsx`
21. `apps/web/src/components/PropertyShareButton.tsx`
22. `apps/web/src/components/PropertySearchForm.tsx`
23. `apps/web/src/lib/property-search.ts`
24. `apps/web/src/lib/seo.ts`
25. `apps/web/src/lib/seo-property.ts`
26. `apps/web/src/app/sitemap.ts`
27. `apps/web/messages/es.json`
28. `apps/web/messages/en.json`
29. `apps/web/messages/fr.json`
30. `docs/CONTEXTO.md` (antecedentes de entorno y ubicación).

El entorno local se cargó únicamente para el intento de lectura autorizado; no se registran credenciales en este informe. Los hallazgos de estructura corresponden al schema del repositorio, no a una introspección exitosa de la BD.
