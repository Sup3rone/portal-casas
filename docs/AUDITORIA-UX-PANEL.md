# Auditoría UX del panel admin — 13 Oct 2026

Solo lectura de código; único archivo creado: este informe. Sin cambios en componentes, estilos, permisos, APIs, BD ni dependencias. Incluye `/[locale]/panel/*`, las rutas antiguas `/[locale]/admin/*` accesibles desde su menú y componentes compartidos del layout/editor. No se inició sesión ni se ejecutaron mutaciones.

## Método y límites

- Inventario de sitios JSX y familias de controles repetidos, no cantidad de instancias: las fotos, propiedades y usuarios dependen de datos no consultados. Cada fila identifica el sitio que genera todas sus instancias.
- Tamaños **estimados estáticamente**, no mediciones de DevTools. Base asumida: raíz16px; Tailwind `p-2`=8px, `p-3`=12px, `text-sm`=14px/20px de línea, texto normal16px/24px; borde1px; sin zoom. Fuente, navegador, idioma, wrapping y contenedor pueden variar.
- El objetivo de esta auditoría es44×44px en ambas dimensiones: un botón48px alto pero33px ancho también falla. No es una declaración de cumplimiento/incumplimiento de toda WCAG.
- Para inputs asociados a `<label>`, el rectángulo del control puede ser pequeño pero la etiqueta puede ampliar el área efectiva. Se distingue expresamente. Checkbox/radio dentro de una tarjeta con foto NO se cuentan como fallos efectivos de44×44 solo por su glifo nativo pequeño.
- No hay mínimos globales de44px para el panel. Las reglas móviles de `globals.css` para `#reservar` pertenecen al detalle público y no protegen estos editores.
- Las líneas son aproximadas al estado revisado. Las rutas de las tablas son relativas a `apps/web/src/`, salvo indicación distinta. Textos citados en español; las claves equivalentes de es/en/fr se inspeccionaron. `/admin` conserva partes sin i18n.

## 1. Controles táctiles menores a44×44

### Navegación compartida y páginas del panel

| Página/componente | Archivo:línea | Elemento (todas sus instancias) | Tamaño estimado W×H / padding | Clase responsable y observación |
|---|---|---|---|---|
| Navbar global | `components/Navbar.tsx:24` | Logo ALIAFORRENT | Ancho del texto ×28px aprox.; padding0 | `text-xl`, enlace inline; área vertical insuficiente |
| Navbar global | `components/Navbar.tsx:30,43,46,53` | Casas, Panel admin, Mi cuenta, Salir | Ancho del texto ×20px; padding0 | `text-sm` sin mínimos. Salir es botón, los otros enlaces |
| Navbar sin sesión (contexto de acceso al panel) | `components/Navbar.tsx:65,72` | Entrar / Crear cuenta | Entrar: texto×20; registro: texto+48 ×36px | Enlace plano / `px-6 py-2 text-sm`. No son controles de una sesión ADMIN, pero sí del layout compartido |
| Selector de idioma | `components/LocaleSwitcher.tsx:54–57` | Botón que abre el selector | ≈80–100×34px; horizontal12, vertical6 | `px-3 py-1.5 text-sm border`; no `min-h-11` |
| Menú secundario panel | `app/[locale]/panel/layout.tsx:18–27` | Mis propiedades, Crear propiedad, Consultas, Usuarios, Contenido, Mensajes, Tarifas, Calendario; también Calendario colaborador | Texto×24px, padding0 | `Link` sin padding/min-height; `gap-6` separa elementos pero no agranda el target |
| Lista de propiedades | `app/[locale]/panel/page.tsx:19` | Editar cada propiedad | Texto×24px | `underline`, sin padding |
| Editor de propiedad | `app/[locale]/panel/propiedades/[id]/page.tsx:20` | Volver a propiedades | Texto×24px | Enlace `underline` |
| Lista de usuarios | `app/[locale]/panel/usuarios/page.tsx:19–22` | Email de búsqueda, select rol, Buscar | Inputs/select ≈42px alto; botón≈40px | `inputClass`/`buttonClass` de request.ts; etiqueta puede ampliar el target del campo |
| Lista de usuarios | `app/[locale]/panel/usuarios/page.tsx:27` | Email enlazado de cada usuario | Texto×24px | Enlace dentro de `td.p-2`: el padding de la celda NO pertenece al enlace |
| Lista de usuarios | `app/[locale]/panel/usuarios/page.tsx:34–35` | Página anterior y siguiente | Texto×24px | `Link` sin padding/mínimos |
| Detalle de usuario | `app/[locale]/panel/usuarios/[id]/page.tsx:16,22` | Volver a usuarios; propiedad enlazada | Texto×24px | `underline`, sin padding |
| Footer global | `components/Footer.tsx:29` | Casas | Texto×20px | Enlace en lista `text-sm`, sin padding. IG/FB/WhatsApp no se incluyen aquí: tienen targets grandes |

### Formularios de propiedad, contenido y usuarios

| Página/componente | Archivo:línea | Elemento | Tamaño estimado W×H / padding | Clase responsable y observación |
|---|---|---|---|---|
| Helper común | `components/panel/request.ts:9–10` | Todas las aplicaciones de `inputClass` y `buttonClass` | Input42px con texto16, o38px heredando `text-sm`; botón40px; horizontal12/16, vertical8 | `px-3 py-2 border` / `px-4 py-2`, sin altura mínima. Las filas siguientes enumeran consumidores, no fallos adicionales |
| PropertyForm (crear/editar) | `components/panel/PropertyForm.tsx:36,41,44,51,56–59` | Tipo de renta; contacto; WhatsApp; titleEs/En/Fr, address, city; maxGuests, bedrooms, bathrooms, precios base | Ancho columna ×≈38px | `inputClass`, labels `text-sm`. Labels pueden ampliar foco/toque; verificar target efectivo. Textareas descEs/En/Fr rows4 son suficientemente altas |
| PropertyForm | `components/panel/PropertyForm.tsx:63` | Guardar | Texto+32 ×≈40px | `buttonClass`; el estado Guardando no cambia la altura |
| MapsLocationInput | `components/panel/MapsLocationInput.tsx:28,35–36` | URL Maps; latitud/longitud avanzadas | Ancho columna ×≈38–42px | `inputClass`; confirmar herencia de fuente y área de label |
| MapsLocationInput | `components/panel/MapsLocationInput.tsx:32–33` | Ver ubicación en Google Maps; summary de opciones avanzadas | Texto×20px, padding0 | `inline-block text-sm` / `summary.cursor-pointer.text-sm` |
| Traducción compartida | `components/panel/TranslationDraftButton.tsx:37` | Traducir en cada título/descripción/idioma | Texto+26 ×≈38px | `px-3 py-2 text-sm border`, sin min-height. Se repite en PropertyForm y las cinco secciones editoriales |
| SiteContentEditor | `components/panel/SiteContentEditor.tsx:27,31,35` | Instagram/Facebook, WhatsApp global, propiedad destacada | Columna×≈38px | `inputClass` dentro de labels `text-sm`; textos Sobre nosotros rows5 no son pequeños |
| SiteContentEditor | `components/panel/SiteContentEditor.tsx:44` | Guardar contenido global | Texto+32 ×≈40px | `buttonClass` |
| UserActions | `components/panel/UserActions.tsx:26,29,32` | Promover/revertir rol, reset contraseña, ocultar contraseña temporal | Texto+32 ×≈40px | `buttonClass`; confirmaciones nativas no se pueden medir por CSS de la app |
| PublicationButton | `components/panel/PublicationButton.tsx:17` | Aprobar/publicar o despublicar | Texto+32 ×≈40px | `buttonClass`, usado en lista y editor de propiedad |

### Biblioteca, portada, fondos y secciones editoriales

| Componente | Archivo:línea | Elemento | Tamaño estimado W×H / padding | Clase responsable y observación |
|---|---|---|---|---|
| ResourceEditor (tarifas/media) | `components/panel/ResourceEditor.tsx:100–101` | Editar y Quitar por recurso | Texto×24px, padding0 | `underline`; ambos recursos comparten el mismo punto |
| ResourceEditor | `components/panel/ResourceEditor.tsx:105–107` | Tarifas: nombre, inicio/fin, precios, prioridad. Media: URL, categoría, orden | Columna×≈38px | `inputClass` en labels `text-sm`. No cambiar fechas/precios sin diagnóstico adicional |
| ResourceEditor | `components/panel/ResourceEditor.tsx:109–110,117` | Guardar/Añadir temporada/Añadir imagen; Cancelar edición; Elegir fotos | Principales≈40px; cancelar≈24px | `buttonClass`; cancelar sin padding |
| ResourceEditor | `components/panel/ResourceEditor.tsx:121,123` | URL de una foto subida o fallida | Texto por línea×≈20–24px | `underline`, sin padding. Puede envolver: eso no garantiza target44px por fragmento |
| CoverEditor | `components/panel/CoverEditor.tsx:39–43` | Subir/Bajar portada y Guardar | Texto+32 ×≈40px | `buttonClass`. Los textos son «Subir»/«Bajar», no botones de flecha pura |
| SectionBackgroundEditor | `components/panel/SectionBackgroundEditor.tsx:32–33` | Radio «Ninguna (blanco)» y su etiqueta | Glifo≈13–16px; fila clickeable≈20px alto | `label.flex.text-sm`, sin padding/min-height. Aquí NO hay miniatura que amplíe la altura |
| SectionBackgroundEditor | `components/panel/SectionBackgroundEditor.tsx:41` | Guardar fondo (inicio/mapa/reserva) | Texto+32 ×≈40px | `buttonClass`, tres instancias |
| PropertySectionsEditor | `components/panel/PropertySectionsEditor.tsx:34` | Select hero de cada sección | Columna×≈38px | `inputClass`, label `text-sm` |
| PropertySectionsEditor | `components/panel/PropertySectionsEditor.tsx:47,56` | Usar fotos de categoría y Guardar por sección | Texto+32 ×≈40px | `buttonClass`, para destino/amenidades/habitaciones/lugar/advertencias |
| SectionSlider del editor | `components/SectionSlider.tsx:58–67` | Flechas anterior/siguiente | ≈30–36×48px | `p-3` + glifo ‹/›: alto suficiente, ancho insuficiente; sin `w-11` |
| SectionSlider del editor | `components/SectionSlider.tsx:82–85` | Cada punto de paginación | **8×8px**, padding0 | `h-2 w-2`; fallo explícito en ambas dimensiones |

### Disponibilidad, consultas y rutas antiguas admin

| Página/componente | Archivo:línea | Elemento | Tamaño estimado W×H / padding | Clase responsable y observación |
|---|---|---|---|---|
| AvailabilityEditor | `components/panel/AvailabilityEditor.tsx:37,39–40,46–47` | Inicio/fin; Guardar bloqueo; Cancelar; Editar/Quitar bloqueo | Campos≈38px; guardar40px; enlaces-botón24px | `inputClass`, `buttonClass` o ausencia de padding. Se repite en editor de propiedad |
| AvailabilityCalendar compartido | `components/AvailabilityCalendar.tsx:60–72` | Mes anterior/siguiente | ≈28–34×40px | `p-2` + glifo sin min-height/min-width; ajustes públicos `#reservar` no aplican en panel |
| AvailabilityCalendar compartido | `components/AvailabilityCalendar.tsx:80,94–101` | Cada día seleccionable | Depende del ancho; **≈38×38 a375px**, ≈36×36 a360px en editor | `grid-cols-7 gap-1 aspect-square`, sin mínimo. Estimación:375−32 de panel−50 de tarjeta−24 de gaps, dividido7. Deshabilitados no son targets operables |
| CalendarBoard | `components/CalendarBoard.tsx:87–93` | Cada día en calendario consolidado `/panel/calendario` | H44px; **W≈43px a375**, ≈41px a360 | `h-11 min-w-0`, grid7/gap4. Panel añade padding horizontal32px; sección p-2/borde suma18px. En `/admin/calendario` sin ese padding exterior se estima W≈47.6 a375: no afirmar mismo fallo allí |
| Inquiries | `components/panel/Inquiries.tsx:21–24` | Select propiedad/estado | Columna×≈42px | `inputClass`; labels sin text-sm explícito |
| Inquiries | `components/panel/Inquiries.tsx:28,32` | Email mailto; Marcar como leída | Texto×24px | `underline`, sin padding |
| MensajesList antiguo | `components/MensajesList.tsx:82` | Email mailto por consulta | Texto×20px | `text-sm` del padre y enlace sin padding; artículo clickeable grande no sustituye el target de mailto |
| MarkAsReadButton antiguo | `components/MarkAsReadButton.tsx:38–41` | Marcar como leído | Texto×16px | `text-xs`, sin padding; estado Leído es span, no target |
| MessageModal antiguo | `components/MessageModal.tsx:133–140` | X superior de cerrar | ≈12–16×24px | Botón absoluto sin padding/dimensiones |
| MessageModal antiguo | `components/MessageModal.tsx:160–164,182–196` | Email; dos inputs date | Email×20px; fechas≈38px | `text-sm` heredado, inputs `p-2 border`. Las fechas no tienen label asociado individual que amplíe el target |
| MessageModal antiguo | `components/MessageModal.tsx:243–249` | Eliminar mensaje | Ancho completo×≈38px | `py-2 text-sm border`; confirmar/cerrar inferiores con py-3 son suficientemente altos |
| Tarifas admin antiguas | `app/[locale]/admin/tarifas/components.tsx:6,9–14` | Propiedad, nombre, prioridad, fechas, precios | Columna×≈42px | `p-2 border`, sin mínimos ni label ampliador |
| Tarifas admin antiguas | `app/[locale]/admin/tarifas/components.tsx:15,26` | Agregar tarifa; Eliminar tarifa | Agregar≈40px; eliminar≈36px | `py-2`; eliminar además `text-sm px-4` |

### Controles pequeños mitigados o sin fallo demostrable

| Componente/sitio | Rectángulo del control | Área efectiva y veredicto |
|---|---|---|
| CoverEditor:31–32, checkbox de cada foto | Nativo≈13–16px | Label completo con foto96px alto, padding8/borde: target mayor44 en ambos ejes; **no contabilizar como fallo efectivo** |
| SectionBackgroundEditor:36–37, radio con foto | Nativo≈13–16px | Label completo de miniatura; mayor44. La opción Ninguna sí es pequeña |
| PropertySectionsEditor:49–53, checkbox fotos | Nativo≈13–16px | Label incluye imagen80×56 y padding; mayor44. Botones de miniatura hero:39–42 también superan44 |
| Inputs con label envolvente enumerados arriba | Alto38–42px | Caption+campo suele sumar58–66px; puede ampliar el foco/toque. Medir control y etiqueta separadamente antes de priorizar como fallo efectivo |
| PropertyForm/SiteContent/PropertySections: textareas | Rows4/5 | Altura holgada; ancho se estima mayor44. Sin hallazgo pequeño |
| CalendarBoard:58,61,63,69,99–106 | 44px mínimos/44×44 flechas | Sync, flechas, desbloquear, cerrar detalles, guardar/cancelar y aviso no tienen fallo de alto demostrable; textos más padding hacen ancho≥44 en idiomas actuales |
| ResourceEditor:122 | Aviso con `min-h-11` | Cerrar resumen tiene alto44; texto suficientemente ancho |
| ThemeToggle:17 | 44×44 | Cumple la dimensión solicitada |
| LocaleSwitcher:74–78, opciones desplegadas | W176px, H≈44px | `py-2.5`20px + bandera `text-base`24px; no confundir con botón disparador34px. Confirmar navegador/fuente |
| Footer:34–40, redes | IG/FB44×44; WhatsApp min-h44 y texto | Sin fallo pequeño inferido |
| MensajesList:40–61, artículo onClick | Tarjeta ancha, p-6 y contenido | Target grande; acceso por teclado es otra cuestión. Video controls de SectionSlider son UI nativa del navegador: tamaños no verificables por estas clases |
| ResourceEditor:115 | File input `sr-only`, tabIndex−1 | No es target táctil visible; acción delegada a Elegir fotos, ya inventariada. Inputs hidden y options internos del select no se cuentan como targets de la app |

## 2. Errores genéricos, ambiguos o sin feedback

No se atribuye una causa técnica concreta a un500 sin evidencia. Los textos sugeridos son **mensajes condicionales**, según status/code real; no deben inventar «correo duplicado» o «fechas ocupadas» para cualquier fallo. Mantener404 genérico en recursos ajenos para no revelar su existencia.

### Helper común y consumidores del panel moderno

| Página/componente | Archivo:línea | Mensaje actual / pérdida de información | Qué debería comunicarse cuando corresponda |
|---|---|---|---|
| Helper compartido | `components/panel/request.ts:3–6` | Red,500,429 y otros statuses → `panel.error`: «No se pudo completar la operación.»; descarta `data.code` y `data.error` | Red: «No hay conexión; tus cambios siguen en el formulario».500: operación concreta + reintentar, sin datos internos.429: tiempo de espera si API lo proporciona |
| Helper compartido | `components/panel/request.ts:6` |401 y403 → «No tienes permiso para esta operación.» |401: «La sesión expiró/no hay sesión; inicia sesión de nuevo».403: permiso insuficiente. No confundirlos |
| Helper compartido | `components/panel/request.ts:6` |400 → «Revisa los campos obligatorios, importes y fechas.» | Indicar campo y regla cuando backend tiene code; no señalar fechas en formularios sin fechas |
| Helper compartido | `components/panel/request.ts:6` |404 → «Recurso no disponible o rango ocupado.»;409 → «El recurso ya existe o las fechas no están disponibles.» |404: recurso no disponible; ocupación solo si existe señal fiable.409: conflicto concreto conocido (slug/recurso) sin asumir fechas. No revelar propiedad ajena |
| Helper compartido | `components/panel/request.ts:5,7`; `PropertyForm:26`, `UserActions:18` | JSON inválido devuelve `{}`; HTTP2xx puede parecer éxito. Creación navega con `result.id` ausente; reset puede mostrar bloque vacío de contraseña | «La respuesta del servidor no contiene la propiedad/contraseña esperada. No se pudo confirmar el resultado». Validar respuesta antes de éxito, sin repetir reset automáticamente |
| Crear/editar propiedad | `components/panel/PropertyForm.tsx:24–28,62` | Todos los errores del helper; backend valida con `PanelValidationError('validation')` | Título/descripción obligatoria, huéspedes≥1, baños/precios válidos, WhatsApp8–15dígitos, tipo de renta válido. Si el backend no entrega campo, requiere mejor contrato antes de prometer inline preciso |
| Publicación | `components/panel/PublicationButton.tsx:13–18` | `panel.error/forbidden/notFound` sin acción identificada | «No se pudo publicar/despublicar esta propiedad», con sesión/permisos por separado |
| Tarifas y Media | `components/panel/ResourceEditor.tsx:78–90,124` | Misma validación/conflicto genérico al guardar/quitar | Tarifas: orden de fechas y precios/nombre específicos; media: URL HTTPS/local admitida, categoría/orden; eliminación: recurso ya no disponible o no se pudo quitar |
| Bloqueos individuales | `components/panel/AvailabilityEditor.tsx:18–27,49` | Mensajes generales del helper;404 presentado como recurso o rango | Al guardar: fechas inválidas vs rango no disponible si backend lo distingue; al eliminar: no se pudo quitar este bloqueo. Nunca recomendar eliminar reservas/iCal como solución |
| Consultas modernas | `components/panel/Inquiries.tsx:15–16,34` | Fallo Marcar leída traducido con claves generales | «No se pudo marcar esta consulta como leída», con sesión expirada/permisos/no disponible según status |
| Portada | `components/panel/CoverEditor.tsx:22–23,44` | «Revisa los campos obligatorios, importes y fechas.»; pierde `INVALID_COVER_SELECTION` / `INVALID_COVER_PHOTO` | Máximo5, sin duplicados; solo PHOTO propia existente; selección con foto retirada debe revisarse. API: `api/properties/[id]/cover/route.ts:27,32` |
| Fondos | `components/panel/SectionBackgroundEditor.tsx:26–27,42` | Validación general; pierde `INVALID_BACKGROUND_PHOTO` | «Elige una foto vigente de esta propiedad o Ninguna»; no hablar de importes/fechas. API: `api/properties/[id]/route.ts:21` |
| Editoriales | `components/panel/PropertySectionsEditor.tsx:26–28,57` | Validación general; codes específicos de sección/photo/hero no llegan al editor | Identificar sección inválida, texto excesivo, máximo2 fotos, duplicados o PHOTO ajena/retirada, según respuesta real de `lib/property-sections.ts` |
| Contenido del sitio | `components/panel/SiteContentEditor.tsx:15–17,43` | Validación sobre campos/importes/fechas sin identificar contenido; pierde codes existentes | `ABOUT_TOO_LONG`:≤2000; `INVALID_SOCIAL_URL`:HTTPS; `INVALID_CONTACT_WHATSAPP`:8–15dígitos; `INVALID_FEATURED_PROPERTY`:publicada/disponible; resto: solicitud inválida. `lib/site-content.ts`/API ya distinguen estos codes |
| Usuarios | `components/panel/UserActions.tsx:16–20,35` | Cambios rol/reset usan `panel.*`; no distingue401/403 ni restricción de rol | Sesión expirada; no cambiar propio rol ni degradar ADMIN; rol cambió mientras se editaba; usuario no disponible; no se pudo generar contraseña. No existe edición de email aquí: **«Email ya registrado» no es un caso demostrado de esta UI** |
| Traducción | `components/panel/TranslationDraftButton.tsx:17,24–27,31–33` | «No se pudo completar la traducción. Tus campos no se han modificado; intenta más tarde o rellena a mano.» agrupa red,401/403, proveedor, idioma inválido y respuesta malformada | Sesión/permisos; proveedor no disponible; idioma inválido; respuesta inválida. Cuota/rate-limit/origen vacío/cambiado/longitud YA tienen mensajes específicos: conservarlos |

### Uploader y calendario consolidado

| Componente | Archivo:línea | Mensaje actual / pérdida de información | Qué debería comunicarse |
|---|---|---|---|
| Uploader: subida Blob | `components/panel/ResourceEditor.tsx:50–52,61–65` | «No se pudo completar la subida o guardar la foto. Si aparece una URL, puedes guardarla mediante el formulario manual.» agrupa fallo de red,400 del servidor,500 Blob y respuesta sin URL | Distinguir archivo rechazado (MIME/tamaño), conexión interrumpida, almacenamiento no disponible o respuesta inválida. API devuelve `INVALID_UPLOAD_REQUEST`, validaciones archivo, `UPLOAD_FAILED`; MIME/tamaño detectados en cliente YA son claros |
| Uploader: Media posterior | `components/panel/ResourceEditor.tsx:57,64,121` | Misma frase para Blob subido pero guardado Media fallido; URL conservada, lo cual es útil | «La foto se subió, pero no se guardó en la biblioteca. Usa esta URL para añadirla»; si error orden/categoría identificable, mostrarlo. No subir otra copia automáticamente |
| Uploader: acceso | `components/panel/ResourceEditor.tsx:52,64` |401/403/404 → «No tienes acceso a esta propiedad.» |401 sesión expirada;403 permiso;404 recurso no disponible, sin revelar dueño. Archivo+error por fila YA se muestran, no falta todo el feedback |
| CalendarBoard: guardar | `components/CalendarBoard.tsx:43–46` | «No se pudo guardar o sincronizar. Revisa la disponibilidad y vuelve a intentar.» para cualquier HTTP fallido; raw fetch.message si falla red | «No se pudo guardar este bloqueo» + fechas inválidas/ocupación conocida/sesión/permisos según respuesta. No aconsejar disponibilidad para una caída de servidor |
| CalendarBoard: sincronizar | `components/CalendarBoard.tsx:49–52` | Mismo mensaje de guardar; no lee cuerpo, fuente ni resultado individual | «No se pudo sincronizar el calendario externo»; distinguir acceso, URL/proveedor/red si API lo informa. Revisar failures parciales además de response.ok antes de afirmar «Sincronizado» |
| CalendarBoard: desbloquear | `components/CalendarBoard.tsx:58–61` | «No se pudo eliminar el bloqueo. Revisa tus permisos y vuelve a intentar.» para todos los statuses | Sesión/permisos, bloqueo retirado o fuente de solo lectura, fallo servidor/red. El mensaje ya identifica operación, pero atribuye permisos sin evidencia |

### Mensajes y tarifas admin antiguos; fallbacks de páginas

| Página/componente | Archivo:línea | Mensaje actual / comportamiento | Qué debería comunicarse |
|---|---|---|---|
| Confirmar reserva | `components/MessageModal.tsx:87–90` | `data.error || 'Error al confirmar'`;500 real: «Error interno al crear la reserva»;404 de acceso/ocupación ambiguo | «No se pudo confirmar la reserva»; fechas ya tienen errores concretos. Solo afirmar ocupación si servidor la distingue; mantener resource404 seguro |
| Confirmar/eliminar | `components/MessageModal.tsx:90,107` | «Error inesperado» para excepción no Error; `Failed to fetch`/JSON SyntaxError sin traducir cuando sí es Error | «No hay conexión/no se pudo interpretar la respuesta; no se pudo confirmar el resultado». No mostrar excepción técnica al usuario |
| Eliminar consulta | `components/MensajesList.tsx:137–138,162–163`; `MessageModal:105–107` | «Error al eliminar» o `data.error`, incluyendo «Error interno» del backend. Hay DOS renderizados idénticos del modal, duplicando el mismo punto | «No se pudo eliminar esta consulta», con sesión/permiso/no disponible por separado. Duplicación del modal es hallazgo adicional, no corregido |
| Marcar leída antiguo | `components/MarkAsReadButton.tsx:20–28` | No comprueba response.ok ni muestra error; refresca incluso con400/403/404/500. Error de red queda sin manejo visible (finally solo apaga loading) | «No se pudo marcar el mensaje como leído»; no aparentar éxito; conservar estado y ofrecer reintento |
| Tarifas antiguas: validación | `app/[locale]/admin/tarifas/actions.ts:20–21`; `page.tsx:8–38` | Redirect a `?error=datos`, pero la página no recibe ni renderiza searchParams: **ningún mensaje** | Mostrar campos faltantes/importe inválido/fin posterior al inicio; mantener lo escrito cuando se rechaza |
| Tarifas antiguas: fallback | `app/[locale]/admin/tarifas/page.tsx:25` | Slug de propiedad ausente → `?` sin explicación | «Propiedad no disponible» o señal contextual; no se verifica orfandad en BD, solo el fallback visible |
| Sesión del panel | `lib/panel-server.ts:8–13` | Sin acceso → home sin motivo visible | Para sesión expirada: aviso/login conservando destino. Para rol sin acceso: mensaje apropiado. No convertir404 de recurso ajeno en información privada |
| Usuarios/contenido | `lib/admin-users.ts:14–16`; `app/[locale]/panel/contenido/page.tsx:8–9`; `panel/usuarios/[id]/page.tsx:12–13` | AccessError → notFound; no explicación específica de acceso/sesión en estas páginas | Mantener política de ocultar recursos cuando corresponde; gestionar sesión expirada en capa de acceso. No es evidencia de error de BD |
| Carga SSR del panel/admin | Páginas enumeradas en inventario; sin error.tsx específico en el árbol revisado | Excepción de datos no se convierte en error contextual propio de panel; Next aplica su manejo por defecto | «No pudimos cargar propiedades/usuarios/consultas/calendario; vuelve a intentar», sin mostrar detalles internos ni declarar causa inexistente |
| Datos vacíos de título | `panel/page.tsx:17`, `panel/usuarios/[id]/page.tsx:23`, `panel/consultas/page.tsx:11,25`, `CalendarBoard.tsx:71` | Título localizado vacío no usa título alternativo; `p.title ?? p.slug` no cubre string vacío | Si no hay traducción: título base o slug explícito, no encabezado vacío. Es posibilidad demostrada por código, no propiedad real observada |

**No son errores genéricos:** «Todavía no tienes propiedades», «No hay consultas», «Sin imágenes», «Sin temporadas», «No hay propiedades», opción Sin imagen, advertencia de foto ya retirada y «Propiedad eliminada» son estados vacíos/fallbacks con contexto. No se recomienda cambiarlos como si fueran fallos de red. Los mensajes de MapsLocationInput son específicos de validación del enlace/coordenadas; no se encontró un fallback genérico propio allí. No se auditó como problema «Email ya registrado» del registro público, fuera del panel.

## 3. Orden propuesto para una futura corrección (sin implementar)

1. Targets explícitamente pequeños: dots8×8, X del modal, acciones/enlaces sin padding, traducción y botones compartidos; después comprobar calendarios estrechos a375/360px. Ajustar inputClass requiere medir label efectivo y wrapping para no declarar falsos fallos.
2. Helper panelRequest: preservar status/code y separar red,401/403, validación, conflicto y500; las mejoras se extienden a casi todo el panel. No exponer mensajes SQL ni existencia de recursos ajenos.
3. Errores silenciosos: MarkAsReadButton, `?error=datos` de tarifas y JSON de éxito vacío; luego calendarios, uploader y traducción con contexto de operación.

## 4. Verificación manual pendiente (solo inspección)

1. Emma inicia sesión ADMIN y abre panel, nueva/edición, consultas, usuarios/lista/detalle, contenido y admin/mensajes/tarifas/calendario; repetir es/en/fr y375px/desktop. No usar credenciales compartidas en el informe.
2. En DevTools medir getBoundingClientRect de cada target y label asociado: comprobar ambos ejes≥44, no contar el espacio de gap/td como target. Abrir opciones avanzadas Maps, traducción, edición de bloqueos, picker de fotos/fondos y modal para ver todos los estados condicionales.
3. Comprobar que label de foto activa checkbox/radio desde cualquier punto de la tarjeta; medir la opción Ninguna por separado. Revisar CalendarioBoard en panel y admin antiguo: el padding exterior difiere.
4. Con mocks de respuesta/entorno de prueba, inspeccionar401/403/404/400/409/500/red/JSON inválido. No producir mutaciones ni eliminar recursos de producción para probar los mensajes. Registrar qué code recibió y qué mensaje mostró cada UI.
5. Recomendaciones y tamaños aquí no sustituyen QA de navegador/OS. No se ejecutaron tests ni benchmark: tarea documental sin cambios de comportamiento.

## 5. Archivos revisados

Lectura de páginas y componentes (completa o por bloques/líneas relevantes):

- `apps/web/AGENTS.md`, `docs/CONTEXTO.md`.
- `apps/web/src/app/[locale]/layout.tsx` (composición global conocida de la jornada), `app/[locale]/panel/layout.tsx`, `panel/page.tsx`, `panel/nueva/page.tsx`, `panel/propiedades/[id]/page.tsx`, `panel/consultas/page.tsx`, `panel/calendario/page.tsx`, `panel/usuarios/page.tsx`, `panel/usuarios/[id]/page.tsx`, `panel/contenido/page.tsx`.
- `apps/web/src/app/[locale]/admin/layout.tsx`, `admin/mensajes/page.tsx`, `admin/calendario/page.tsx`, `admin/tarifas/page.tsx`, `admin/tarifas/components.tsx`, `admin/tarifas/actions.ts`.
- `apps/web/src/components/panel/request.ts`, `PropertyForm.tsx`, `MapsLocationInput.tsx`, `TranslationDraftButton.tsx`, `ResourceEditor.tsx`, `CoverEditor.tsx`, `SectionBackgroundEditor.tsx`, `PropertySectionsEditor.tsx`, `AvailabilityEditor.tsx`, `Inquiries.tsx`, `PublicationButton.tsx`, `UserActions.tsx`, `SiteContentEditor.tsx`.
- `apps/web/src/components/CalendarBoard.tsx`, `AvailabilityCalendar.tsx`, `SectionSlider.tsx`, `MensajesList.tsx`, `MessageModal.tsx`, `MarkAsReadButton.tsx`, `Navbar.tsx`, `LocaleSwitcher.tsx`, `ThemeToggle.tsx`, `Footer.tsx`; `apps/web/src/app/globals.css`.
- `apps/web/messages/es.json`, `en.json`, `fr.json`: namespaces panel, occupationCalendar, panelTranslation, photoUpload, adminUsers; labels relevantes de coverEditor/panelSections.

Inspección de contratos de error/helpers (no auditoría de seguridad ni ejecución):

- `apps/web/src/lib/panel-response.ts`, `panel-validation.ts`, `panel-server.ts`, `admin-users.ts`, `property-sections.ts`, `occupation-calendar.ts`, `site-content.ts`.
- `apps/web/src/app/api/panel/users/[id]/route.ts`, `api/panel/site-content/route.ts`, `api/properties/route.ts`, `api/properties/[id]/route.ts`, `api/properties/[id]/cover/route.ts`, `api/properties/[id]/upload/route.ts`, `api/properties/[id]/calendar-blocks/route.ts`, `api/properties/[id]/[resource]/route.ts`.
- `apps/web/src/app/api/messages/read/route.ts`, `api/messages/delete/route.ts`, `api/bookings/create/route.ts`, `api/ical/sync/route.ts`, `api/traducir/route.ts` (lectura dirigida de codes/status/catches).

Supuestos: CSS Tailwind estándar y raíz16px; layout del panel mantiene padding16px horizontal y tarjetas padding24px; medidas y síntomas dinámicos requieren confirmación manual. No se consulta ni se afirma el estado de datos reales o sesiones actuales.
