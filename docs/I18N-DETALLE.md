# Internacionalización del detalle de casas

## Inventario de textos encontrados

- `src/app/[locale]/casas/[slug]/page.tsx`: EL DESTINO, LO QUE OFRECE ESTE LUGAR, AMENIDADES, HABITACIONES, RESERVAR, DISPONIBILIDAD; Vista al mar, Acceso a la playa, WiFi, Estacionamiento gratuito, Cocina, Televisión, WiFi de alta velocidad, Cocina equipada, Aire acondicionado, Piscina, Recámaras con ropa de cama premium y Baños completos.
- La misma página tiene datos actualmente no renderizados (`labels` y `categoryData`): EL LUGAR, EN EL LUGAR, Smart TV, Frente al mar, Lavadora y secadora, Terraza con vista al mar, Ascensor, Seguridad 24/7 y Limpieza profesional. Sus textos también se conectaron a traducciones sin cambiar su uso.
- `AvailabilityCalendar.tsx`: Enero–Diciembre, Lu/Ma/Mi/Ju/Vi/Sá/Do, Mes anterior/Mes siguiente (aria-label), Disponible/Ocupado. Las etiquetas ISO de cada celda se reemplazan por una fecha completa localizada.
- `MessageForm.tsx`: Nombre, Email, Teléfono (opcional), Llegada, Salida, Nº Huéspedes, Precio Total, A consultar, Mensaje, ENVIANDO..., ENVIAR CONSULTA, Mensaje enviado. Te contactaremos pronto., Algunas fechas están ocupadas — revisa el calendario., La fecha de salida debe ser posterior a la llegada., Error al enviar. Intenta de nuevo. El importe tenía formato fijo es-MX; ahora sigue el locale, manteniendo MXN y el cálculo existente.
- `SectionSlider.tsx`: Foto N (alt), Anterior/Siguiente e Ir a foto N (aria-label).
- `LocationMap.tsx`: Ubicación — dirección (title); el mapa tenía hl=es, ahora sigue el idioma de la ruta.
- Elementos compartidos visibles en el detalle: ADMIN, MENSAJES, TARIFAS, CALENDARIO, MI CUENTA, SALIR, LOGIN, REGISTRARSE en Navbar; Casas en Footer; Cambiar idioma (aria-label) en LocaleSwitcher. Se reutilizan las claves existentes de nav salvo la nueva cambiarIdioma. Los nombres Español/English/Français se mantienen como autodenominaciones.
- No existe metadata/generateMetadata de título de documento en el detalle ni en su layout. No se añade metadata. Título y descripción de la propiedad ya usan los campos es/en/fr de base de datos; dirección, ciudad, marca, correo de contacto, símbolos, números y MXN se mantienen.
- No hay atributos placeholder de fecha en el formulario. dd/mm/aaaa pertenece al control nativo type=date, no al diccionario. Los mensajes HTML de required, email, min/max y los controles de video/mapa pertenecen al navegador o al proveedor externo.

## Claves nuevas (es / en / fr)

| Clave | es | en | fr |
| --- | --- | --- | --- |
| details.destino | EL DESTINO | THE DESTINATION | LA DESTINATION |
| details.ofrece | LO QUE OFRECE ESTE LUGAR | WHAT THIS PLACE OFFERS | CE QUE PROPOSE CE LOGEMENT |
| details.amenidades | AMENIDADES | AMENITIES | ÉQUIPEMENTS |
| details.habitaciones | HABITACIONES | BEDROOMS | CHAMBRES |
| details.reservar | RESERVAR | BOOK | RÉSERVER |
| details.amenities.vistaMar | Vista al mar | Ocean view | Vue sur la mer |
| details.amenities.accesoPlaya | Acceso a la playa | Beach access | Accès à la plage |
| details.amenities.wifi | WiFi | WiFi | WiFi |
| details.amenities.estacionamiento | Estacionamiento gratuito | Free parking | Stationnement gratuit |
| details.amenities.cocina | Cocina | Kitchen | Cuisine |
| details.amenities.television | Televisión | TV | Télévision |
| details.amenities.wifiRapido | WiFi de alta velocidad | High-speed WiFi | WiFi haut débit |
| details.amenities.cocinaEquipada | Cocina equipada | Equipped kitchen | Cuisine équipée |
| details.amenities.aire | Aire acondicionado | Air conditioning | Climatisation |
| details.amenities.piscina | Piscina | Pool | Piscine |
| details.amenities.smartTV | Smart TV | Smart TV | Télévision connectée |
| details.amenities.frenteMar | Frente al mar | Oceanfront | En bord de mer |
| details.amenities.lavadora | Lavadora y secadora | Washer and dryer | Lave-linge et sèche-linge |
| details.amenities.terraza | Terraza con vista al mar | Terrace with ocean view | Terrasse avec vue sur la mer |
| details.amenities.ascensor | Ascensor | Elevator | Ascenseur |
| details.amenities.seguridad | Seguridad 24/7 | 24/7 security | Sécurité 24 h/24 |
| details.amenities.limpieza | Limpieza profesional | Professional cleaning | Ménage professionnel |
| details.amenities.ropaCama | Recámaras con ropa de cama premium | Bedrooms with premium bed linen | Chambres avec linge de lit haut de gamme |
| details.amenities.banos | Baños completos | Full bathrooms | Salles de bains complètes |
| details.lugar | EL LUGAR | THE PLACE | LE LOGEMENT |
| details.enLugar | EN EL LUGAR | AT THE PROPERTY | SUR PLACE |
| details.calendar.mesAnterior | Mes anterior | Previous month | Mois précédent |
| details.calendar.mesSiguiente | Mes siguiente | Next month | Mois suivant |
| details.form.nombre | Nombre | Name | Nom |
| details.form.email | Email | Email | E-mail |
| details.form.telefono | Teléfono (opcional) | Phone (optional) | Téléphone (facultatif) |
| details.form.llegada | Llegada | Check-in | Arrivée |
| details.form.salida | Salida | Check-out | Départ |
| details.form.huespedes | Nº Huéspedes | Number of guests | Nombre de voyageurs |
| details.form.precioTotal | Precio Total | Total Price | Prix total |
| details.form.consultar | A consultar | On request | Sur demande |
| details.form.mensaje | Mensaje | Message | Message |
| details.form.enviando | ENVIANDO... | SENDING... | ENVOI EN COURS... |
| details.form.enviar | ENVIAR CONSULTA | SEND INQUIRY | ENVOYER LA DEMANDE |
| details.form.exito | Mensaje enviado. Te contactaremos pronto. | Message sent. We will contact you soon. | Message envoyé. Nous vous contacterons bientôt. |
| details.form.fechasOcupadas | Algunas fechas están ocupadas — revisa el calendario. | Some dates are unavailable — check the calendar. | Certaines dates sont indisponibles — consultez le calendrier. |
| details.form.fechasInvalidas | La fecha de salida debe ser posterior a la llegada. | The check-out date must be after the check-in date. | La date de départ doit être postérieure à la date d’arrivée. |
| details.form.error | Error al enviar. Intenta de nuevo. | Could not send your message. Please try again. | Impossible d’envoyer votre message. Réessayez. |
| details.gallery.foto | Foto {number} | Photo {number} | Photo {number} |
| details.gallery.anterior | Anterior | Previous | Précédent |
| details.gallery.siguiente | Siguiente | Next | Suivant |
| details.gallery.irFoto | Ir a foto {number} | Go to photo {number} | Aller à la photo {number} |
| details.mapTitle | Ubicación — {address} | Location — {address} | Emplacement — {address} |
| nav.cambiarIdioma | Cambiar idioma | Change language | Changer de langue |

Se reutilizan details.disponibilidad, details.guests, details.bedrooms, details.bathrooms, common.disponible, common.ocupado y las claves existentes de nav y footer.

## Fechas y formatos

- Mes/año, días abreviados y aria-label de fecha: Intl.DateTimeFormat con es/en/fr; semana de lunes a domingo. Las abreviaturas/puntuación provienen de Intl, sin diccionarios de meses/días. Las fechas se construyen en hora local, sin conversión UTC.
- Sin convención inglesa previa: se conserva la intención día/mes/año usando es-MX, en-GB y fr-FR en lang del formulario y los inputs. Los valores siguen siendo YYYY-MM-DD. El navegador y el sistema operativo pueden imponer el formato visual y el idioma de su validación nativa; lang no garantiza sustituir el placeholder nativo. No se cambia type=date ni se añade un datepicker.
- El importe se presenta con el locale regional anterior; la moneda sigue siendo MXN y no se altera el cálculo por noches.
- Los skeletons no contienen texto español y los componentes reciben traducciones desde NextIntlClientProvider en el render inicial; no se traducen mediante un efecto posterior.

## Comprobación manual

1. Ejecutar pnpm dev desde la raíz y abrir la misma propiedad en /es/casas/SLUG, /en/casas/SLUG y /fr/casas/SLUG.
2. Revisar títulos, amenidades, encabezados, mapa, calendario (mes, días, leyenda y navegación) y todas las etiquetas y mensajes del formulario. Inspeccionar alt/title/aria-label con DevTools o lector de pantalla.
3. Elegir llegada/salida desde el calendario y editar inputs: verificar que sincronía, rango y precio conservan su comportamiento.
4. Probar fechas invertidas/ocupadas, ausencia de tarifa y envío exitoso/fallido en un entorno de prueba; no enviar consultas reales solo para probar. El estado ENVIANDO debe estar traducido.
5. Activar Slow 3G y Disable cache antes de navegar desde el listado; comprobar skeleton y primer contenido sin textos españoles en /en o /fr. Probar también con sesión de cliente y administrador para el menú.

## Fuera de alcance

- Resueltos posteriormente en el lote de limpieza (05 Oct 2026): enlace localizado del footer, listado de items de CategorySection y envío del locale en lang del formulario. Ver `docs/LIMPIEZA-MENOR.md`.
- Login/registro, listado y pantallas de administración conservan otros textos fijos; no se revisan ni corrigen aquí.

