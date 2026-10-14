# Activos visuales del sitio — 14 Oct 2026

## Diagnóstico y decisión

Home renderizaba `/videos/hero.mp4` desde public, con autoplay/muted/loop/playsInline y HomeVideoMotion para reduced-motion. Casas renderizaba `/images/listado-bg.jpg` desde public. Se conserva ese layout y ambos archivos como fallback. El video sigue extendido sobre hero y Sobre nosotros.

SiteContent es clave/valor y su CHECK solo admitía siete claves. Se añaden `home_background_video` y `listing_background_image`; no hay columnas/tablas nuevas. SQL pendiente: `scripts/sql/site-content-visual-assets.sql`; **no ejecutado**. Emma lo aplica manualmente en Respaldo, prueba, y después en main antes del deploy autorizado. No desplegar la app nueva sobre el CHECK viejo: guardar incluirá las dos claves nuevas y PostgreSQL lo rechazará.

La compresión (`optimizePhoto`) y validación (`photoMetadata`) son reutilizables; la cola de ResourceEditor estaba acoplada a Media, categoría/orden y ownership de Property. Con aprobación expresa se creó `/api/panel/site-content/upload`, exclusivo ADMIN, sin modificar ResourceEditor. SiteContentEditor usa esas mismas funciones y el patrón secuencial por archivo, evitando un refactor del uploader de propiedades.

## Funcionamiento

- Video: URL HTTPS directa sin credenciales, hasta2048 caracteres; vacío usa video local. No se suben videos. No se garantiza que toda URL HTTPS sea un video: el navegador prueba su reproducción y, ante error, HomeVideoMotion intenta el video local una vez. No se duplica el video ni cambia el comportamiento reduced-motion. El rechazo de autoplay por política del navegador no se trata como un recurso corrupto.
- Imagen: JPEG/PNG/WebP, optimizada antes de enviar si supera1MB, JPEG1920px/calidad0.82/orientación igual al uploader existente; si decode falla se conserva original y se aplica validación habitual. POST multipart con límite final4.000.000 bytes (no5MB; límite actual por Functions), ADMIN antes de procesar/subir, path `site/listing/<uuid>.<ext>`, URL pública, sin overwrite. Respuesta201 {url}, errores400/401/403/500 con code. No crea Media ni exige un id de propiedad ficticio.
- Drag/drop y elección múltiple se procesan en orden; se selecciona la última subida exitosa. Los fallos se conservan por archivo y no borran la selección previa. La cola informa optimización/subida/nombre/progreso y peso optimizado, y bloquea doble subida/Guardar hasta terminar. Cancelación al desmontar. Una imagen seleccionada tiene preview; Vaciar vuelve al fondo actual tras Guardar.
- Subir escribe el archivo en Blob, pero **no persiste la selección**: solo Guardar actualiza SiteContent. Archivos subidos y luego no seleccionados permanecen en Blob; no se eliminan automáticamente. Elegir una sola imagen evita almacenar variantes innecesarias.
- Casas lee el valor en servidor y usa SiteListingBackground para fallback en error a `/images/listado-bg.jpg`; mismo contenedor/overlay/recorte. Image unoptimized conserva compatibilidad con fuentes externas. Las fotos de propiedades, portadas, calendarios y detalle no cambian.
- API y editor conservan los textos/redes/destacada/WhatsApp. Un cliente antiguo que omita las claves nuevas no las borra. La política de URL inválida mantiene el code existente INVALID_SOCIAL_URL (validación HTTPS); el editor usa el helper central y sus mensajes existentes. UI nueva localizada es/en/fr; sin librerías ni credenciales cliente.

## Validaciones ejecutadas

Tests offline con SQLite y mock put: ADMIN permitido; anónimo401, COLLABORATOR/CLIENT403; MIME inválido y >4MB400; UUID/URL/path; HTTP/javascript/credenciales en URLs400 para ambos activos; persistencia/vaciado; cliente antiguo conserva activos; SSR home/Casas/editor en es/en/fr. También tests de SiteContent, búsqueda, destacada, footer y compresión. Video fallback/reduced-motion/cleanup probado con mocks. TypeScript y ESLint de archivos afectados sin errores.

Capturas QA de componentes/páginas reales con datos simulados; el vídeo local existente y og-default.jpg simulan las URLs nuevas. No acreditan carga de un archivo de la clienta, un upload real o persistencia en Neon. SQL y validación real están pendientes. No se ejecutó build que lea BD ni se realizó deployment en esta tarea.

## Prueba manual tras aplicar SQL en Respaldo

1. Login ADMIN → Contenido del sitio. Pegar URL HTTPS directa de un MP4/WebM conocido; subir imagen de cámara >1MB. Observar Optimizando/cola/pesos/preview; Guardar.
2. Abrir home y Casas es/en/fr: video nuevo sin sonido/autoplay/loop y fondo de Casas seleccionado. Recargar para confirmar persistencia. Probar375px y ambos temas; reduced-motion no reproduce.
3. Campos vacíos: vaciar video y selección; Guardar. Home usa `/videos/hero.mp4`, Casas `/images/listado-bg.jpg`.
4. URL inválida HTTP o javascript: formulario/API rechaza; guardar anterior sigue intacto. Enviar un archivo GIF o >4MB después de compresión:400; uploader no borra selección anterior. La compresión puede reducir una cámara grande a un archivo permitido.
5. URL HTTPS válida sintácticamente pero404/corrupta: home intenta video local; imagen seleccionada cuyo Blob esté eliminado vuelve al fondo local. No modificar/eliminar un Blob real para esta prueba; usar datos/archivo disposable autorizado en Respaldo o mocks.
6. Como COLLABORATOR: endpoint global devuelve403; el uploader propio de propiedades funciona igual. Como anónimo:401. No se ampliaron permisos del panel de propiedades.

## Rollback del CHECK

Antes de reducir el CHECK, respaldar y retirar únicamente las filas `home_background_video`/`listing_background_image`, o vaciar/restaurar desde código anterior si se desea conservarlas para futuro. El CHECK viejo no admite esas filas aunque su valor esté vacío. No ejecutar este borrado sin aprobación. En una transacción, DROP CONSTRAINT SiteContent_key_check y ADD CHECK con las siete claves anteriores (about_es/en/fr, social_instagram/facebook, featured_property_id, contact_whatsapp). Volver al código anterior antes de usar Guardar bajo el CHECK viejo. No hay rollback automático ni cambios ejecutados aquí.

Supuestos: selección global por sitio, no por locale; textos del editor traducidos. HTTPS no prueba MIME/disponibilidad remota y no hay fetch del servidor de URLs arbitrarias. SQL pendiente se aplica antes del deploy; requiere restore point de main según el procedimiento del proyecto. No se agrega gestión/borrado de archivos Blob ni subida de videos.
