# Lote de limpieza — 05 Oct 2026

## 1. Footer

Antes: `Footer.tsx:20` usaba `<a href="/es/casas">` en todos los idiomas.
ESLint reportaba la misma causa como `@next/next/no-html-link-for-pages`.
Se sustituyó por el Link localizado existente de `i18n/navigation`, con
href `/casas`. Mantiene el locale y elimina el error relacionado.

## 2. Galería

Antes: SectionSlider posicionaba una fila flex sin wrapping y sin ancho
acotado; 55 dots superaban el contenedor. Solo se cambiaron sus clases:
left/right-4 delimitan el ancho, flex-wrap permite filas, justify-center
centra las fotos y justify-end conserva la alineación de video. shrink-0
conserva el tamaño de cada punto. Selección, índice y controles intactos.
En navegador se probaron 55 puntos a 360px (tres filas) y 1440px (una fila),
todos dentro de su contenedor y sin scroll horizontal. Se pulsó el punto 55
y se comprobó que mostraba Photo 55.

## 3. CategorySection — diagnóstico anterior al cambio

Es una regresión de contenido visible cuando la categoría tiene fotos:
los commits d1b0d042 y eda6e43a renderizaban `items.map(...)`, mientras que
36db0df1 lo sustituyó por el comentario `{/* ...igual que antes... */}`
en el ul (línea 26 antes de la corrección). La página sigue enviando listas
traducidas de amenidades y habitaciones. No se encontró planificación de
una feature futura que justificara esa omisión.

Tras reportar el diagnóstico se restauró el map con sus clases anteriores,
dentro del glass existente. No se borraron items, tipos ni datos. Se conserva
el comportamiento actual: una categoría sin fotos no se renderiza.
El render SSR comprueba dos items de habitaciones en es/en/fr y conserva
esa regla sin fotos. La propiedad usada para la galería no tenía categorías
con fotos; su listado de categorías se verificó con fixtures en memoria.

## 4. Idioma de consultas

Antes: MessageForm recibía `locale` pero no lo enviaba. El atributo HTML
lang regionaliza controles y no es un campo FormData. El API ya leía
`formData.get('lang')` y, al faltar, guardaba es.

Fix mínimo: un input oculto `name="lang" value={locale}`. No hizo falta
cambiar API, esquema, permisos ni validaciones. El fallback es se conserva
para llamadas anteriores que omiten lang. Se buscaron consumidores en
apps/web, packages y scripts: MensajesList muestra lang en mayúsculas;
no hay reglas de permisos, filtros ni envío de correo basados en es.
Las pruebas llaman al handler real y leen la fila guardada en SQL en memoria:
peticiones en/fr persisten esos valores y se conserva es al omitir el campo.
El render del formulario verifica el payload oculto en es/en/fr.

## Archivos de código/pruebas

| Archivo | Cambio |
| --- | --- |
| apps/web/src/components/Footer.tsx | Link localizado y corrección ESLint |
| apps/web/src/components/SectionSlider.tsx | Wrapping y ancho de dots, solo clases |
| apps/web/src/components/CategorySection.tsx | Restaurar listado de items perdido |
| apps/web/src/components/MessageForm.tsx | Enviar lang desde locale |
| scripts/test-inquiry.cjs | Persistencia de idioma, payload, footer y categorías |

CONTEXTO.md y PROGRESO.md documentan el lote. I18N-DETALLE.md y
RESPONSIVE-RESERVA.md marcan como resueltos sus antiguos pendientes.

## Cómo probar

1. Ejecutar `pnpm dev` desde la raíz.
2. Footer: abrir el detalle en /en y /fr; pulsar Homes/Maisons en el pie.
   Debe abrir /en/casas y /fr/casas, respectivamente. Repetir en /es.
3. Galería: abrir una casa con muchas imágenes, probar 360px y 1440px en
   DevTools, desplazarse hasta el borde inferior del hero y comprobar todas
   las filas de puntos. Pulsar el último, anterior y siguiente; no debe haber
   scroll horizontal. Si hay video, comprobar también los puntos superiores.
4. Categorías: usar una casa que ya tenga Media de amenidades/habitaciones;
   deben verse iconos y textos debajo del título y junto a las fotos, también
   en /en y /fr. Sin fotos se mantiene la ocultación anterior. No modificar la
   BD para esta comprobación; usar una propiedad preparada o los fixtures.
5. Consulta: en el entorno local configurado para Respaldo, abrir /en,
   completar datos válidos y fechas libres. En Network comprobar que el POST
   contiene `lang=en` y devuelve 201; guardar el id de Message de la respuesta.
   El usuario puede comprobar, SOLO en Respaldo:

   ```sql
   SELECT id, lang
   FROM "Message"
   WHERE id = 'ID_DEVUELTO_POR_API';
   ```

   Debe devolver en. Repetir en /fr y /es para fr/es. Esta verificación en Neon
   queda pendiente; no se conectó a la BD ni se enviaron consultas reales aquí.
6. Automatizado sin red: `node scripts/test-inquiry.cjs` y
   `node scripts/test-panel-render.cjs`.

## Supuestos y notas

- El locale activo es el de la ruta, que la página ya pasa a MessageForm.
- Se restauran los items que ya suministraba la página; no se inventa contenido
  ni se cambia el modelo de amenidades.
- Queda la advertencia ESLint previa no-img-element de SectionSlider; cambiar
  img por Image excedería este ajuste de dots. Los datos sin uso labels y
  categoryData de la página tampoco se eliminan en este lote.
