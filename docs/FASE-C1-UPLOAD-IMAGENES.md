# Fase C1 — Subida de imágenes al panel

Fecha: 07 Oct 2026. Implementada en código, sin migraciones, deploy ni acceso a Neon/Blob real. Pruebas con SDK mockeado. TypeScript y ESLint pendientes: su ejecución fuera del sandbox fue rechazada; no se reintentó por otra vía.

## Transporte elegido

El usuario aprobó **navegador → Blob**, con autorización del servidor, en lugar del POST multipart original. [Vercel Functions limita el payload a 4.5 MB](https://vercel.com/docs/functions/limitations); [client uploads](https://vercel.com/docs/vercel-blob/client-upload) evita que los bytes del archivo pasen por la Function. El límite de la aplicación es **5 MB = 5.000.000 bytes**, no 5 MiB.

1. ResourceEditor valida un único archivo y captura categoría/orden del formulario.
2. `upload()` del SDK solicita un token por POST JSON a `/api/properties/[id]/upload`.
3. El endpoint valida sesión/rol/dueño con property-access y managedProperty. COLLABORATOR solo propietario; ADMIN cualquiera; CLIENT/VIEWER 403, anónimo 401, ajena 404. Se revalida propiedad antes de emitir el token.
4. El token queda limitado a la ruta exacta, MIME declarado JPEG/PNG/WebP, máximo 5.000.000 bytes, cinco minutos, sin sobrescritura ni multipart. Blob aplica MIME/tamaño al upload real: mentir sobre el tamaño en los metadatos no amplía el límite firmado.
5. Blob recibe el archivo directamente y devuelve la URL pública al navegador. El endpoint de autorización devuelve un token acotado, no la URL; este cambio de contrato corresponde al transporte aprobado. BLOB_READ_WRITE_TOKEN permanece exclusivamente en servidor y nunca se devuelve.
6. El editor crea Media por el POST existente `/api/properties/[id]/media` con URL/categoría/orden; este API vuelve a validar ownership y asigna PHOTO. No cambia el schema ni el sitio público.

No hay webhook de finalización: el SDK instalado permite omitirlo, y Media se crea por el API existente. Esto permite probar desde localhost sin túnel. El archivo original no determina el pathname: `properties/<id codificado>/<uuid>.jpg|png|webp`, sin nombres originales, barras ni segmentos `..` del cliente. El servidor exige ruta/UUID/extensión acordes a propiedad y MIME.

## UI y compatibilidad

- Drag & drop o botón Elegir archivo; una foto por subida, sin selección múltiple/batch.
- Usar primero los campos de categoría/orden. Progreso nativo accesible, estado subiendo/éxito/error localizado es/en/fr. Formulario y edición/borrado quedan deshabilitados durante la subida.
- La URL manual sigue disponible; imágenes externas existentes funcionan igual. El uploader aparece solo en alta de imágenes, no mientras se edita una Media ni en tarifas.
- Si Blob termina y falla Media, la URL queda visible y cargada en el campo manual para reintentar guardado sin volver a subir. No se borran automáticamente objetos.
- No se altera gestión/render de videos, galería/lightbox, presentación editorial ni configuración pública de imágenes.

## Errores

| Estado | Code | Causa |
| --- | --- | --- |
| 400 | INVALID_FILE_TYPE | MIME fuera de JPEG/PNG/WebP |
| 400 | INVALID_FILE_SIZE | Vacío, tamaño inválido o mayor que 5 MB |
| 400 | INVALID_UPLOAD_PATH | Otra propiedad, ruta/UUID/extensión inválidos |
| 400 | INVALID_UPLOAD_REQUEST | JSON/metadatos/evento inválidos; multipart no permitido |
| 401 | UNAUTHENTICATED | Sin sesión |
| 403 | FORBIDDEN o códigos vigentes de property-access | Rol/sesión no autorizados |
| 404 | PROPERTY_NOT_FOUND | Propiedad ajena o inexistente |
| 500 | UPLOAD_FAILED | SDK/configuración; respuesta sin mensajes internos ni secretos |

Los códigos anteriores son del endpoint de autorización. Rechazos del archivo real ocurren en Blob y el SDK los presenta como error de subida; no pasan por esta Function.

## Presupuesto Hobby

Verificado en la [documentación oficial de precios](https://vercel.com/docs/vercel-blob/usage-and-pricing) el 07 Oct 2026:

| Recurso incluido | Hobby |
| --- | --- |
| Almacenamiento promedio mensual | 1 GB-mes |
| Blob Data Transfer | 10 GB |
| Operaciones avanzadas | 2.000 |

Las 2.000 no son exclusivamente escrituras: incluyen put/copy/list y operaciones del dashboard. Revisar Storage/Usage antes de crecer; no suponer 2.000 fotos disponibles si ya se consumieron otras operaciones. A tamaño máximo, 200 fotos equivalen aproximadamente a 1 GB; su visualización repetida consume transferencia. Los límites vigentes y su consumo real deben consultarse en Vercel al presupuestar. No se cambió plan ni configuración.

## Archivos

- `apps/web/package.json`: dependencia @vercel/blob ^2.8.1 en el workspace web.
- `pnpm-lock.yaml`: resolución del SDK y sus dependencias mediante pnpm, instalación sin scripts.
- `apps/web/src/lib/photo-upload.ts`: reglas MIME/bytes y validación/saneado de ruta/metadatos compartidos.
- `apps/web/src/app/api/properties/[id]/upload/route.ts`: autorización y token Blob restringido, errores diagnosticables/no-store.
- `apps/web/src/components/panel/ResourceEditor.tsx`: dropzone, selector, progreso y creación Media por API actual, conservando URL manual.
- `apps/web/messages/es.json`: textos nuevos bajo photoUpload.
- `apps/web/messages/en.json`: traducciones inglesas del uploader.
- `apps/web/messages/fr.json`: traducciones francesas del uploader.
- `scripts/test-property-access.cjs`: inyección de módulos mock para SDK, sin cambios a permisos de producción.
- `scripts/test-photo-upload.cjs`: pruebas del endpoint con SDK mock, integración Media y SSR localizado.
- `docs/FASE-C1-UPLOAD-IMAGENES.md`: arquitectura, límites, pruebas y decisiones.
- `docs/CONTEXTO.md`: registro de C1.

## Cómo probar

Emma ya preparó un Blob store **público** y BLOB_READ_WRITE_TOKEN para el entorno correspondiente; no copiar el token a código ni a variables NEXT_PUBLIC. No se inspeccionó .env.local aquí. Usar BD de QA Respaldo para pruebas de escritura; nada de deploy/main autorizado por esta fase.

Desde raíz:

```powershell
pnpm dev
node scripts/test-photo-upload.cjs
node scripts/test-panel.cjs
node scripts/test-panel-render.cjs
node scripts/test-property-sections.cjs
node scripts/test-gallery-share.cjs
```

Checks pendientes (desde apps/web):

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/components/panel/ResourceEditor.tsx src/lib/photo-upload.ts "src/app/api/properties/[id]/upload/route.ts"
```

1. Login COLLABORATOR, abrir propiedad propia en `/es/panel/propiedades/[id]`. En Imágenes elegir categoría y orden, subir JPEG/PNG/WebP por botón y drag & drop. Debe mostrar progreso, URL y éxito; recargar y revisar Media con PHOTO/categoría/orden correctos.
2. Abrir detalle público de esa propiedad si está publicada; comprobar foto en galería/categoría correspondiente. Las propiedades borrador siguen sin publicarse automáticamente. Verificar también una imagen externa preexistente.
3. Repetir /en y /fr, móvil/desktop y claro/oscuro. Probar URL manual y edición existentes.
4. Subir imagen de 4.6–5.0 MB: debe funcionar mediante el SDK directo, sin cuerpo de archivo en la Function. Probar archivo vacío, SVG/GIF/PDF y >5 MB: error localizado, sin Media nueva.
5. Petición directa autenticada a `/api/properties/ID_AJENA/upload` con el mismo JSON del token (capturable en DevTools Network): 404. CLIENT/VIEWER: 403. ADMIN: token para cualquier propiedad.
6. Para probar validación de servidor sin frontend, modificar `payload.clientPayload` (JSON string con contentType/size): `application/pdf` → 400 INVALID_FILE_TYPE; size 5000001 → 400 INVALID_FILE_SIZE. Ruta de otra propiedad/`../` → 400 INVALID_UPLOAD_PATH.
7. Interrumpir la creación Media después de una subida exitosa: verificar que la URL queda disponible para guardado manual. No volver a subir innecesariamente. No ejecutar eliminación real de Blob como parte de estas pruebas.

Verificado: test-photo-upload, panel, panel-render, property-sections y gallery-share pasan con SDK simulado y BD en memoria. Tests incluyen 401/403/404, formatos/tamaño/ruta 400, política de token (MIME, 5 MB, TTL, no overwrite), ADMIN, Media PHOTO/categoría/orden y SSR es/en/fr. No se ha probado upload real, drag & drop en navegador, despliegue ni configuración del store. TypeScript/ESLint pendientes según explicación inicial.

## Supuestos y notas

- Transporte directo autorizado por el usuario; token de store público preparado por Emma; 5 MB decimal; una imagen por operación.
- Blob valida tamaño y Content-Type del archivo recibido mediante la política firmada. No se añade decodificación completa ni inspección de contenido binario en servidor: el archivo no pasa por la Function. No se permite SVG.
- Sin compresión/optimización en C1; evaluar sharp o similar en fase posterior.
- Si falla Media después de subir o si se borra una Media por el editor actual, el Blob puede permanecer almacenado. Limpieza de huérfanos/borrado coordinado queda fuera de alcance y no se implementa automáticamente.
- El token ya emitido vale hasta cinco minutos; cambios de dueño/rol posteriores no revocan ese token. El guardado Media sí vuelve a validar permisos en servidor.

## Diagnóstico del 403/CORS local — 07 Oct 2026

El código ya utiliza `handleUpload` y `upload` de `@vercel/blob/client`; no hay PUT manual de la aplicación. `https://vercel.com/api/blob` es el destino por defecto de @vercel/blob 2.8.1, como muestra el [código oficial del SDK](https://github.com/vercel/storage/blob/main/packages/blob/src/helpers.ts). No se exporta `isValidPathname` en esta versión; se conserva la validación local estricta de propiedad/UUID/extensión.

El preflight OPTIONS al pathname reportado, sin token ni archivo, devolvió 200 con Allow-Origin `*` y método PUT permitido. El usuario reporta 403 en el PUT: su causa sigue sin confirmar. No se sustituyó el destino del SDK ni se modificaron permisos para ocultar el fallo.

`test-photo-upload.cjs` ahora utiliza handleUpload real con una credencial sintética exclusivamente de test. El transporte de upload real se intercepta con MockAgent (toda conexión no interceptada está prohibida): POST al endpoint local, PUT oficial y URL pública del store de test, guardada por el API Media existente. Incluye los casos de autorización y MIME/5 MB anteriores. No verifica la credencial/store reales.

Checks de esta revisión: TypeScript limpio; pnpm lint 0 errores/9 warnings preexistentes; test-photo-upload pasa. Esto completa los checks que estaban pendientes al implementar C1.

No existe .env.local en la raíz ni en apps/web en esta copia; no se leyó ni usó una credencial real. Para resolver el 403 de la sesión local hace falta comprobar en el entorno donde ocurre: token vigente del store correcto y store público/activo; reiniciar pnpm dev tras cambios de entorno; revisar status/JSON del POST local y respuesta del PUT sin compartir tokens. La aparición de un objeto real en Storage queda pendiente de esa prueba; este informe no afirma que el fallo real esté corregido.
