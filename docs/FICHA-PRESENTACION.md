# Ficha: video, títulos y zig-zag — 2026-10-16

Solo cambia la presentación de ficha y su editor por propiedad. No se cambian home, listado, búsqueda, galería, lógica de reservas, calendario, formulario, mapa o permisos. Se mantienen las condiciones de datos: no se inventan narrativas ni se añaden bloques vacíos. El experimento fullpage sigue desactivado y el scroll permanece nativo.

## Persistencia y SQL pendiente

Se agrega **una sola columna nullable `Property.sectionTitles` JSONB**, sin modelo nuevo. Para respetar la restricción de schema, también contiene la URL del video: no se crea una columna de video aparte ni se usa SiteContent.

```json
{
  "heroVideoUrl": "https://store.public.blob.vercel-storage.com/properties/id/hero/uuid.mp4",
  "titles": {
    "destino": { "es": "El destino", "en": "The destination", "fr": "La destination" }
  }
}
```

Claves de títulos: `mapa`, `destino`, `amenidades`, `habitaciones`, `lugar`, `advertencias`, `reserva`, `disponibilidad`. Cada sección personalizada debe completar es/en/fr, hasta 150 caracteres por idioma. Los tres vacíos recuperan el título de los diccionarios actuales. No hay fallback entre idiomas: si falta un título se usa el default de ese idioma. El texto del título nunca se interpreta como HTML.

`scripts/sql/property-presentation.sql` es una **propuesta NO ejecutada**. Emma debe aplicarla primero en Respaldo, verificar, y luego en main con el protocolo de respaldo habitual **antes de desplegar**: las consultas de propiedad completa del schema nuevo necesitan la columna. No transforma filas existentes: empiezan NULL y mantienen defaults. CHECK valida JSON objeto; API valida claves, idiomas, longitudes y URL HTTPS sin credenciales. Guardados que omiten `sectionTitles` conservan la configuración anterior.

## Panel por propiedad

En editar propiedad, `PropertyPresentationEditor` es un formulario independiente después de los datos generales. Nueva propiedad: crear primero para obtener id y después configurar presentación. Permisos dueño/admin existentes; ajena 404 para colaborador.

Control “Video de fondo del hero principal”: URL HTTPS o archivo MP4/WebM. Se reutiliza **POST `/api/properties/[id]/upload`** con FormData `purpose=hero-video`; sin purpose conserva exactamente la subida de fotos. No hay endpoint nuevo. El servidor revalida dueño antes de escribir en Blob y genera ruta `properties/<id>/hero/<uuid>.<ext>`. El nombre original se ignora; token permanece en servidor.

El archivo no se añade a Media ni a la galería: su URL se guarda solo en la configuración al pulsar Guardar. La vista previa del panel usa controles nativos. Subir no guarda la propiedad; vaciar URL y guardar retira el video, sin borrar el archivo de Blob.

**Límite operativo:** subida vía servidor de máximo 4 000 000 bytes, como C1, para dejar margen bajo el límite del body de Vercel. MP4 (`video/mp4`) y WebM (`video/webm`) explícitos; no se admite MOV ni se comprimen/transcodifican videos. Para videos mayores, usar URL HTTPS de un archivo ya alojado. La validación de fotos/compresión se mantiene intacta.

## Render y accesibilidad

- Video configurado: hero de 100svh con autoplay, loop, muted y playsInline, título/datos encima. Galería principal conserva su componente, secuencia, miniaturas y lightbox, debajo del hero y fuera del elemento transformado.
- Fallback: primera PHOTO de la galería principal como poster/capa independiente. Video solo se hace visible al emitir playing; fallo de red/codec o rechazo de autoplay deja visible la imagen. Sin foto, fondo sólido oscuro del token existente. Sin URL de video, título mantiene altura natural y texto del papel; no se impone hero vacío.
- `prefers-reduced-motion`: video pausado/oculto, poster visible; reveal sin transición y con contenido visible. CSS usa tokens existentes, no colores nuevos. Scrim ajustable `--detail-hero-scrim` (70% negro del token): blanco sobre una imagen blanca en el peor caso da aproximadamente 8,52:1, sin depender de la sombra.
- Los paneles de texto sobre papel usan superficie y texto de `--header-bg`/`--chrome-text`, independientes de las fotos. Sus tokens superan AA en claro y oscuro; verificar también visualmente el video real.
- Zig-zag editorial: Destino/Habitaciones, imagen izquierda y narrativa derecha; Amenidades/En el lugar, narrativa izquierda e imagen derecha. Se conserva carrusel/fotos y solo se envuelve cada cuadro con Reveal existente, con desplazamiento lateral de su distancia actual. Reveal desconecta el observer al dispararse y permanece visible al volver a subir.
- En móvil/tablet (<1024px), imagen encima y texto debajo en las cuatro editoriales. Si solo hay uno de los dos, no aparece una columna vacía. Se conservan los fallbacks de contenido que ya existían cuando no hay narrativa editorial.
- Reserva: calendario a la derecha/formulario a la izquierda en desktop; calendario arriba/formulario abajo en móvil. Ambos usan el mismo Reveal lateral. DOM y provider mantienen el orden funcional calendario → formulario y todos los campos permanecen montados.
- Mapa/advertencias mantienen sus componentes y funciones. Se añade encabezado visible de mapa para exponer su título editable. Los títulos de categoría de respaldo también usan el valor personalizado.

## Validación offline

`node scripts/test-property-presentation.cjs` cubre subida mock MP4/WebM, MIME/tamaño inválido, 401/403/404, admin, ruta segura, validación/persistencia de configuración, creación, defaults, SSR es/en/fr, poster, títulos, orden responsivo y reglas reduced-motion. No conecta a Neon ni Blob. También pasan los tests existentes de fotos, panel y presentación editorial.

TypeScript limpio y ESLint 0 errores, con 5 warnings existentes. Suite completa: 49/50 scripts pasan. Falla el mismo `test-public-chrome.cjs` preexistente por `.home-brand`; no se toca ese CSS ni ese test en esta tarea. Ninguna prueba sustituye el ensayo manual PostgreSQL/Blob y la verificación visual de Emma.

## Checklist humana

1. Aplicar el SQL en Respaldo. Abrir propiedad propia → Presentación de la propiedad. Pegar URL HTTPS o subir MP4/WebM <=4MB. Ver vista previa, Guardar y reabrir: URL persistida.
2. Con colaborador, verificar propiedad propia; una petición sobre ajena mantiene 404. ADMIN puede gestionar cualquiera. Video incorrecto/grande da error claro sin borrar textos escritos; fotos siguen subiendo como antes.
3. Completar títulos es/en/fr y guardar. Dejar un idioma de un título a medias debe mostrar validación sin guardar; dejar los tres vacíos restaura defaults.
4. Ficha en es/en/fr: títulos correspondientes visibles. Home y listado no usan estos títulos y deben permanecer iguales.
5. Hero a 1440px: video silenciado en loop, título/datos legibles sobre escenas claras/oscuras. Galería y lightbox siguen funcionando debajo. En 375px, si autoplay no arranca, debe verse la foto principal y poder seguir navegando.
6. Simular URL de video inaccesible/codec no soportado: poster permanece. Sin video, título normal sobre papel, sin hueco de pantalla completa.
7. Revisar cuatro editoriales con datos: alternancia izquierda/derecha indicada; imágenes y textos entran desde el lado que ocupan. Subir y bajar no los vuelve a ocultar.
8. A 375px, editoriales apiladas y sin overflow horizontal. Reserva: calendario arriba y formulario debajo, enteros y accesibles con teclado móvil.
9. Desktop: formulario izquierda/calendario derecha. Seleccionar fechas y escribir consulta sin perder datos al volver a scrollear; WhatsApp, ancla reservar, navbar, botón ↑ y footer intactos.
10. Activar reduced-motion: poster estático, contenido visible sin entradas animadas. Probar Tab/Enter, foco visible y controles de al menos 44px en ambos temas y tres idiomas.

No se ejecutó navegador ni se generaron capturas. El SQL y la subida real permanecen pendientes de Emma.

## Archivos de esta entrega

| Archivo | Cambio |
|---|---|
| `packages/db/src/schema.ts` | Columna JSONB nullable y CHECK de objeto. |
| `scripts/sql/property-presentation.sql` | ALTER propuesto para ejecución manual. |
| `apps/web/src/lib/property-presentation.ts` | Claves/tipos y título localizado con fallback. |
| `apps/web/src/lib/hero-video-upload.ts` | MIME y límite compartidos cliente/servidor. |
| `apps/web/src/lib/panel-validation.ts` | Validación estricta de configuración, URL y títulos. |
| `apps/web/src/lib/panel-response.ts` | Códigos de error diagnosticables de presentación. |
| `apps/web/src/components/panel/request.ts` | Mapea errores nuevos al mensaje localizado. |
| `apps/web/src/app/api/properties/route.ts` | Persiste configuración también al crear por API. |
| `apps/web/src/app/api/properties/[id]/upload/route.ts` | Extiende el endpoint existente con purpose de hero-video. |
| `apps/web/src/components/panel/PropertyPresentationEditor.tsx` | Formulario de títulos y video propio. |
| `apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx` | Compone el editor de presentación. |
| `apps/web/src/components/PropertyHeroVideo.tsx` | Video decorativo, poster y fallback de reproducción. |
| `apps/web/src/app/[locale]/casas/[slug]/page.tsx` | Hero, títulos de secciones y composición de reserva. |
| `apps/web/src/lib/editorial-presentation.ts` | Título opcional de slide, compatible con API anterior. |
| `apps/web/src/components/EditorialPresentation.tsx` | Wrappers Reveal laterales y título personalizado; conserva lógica del carrusel. |
| `apps/web/src/app/property-presentation.css` | Zig-zag, hero, contraste y reduced-motion, solo ficha. |
| `apps/web/src/app/globals.css` | Importa la hoja específica de ficha. |
| `apps/web/messages/es.json`, `en.json`, `fr.json` | Labels, ayudas y errores del editor. |
| `scripts/test-property-presentation.cjs` | API/SDK mock/SSR/validaciones/regresiones. |
| `docs/CONTEXTO.md` | Registra almacenamiento y estado pendiente de SQL/QA. |
| `docs/FICHA-PRESENTACION.md` | Decisiones, límites, instrucciones y checklist. |
