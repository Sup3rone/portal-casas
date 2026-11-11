# Programa de referidos (T-4736)

Colaboradores externos («partners», no confundir con el rol `COLLABORATOR` de usuarios) promueven el sitio con un enlace o código propio, general o por propiedad. El sistema atribuye las consultas y reservas que llegan por ese enlace y guarda el porcentaje de comisión de cada colaborador. **Sin pagos ni depósitos**: aquí solo se registra la atribución.

## 1. Diagnóstico (Fase 1, 10-11-2026, leído en código; sin cambios)

### 1.1 Tablas de reservas y consultas

| Tabla | Campos vigentes | Quién la crea |
|---|---|---|
| `Message` (consulta) | id, propertyId, name, email, phone, lang, body, startDate, endDate, read, createdAt, userId | **Visitante público** → `POST /api/messages` |
| `Booking` (reserva) | id, propertyId, icalFeedId, startDate, endDate, source (`manual`/feeds), guestUserId, icalUid | **Gestor del panel** → `POST /api/bookings/create`; sync iCal → `api/ical/sync` |
| `BlockDate` | bloqueos manuales | panel |

**Cómo se crea hoy una reserva:**

1. El visitante envía una consulta desde la ficha (`MessageForm` → `/api/messages`). Validaciones (`inquiry-validation.ts`): rate limit 5/15 min por IP, idioma, propiedad publicada, contacto, capacidad, fechas y disponibilidad, revalidadas dentro del `INSERT` por cambios concurrentes. **No manda correo.**
2. ADMIN o el colaborador dueño abre la consulta en el panel (`MensajesList` / `panel/Inquiries` → `MessageModal`) y pulsa confirmar → `POST /api/bookings/create`. Validaciones: `requirePropertyManager`, fechas, `managedProperties` (solo propiedades que gestiona), huésped ligado a la propiedad y sin choque con `BlockDate`, todo dentro del `INSERT … SELECT`.
3. Tras guardar, la ruta manda el correo de confirmación al huésped (correo de la cuenta si hay `guestUserId`; si no, el de la consulta). Si el correo falla, la reserva no se pierde.

**Consecuencia para el diseño:** el navegador que trae la cookie `?ref=` es el del visitante, y quien crea la reserva es el gestor. Leer la cookie en `/api/bookings/create` atribuiría la reserva a la cookie del gestor. Por eso la atribución se guarda en la **consulta** y la reserva la **hereda** al confirmarse (§2.2).

### 1.2 Infraestructura de correo (para la tarea 3/3)

- **Servicio:** Resend (`resend@^6`), en `apps/web/src/lib/mailer.ts` → `sendEmail({ to, subject, html })`. No hay SMTP.
- **Variables:** `RESEND_API_KEY` y `EMAIL_FROM`. Sin `EMAIL_FROM`, el remitente es `onboarding@resend.dev`, que solo entrega al correo del dueño de la cuenta Resend.
- **Quién envía correo:** solo la confirmación de reserva (`/api/bookings/create`) y la recuperación de contraseña (`olvide-password/actions.ts`, enlace con `NEXT_PUBLIC_SITE_URL`).
- **Formulario de contacto/consulta:** **no envía correo** a nadie, ni al huésped ni al dueño. Solo guarda `Message`; el gestor la ve en el panel.
- Plantillas: HTML en línea, solo en español y sin i18n.

## 2. Diseño implementado

### 2.1 Datos (`scripts/sql/referral-program.sql`, NO ejecutado)

| Pedido | Implementado (convenciones del repo: tablas PascalCase, columnas camelCase) |
|---|---|
| `partner` (nombre, contacto, porcentaje_comision NUMERIC, activo, timestamps) | `Partner` (`name`, `email`, `phone`, `commissionPercent numeric(5,2)` CHECK 0–100, `active`, `createdAt`, `updatedAt`) |
| `referral_link` (partner_id, propiedad_id NULLABLE, codigo UNIQUE, timestamps) | `ReferralLink` (`partnerId`, `propertyId` nullable = general, `code` UNIQUE + CHECK `^[A-Z0-9-]{4,32}$`, timestamps); índices por `partnerId` y `propertyId` |
| `referred_by` en la reserva | `Booking.referredByPartnerId` + `Booking.referralLinkId` (nullable, índice), `Booking.referralMessageId` (índice único parcial: una consulta = una reserva atribuida) y `Booking.commissionPercent` (% congelado al confirmar) |
| — | `Message.referredByPartnerId` + `Message.referralLinkId` (dónde se captura) |

Todos los FKs son `ON DELETE RESTRICT`: nada se borra. Hoy no hay borrado de `Property` en el código.

### 2.2 Atribución

1. **Proxy** (`proxy.ts`): si una página llega con `?ref=CODIGO` de forma válida, escribe la cookie `alia_ref`. No consulta la BD, no redirige y no cambia la página.
2. **Consulta** (`/api/messages`): `referralAttribution(cookie)` busca el código y exige un colaborador **activo**. Graba `referredByPartnerId`/`referralLinkId` en `Message`. Si la cookie falta, el código no existe, el colaborador está inactivo o hay un error de BD, queda `null` y la consulta sigue igual.
3. **Reserva** (`/api/bookings/create`): `MessageModal` envía `messageId`. El `INSERT` copia la atribución de esa consulta solo si es **de la misma propiedad** (con la misma guarda `managedProperties`) y si **ninguna otra reserva salió ya de esa consulta**. También copia el % de comisión vigente en ese momento. Sin `messageId`, con una consulta sin referido o ya usada → `null`, y la reserva se guarda igual. La respuesta pública de `/api/messages` no incluye los campos de atribución.

**Cookie** (`lib/referral.ts`): `alia_ref`, valor = código normalizado, `Max-Age` 30 días, `HttpOnly`, `SameSite=Lax`, `Secure` en producción, `Path=/`. **Último clic gana:** un `?ref=` nuevo reemplaza al anterior. Un enlace por propiedad también atribuye si el visitante termina consultando otra casa (cuenta el colaborador, y el enlace queda registrado).

### 2.3 Panel `/panel/referidos` (solo ADMIN)

- Lista: nombre, comisión, estado, n.º de enlaces y n.º de reservas atribuidas, más el formulario de alta.
- Ficha `/panel/referidos/[id]`: edición, activar/desactivar (con confirmación), generar enlace (general o por propiedad; código propio opcional o generado de 8 caracteres sin 0/O/1/I/L), lista de enlaces con URL y botón **Copiar**, y tabla de reservas atribuidas.
- URL del enlace: `PUBLIC_SITE_URL` + `/?ref=CODE` o `/casas/<slug>?ref=CODE`, **sin idioma**: next-intl redirige al idioma del visitante.
- API: `GET/POST /api/panel/partners`, `GET/PATCH /api/panel/partners/[id]`, `POST /api/panel/partners/[id]/links`. **No hay DELETE.** Un código repetido devuelve 409.
- Otros roles: 404 en las páginas y 401/403 en las APIs. El sitio público no muestra datos de colaboradores.

### 2.4 Colaborador del panel con permiso de referidos

SQL aparte: `scripts/sql/referral-collaborator-permission.sql` (va después de `referral-program.sql`).


- **Permiso:** `User.canCreateReferralLinks`. Lo concede o revoca un ADMIN desde `/panel/usuarios/[id]` (botón «Permitir crear sus propios enlaces de referido», solo para COLLABORATOR).
  - Es la misma mutación atómica que «publicación», con auditoría `REFERRAL_PERMISSION`.
  - Cambiar el rol del usuario revoca el permiso.
- **Al conceder:** si el usuario no tiene Partner, se crea uno ligado (`Partner.userId`, único) con su nombre y correo, comisión **0 %** y activo. El ADMIN fija después el % en `/panel/referidos`, donde la ficha muestra «Usuario del panel».
- **Al revocar:** el Partner queda intacto; solo deja de poder crear enlaces nuevos. Sus enlaces siguen atribuyendo. Para cortar la atribución, el ADMIN desactiva al colaborador en Referidos.
- **`/panel/mis-referidos`** (menú «Mis referidos», visible solo con permiso):
  - genera enlaces generales o de **sus propias** propiedades (una ajena da 400);
  - copia sus enlaces y ve sus reservas atribuidas con el % congelado;
  - no ve a otros colaboradores ni puede cambiar su %.
  - Sin permiso, sin Partner ligado u otro rol: 404 en la página y 403 en `POST /api/panel/my-referrals/links`. Con el Partner desactivado ve lo suyo, pero no crea enlaces.
- Permiso, rol y Partner se leen de la BD en cada petición (`collaboratorPartner`), nunca del JWT.
- Sus reservas atribuidas pueden ser de casas de otros dueños si el visitante llegó por su enlace general: ve el título de la casa, las fechas y el %.

### 2.5 Nombre de quien refirió en consultas

`/panel/consultas` (tarjeta de consulta y lista de reservas) y `/admin/mensajes` muestran «Referido por {nombre}» cuando la consulta o la reserva tiene atribución. Lo ven el ADMIN y el colaborador dueño de la propiedad. El sitio público no lo muestra.

## 3. Límites conocidos

- La atribución nace en la consulta. Una reserva creada sin consulta (iCal, o confirmada desde otra vía) no se atribuye.
- No hay cálculo de importe de comisión: la reserva no guarda precio. Comisión = `commissionPercent` del colaborador; el importe se calcula fuera.
- Editar el % del colaborador no cambia las reservas ya atribuidas (llevan su % congelado). El partner no guarda historial de sus valores anteriores.
- Si un colaborador se desactiva **después** de la consulta, la reserva confirmada después **sí** se le atribuye: la atribución se gana con la consulta.
- El gestor puede dejar una reserva sin atribuir si la crea sin pasar por la consulta, o si borra la consulta antes. Es un control de confianza, no técnico.
- Si dos personas confirman la misma consulta a la vez, el índice único rechaza la segunda reserva (error 500, se reintenta).
- Un enlace no se desactiva por separado: se desactiva el colaborador completo.
