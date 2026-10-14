# Headers de seguridad y CSP — 13 Oct 2026

## Estado

Preparados en `apps/web/vercel.json`, raíz del proyecto Vercel confirmada por Emma (`apps/web`). Aplican a todas las rutas, APIs y assets mediante `/(.*)`. No se añade middleware ni se cambian componentes, lógica, BD o configuración de build. No se realizó deployment.

La CSP es **Content-Security-Policy-Report-Only**: detecta infracciones sin bloquear recursos. No equivale todavía a protección CSP activa. No se inventa un endpoint de reportes: sin `report-uri`/`report-to` no hay envío ni almacenamiento centralizado de informes; revisar avisos del navegador en DevTools. No se afirma que Vercel capture estos avisos en sus logs. Una futura recopilación central requiere un destino real aprobado, política de privacidad/retención y configuración propia.

## Headers básicos

| Header | Valor | Efecto tras desplegar |
|---|---|---|
| X-Content-Type-Options | nosniff | Impide interpretar scripts/estilos servidos con MIME incorrecto. Si aparece un fallo MIME, corregir el Content-Type del asset, no retirar el header. |
| X-Frame-Options | SAMEORIGIN | El sitio solo puede ser incrustado por su propio origen. No impide que el sitio incruste Google Maps. Revisar si existe una integración externa que incruste Portal Casas. |
| Referrer-Policy | strict-origin-when-cross-origin | Mantiene referrer completo en mismo origen, solo origen hacia otro HTTPS y no lo envía al degradar a HTTP. |

Se omite `X-XSS-Protection: 1; mode=block`, opcional y legado; no se activa un filtro obsoleto como sustituto de CSP. HSTS no se cambia en esta tarea.

## Directivas CSP

El valor completo y único está en `apps/web/vercel.json`.

| Directiva | Fuentes permitidas | Recursos y justificación |
|---|---|---|
| default-src | 'self' | Respaldo para tipos no declarados: mismo origen. |
| script-src | 'self', 'unsafe-inline', maps.googleapis.com, maps.gstatic.com, va.vercel-scripts.com, vercel.live (HTTPS) | JS propio/Next/Auth.js, scripts inline de hidratación Next; Analytics y toolbar Preview. Inline es una concesión inicial: endurecer requiere nonce/hash y revisar renderizado, fuera de scope. No se permite unsafe-eval. |
| style-src | 'self', 'unsafe-inline', fonts.googleapis.com (HTTPS) | CSS propio y estilos inline existentes (Reveal, fondos y mapa); admite fuentes Google si se usan. |
| img-src | 'self', https:, data:, blob: | Fotos Blob, URLs manuales HTTPS de CDN externo, assets locales, miniaturas/data y previews Blob. No se restringe al store actual para preservar biblioteca externa. |
| media-src | 'self', https:, blob: | `/videos/hero.mp4`, videos de galería por URL HTTPS y objetos Blob; uploader de videos no cambia. |
| font-src | 'self', fonts.gstatic.com (HTTPS), data: | Fuentes locales, Google Fonts y fuentes embebidas. |
| connect-src | 'self', maps.googleapis.com, maps.gstatic.com, *.blob.vercel-storage.com, vitals.vercel-insights.com, *.vercel-insights.com, va.vercel-scripts.com, vercel.live (HTTPS) | API propia, Auth.js, multipart de uploader, fetch/decode de fotos Blob, Analytics y Maps. El `put()` de Blob, MyMemory y Neon se ejecutan en servidor: CSP no limita esas llamadas. Los endpoints de Analytics de mismo origen quedan cubiertos por self aunque cambien de ruta. |
| frame-src | 'self', maps.google.com, www.google.com, vercel.live (HTTPS) | Iframe actual de LocationMap (`maps.google.com/maps?...&output=embed`), destino Google habitual y toolbar Preview. Los subrecursos dentro del iframe Google obedecen la política de ese documento, no el script-src del padre. |
| worker-src | 'self', blob: | Workers propios o Blob si una integración los utiliza. |
| object-src | 'none' | Detectaría plugins/object/embed. No se encontraron en los componentes revisados. |
| base-uri | 'self' | Detectaría cambios del elemento base a otro origen. |
| form-action | 'self' | Formularios solo a origen propio; enlaces wa.me, Instagram/Facebook y compartir no son form submissions. |
| frame-ancestors | 'self' | Criterio CSP equivalente a SAMEORIGIN, todavía report-only. |

**Qué se bloqueó:** CSP no bloquea nada todavía. Tras activar enforcement, esta propuesta restringiría scripts, conexiones, fuentes e iframes no autorizados; eval; object/embed; bases y envío de formularios a otros orígenes. Imágenes y videos HTTPS continúan abiertos deliberadamente. X-Frame-Options y nosniff sí son efectivos tras desplegar aunque CSP sea report-only. El iframe actual contiene su propio referrerPolicy, que se conserva; el header no reescribe esa opción del elemento.

No se añaden `sandbox`, `upgrade-insecure-requests`, COEP, COOP ni restricciones de permisos; podrían cambiar comportamiento y no son necesarias para esta fase. Preview/dev pueden avisar por HMR WebSocket/eval o toolbar: distinguir esos avisos de los de producción, no permitir eval globalmente para silenciarlos.

## Validación y producción

- Lectura del repo: Maps usa iframe Google; video home de mismo origen; fotos y videos aceptan URLs externas; uploader POST al mismo origen y Blob server-side; Analytics ya integrado. Compatibilidad revisada por configuración, no prueba completa en producción.
- Validación local: JSON parseable, header report-only único, directivas sin duplicados, valores de básicos y fuentes esperadas comprobados con Node; diff sin errores de espacios. `pnpm dev` por sí solo NO aplica vercel.json; no es una prueba de estos headers.
- **Producción: PENDIENTE.** No se suministró URL de producción ni se desplegó esta configuración. No se verificaron Maps/upload/videos bajo los nuevos headers allí y no hay resultados reales de infracciones que reportar. No decir «0 violaciones» por ausencia de prueba. No se conectó a Neon.

### Checklist para Emma tras un deployment autorizado en horario de bajo tráfico

1. Verificar Root Directory = apps/web. Desplegar por el procedimiento autorizado; esta tarea no ejecuta deployment.
2. Sustituir el dominio en `curl.exe -sS -D - -o NUL https://DOMINIO-REAL/es`. Confirmar los tres headers básicos y Content-Security-Policy-Report-Only. Repetir `/en/casas`, `/fr/casas/SLUG-REAL` y `/theme-init.js`. Si ya existe una CSP activa emitida por otra capa, registrarla: Report-Only no la anula.
3. DevTools → Network → documento → Response Headers; Console → Preserve log. Recargar home, listado y detalle es/en/fr. Revisar video, galería/lightbox, fondos y Google Maps (primer toque, drag/zoom). Registrar directiva, URL y mensaje exacto de cada aviso CSP; no compartir tokens, cookies ni datos personales.
4. ADMIN/COLLABORATOR: en una propiedad de prueba autorizada, subir UNA imagen; comprobar POST propio exitoso, URL Blob y foto visible. Comprobar login/sesión y formulario con validación sin enviar correos reales no autorizados. Probar móvil375px y desktop, temas y navegación.
5. Verificar script/intake Analytics; evitar atribuir errores de cuota/CORS de proveedores a CSP. Revisar también errores de MIME por nosniff.
6. Guardar registro: fecha/deployment, rutas, Maps OK/fallo, video OK/fallo, upload OK/fallo, avisos CSP (directiva/origen) y errores independientes. No activar CSP bloqueante hasta completar este inventario.
7. Ajustar solo la directiva/origen específico que corresponda al recurso legítimo; no abrir scripts a https: ni retirar todos los headers. Cambiar de Report-Only a Content-Security-Policy exige otra aprobación y QA. Para revertir la política experimental, retirar solo ese header y conservar los básicos, tras revisar la causa.

## Supuestos y fuentes

- Root Directory apps/web confirmada; no se asume dominio ni configuración externa del dashboard.
- Los recursos externos de Media usados en producción son HTTPS. Si hay HTTP legado, se reportará; no se agrega http: global sin evidencia.
- No existe dependencia legítima conocida de incrustar el sitio en un iframe externo. Maps saliente es compatible con SAMEORIGIN.
- Report-only es una etapa de diagnóstico, no una CSP estricta ni una auditoría completa de seguridad.

Referencias: [Vercel: configuración de headers](https://vercel.com/docs/project-configuration/vercel-json#headers), [MDN: CSP Report-Only](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only). También se consultó la guía CSP de Next instalada en `apps/web/node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.
