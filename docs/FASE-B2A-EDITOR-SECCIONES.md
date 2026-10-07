# Fase B2a — Editor de secciones editoriales

Implementado en el panel privado, sin modificar el detalle público ni iniciar
la presentación scroll. PropertySection ya aplicada por Emma en Respaldo y main,
según confirmación del usuario; aquí no se consultó ni modificó ninguna BD.

## API y seguridad

| Ruta | Método | Comportamiento |
| --- | --- | --- |
| /api/properties/[id]/sections | GET | Devuelve {sections: []} o las filas existentes; no-store |
| /api/properties/[id]/sections/[section] | PUT | Reemplaza los cuatro campos mediante UPSERT sobre PK propertyId/section |

Ambos handlers usan requirePropertyManager y managedProperty antes de leer/guardar.
ADMIN puede cualquiera; COLLABORATOR solo propias. Propiedad ajena/inexistente 404;
sin sesión 401; CLIENT/VIEWER 403. El SQL vuelve a filtrar el dueño, sin depender del
frontend. No hay endpoints públicos de edición ni cambios en property-access.ts.

PUT requiere los cuatro campos y rechaza claves adicionales:

```json
{
  "descriptionEs": "Descripción de prueba",
  "descriptionEn": "Test description",
  "descriptionFr": "Description de test",
  "heroMediaId": null
}
```

section solo admite destino, amenidades, habitaciones y lugar. Las descripciones
son texto plano o null, máximo 10.000 caracteres por idioma. Se recortan espacios
externos; texto vacío se normaliza a null. heroMediaId admite texto/null (hasta
200 caracteres); una imagen elegida debe ser Media PHOTO de la misma propiedad.
Se comprueba en servidor ANTES del UPSERT y se repite en el SQL para concurrencia.
No hace falta coincidencia con Media.category: un hero puede ser cualquier PHOTO
propia. La FK compuesta de B1 se mantiene como protección adicional.

### Códigos diagnosticables

| HTTP | code | Causa |
| --- | --- | --- |
| 400 | INVALID_SECTION | Código de sección no admitido |
| 400 | INVALID_SECTION_CONTENT | JSON/campos/tipos/longitudes inválidos |
| 400 | INVALID_HERO | Media ausente, ajena o VIDEO |
| 401 | UNAUTHENTICATED | Sin sesión |
| 403 | FORBIDDEN / SESSION_USER_NOT_FOUND / ROLE_NOT_ALLOWED | Gate de rol/sesión |
| 404 | PROPERTY_NOT_FOUND | Propiedad ajena/inexistente o recurso cambiado concurrentemente |

Los errores inesperados conservan panelError y su respuesta 500. La UI reutiliza
panelRequest y textos genéricos existentes del panel para éxito/error/carga; los
codes específicos quedan disponibles en la respuesta de API para diagnosticar.

## Editor

Se añade al final de /[locale]/panel/propiedades/[id], tras el editor de imágenes.
Cuatro formularios independientes con títulos details.destino/amenidades/
habitaciones/enLugar, textareas es/en/fr y guardar. Selector de PHOTO propias con
opción Sin imagen, orden e ID; miniaturas seleccionables con orden y vista previa.
La lista conserva el orden de Media obtenido por propertyResources.
Se reutilizan inputClass/buttonClass, panelRequest, traducciones de estado y
router.refresh. No se suben imágenes ni se altera ResourceEditor existente.

Para borrar contenido: vaciar las tres descripciones, seleccionar Sin imagen y
guardar. Se conserva la fila con todos los campos null. **No hay DELETE de sección**.
Esto no borra imágenes. Para borrar una Media usada como hero, primero quitar ese
hero de todas sus secciones: B1 usa ON DELETE NO ACTION.

Se carga PropertySection únicamente en el editor privado con managedResource.
No se cambió propertyResources ni su contrato; no se agregaron consultas al detalle.
Guardar revalida el panel, sin publicar contenido editorial ni modificar published.

## Archivos

| Archivo | Cambio |
| --- | --- |
| apps/web/src/lib/property-sections.ts | Lectura protegida, validación, UPSERT y códigos |
| apps/web/src/app/api/properties/[id]/sections/route.ts | GET protegido de secciones |
| apps/web/src/app/api/properties/[id]/sections/[section]/route.ts | PUT protegido de sección |
| apps/web/src/components/panel/PropertySectionsEditor.tsx | Cuatro formularios y selección de PHOTO con miniaturas |
| apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx | Carga protegida e integración del editor |
| apps/web/messages/es.json | Namespace panelSections en español |
| apps/web/messages/en.json | Namespace panelSections en inglés |
| apps/web/messages/fr.json | Namespace panelSections en francés |
| scripts/test-property-access.cjs | Fixture de PropertySection con PK compuesta para pruebas en memoria |
| scripts/test-property-sections.cjs | Handlers/SQL reales, guards, validación, UPSERT y render localizado |
| docs/CONTEXTO.md | Estado y convenciones de B2a |
| docs/FASE-B2A-EDITOR-SECCIONES.md | Inventario, API, decisiones y pruebas |

## Verificación

Desde la raíz:

```powershell
node scripts/test-property-sections.cjs
node scripts/test-panel.cjs
node scripts/test-panel-render.cjs
node scripts/test-property-access.cjs
```

TypeScript desde apps/web: node node_modules/typescript/bin/tsc --noEmit --incremental false.
Pruebas sin red/Neon: sesión simulada y SQL de handlers reales ejecutado sobre SQLite
en memoria. Cubren GET vacío, guardar/actualizar sin duplicación, vaciar, admin,
colaborador ajeno 404, CLIENT/VIEWER 403, sección inválida 400, PHOTO ajena/video/
inexistente 400 y formulario real en es/en/fr. No sustituyen ensayo de las FKs y
concurrencia en PostgreSQL ni prueba interactiva en navegador.

## Checklist manual en Respaldo

1. Configurar entorno local exclusivamente para Neon Respaldo; no usar main para
   pruebas con escrituras. pnpm dev; login COLLABORATOR de prueba.
2. Editar propiedad propia y localizar Secciones de la propiedad. Completar destino
   en tres idiomas, elegir una PHOTO propia y guardar; observar éxito y recargar.
3. Emma verifica manualmente:

```sql
SELECT "propertyId", "section", "descriptionEs", "descriptionEn", "descriptionFr", "heroMediaId"
FROM "PropertySection"
WHERE "propertyId" = '<ID_PROPIEDAD_PRUEBA>'
ORDER BY "section";
```

4. Guardar otra vez: actualiza la misma fila. Vaciar todos los campos y elegir
   Sin imagen: la fila permanece con null. Probar las otras tres secciones.
5. Con esa sesión, GET/PUT hacia ID ajeno devuelve 404, sin cambios. Abrir editor
   de propiedad ajena por URL también 404. ADMIN puede guardar ambas.
6. Desde DevTools de la misma sesión ejecutar estas peticiones manuales (adaptar
   ID de propiedad propia). No usar IDs de producción para las pruebas:

```javascript
fetch('/api/properties/<ID_PROPIO>/sections/invalida', {
  method: 'PUT', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({descriptionEs:null, descriptionEn:null, descriptionFr:null, heroMediaId:null})
}).then(async r => ({status:r.status, body:await r.json()})).then(console.log);
```

Esperado 400 INVALID_SECTION. Repetir en destino con un hero de otra propiedad
o VIDEO: 400 INVALID_HERO. Cambiar la propiedad en la URL a una ajena: 404.
Sin sesión APIs 401; CLIENT/VIEWER 403. Ninguno debe insertar/alterar contenido.
7. Repetir formulario/estados en /es, /en, /fr. No deben aparecer videos ni fotos
   ajenas en el selector. Guardar sin fotos disponibles usando null sigue permitido.
8. Abrir detalle público: permanece igual; el contenido editorial todavía no se
   muestra. Calendario, consulta, galería y publicación no cambian.

## Supuestos y notas

- PUT reemplaza todos los campos; no es PATCH parcial. Borrado conserva fila nula.
- Límite editorial 10.000 caracteres por idioma, sin obligación de completar
  traducciones para guardar borradores. Texto plano, sin HTML interpretado.
- La migración B1 está aplicada, según el usuario. No se verificó conectando a BD.
- Publicación/consumo público pertenece a B2b. No se modifican iCal, bookings,
  invitaciones ni permisos existentes. Pruebas en vivo quedan para el checklist.
