# Desglose de precio por reserva (T-4738)

Cada reserva lleva sus campos para facturar (renta, aseo e impuestos) y la comisión del colaborador. La comisión se calcula y no se edita. Continúa [REFERIDOS.md](REFERIDOS.md) (T-4736).

## 1. Diagnóstico (10-11-2026, leído en código)

- **La reserva no guardaba ningún monto.** `Booking` tenía `id, propertyId, icalFeedId, startDate, endDate, source, guestUserId, icalUid` más la atribución de T-4736 (`referredByPartnerId`, `referralLinkId`, `referralMessageId`, `commissionPercent`).
- **No hay edición de reservas en el panel.** Se crean desde la consulta (`MessageModal` → `POST /api/bookings/create`), sin datos de precio. Los bloqueos (`source = 'host-block'`) viven en la misma tabla y se editan en `panel-mutations.ts`.
- **El «total» que se ve en `/panel/consultas` es una estimación en pantalla** (`Inquiries.tsx`): noches × tarifa base, solo si la renta es nocturna, la tarifa de entre semana es igual a la de fin de semana y no hay temporada. No se guarda.
- **Tarifas:** `Property.baseWeekdayPrice`/`baseWeekendPrice` y `SeasonRate` (enteros MXN por noche) sirven para cotizar, no para facturar.
- **El snapshot del % ya existía:** `Booking.commissionPercent` (T-4736) se copia del partner al confirmar. No se creó otra columna.
- **Lecturas públicas de `Booking`** (ficha, `mi-cuenta`, `/api/messages`): todas usan columnas explícitas (fechas, origen). Agregar campos no los expone.

## 2. Datos — `scripts/sql/booking-price-breakdown.sql` (NO ejecutado)

| Pedido | Implementado (convención camelCase del repo) |
|---|---|
| `cleaning_cost` NUMERIC NULL | `Booking.cleaningCost numeric(12,2)` CHECK ≥ 0 |
| `taxes` NUMERIC NULL | `Booking.taxes numeric(12,2)` CHECK ≥ 0 |
| (base de la comisión) | `Booking.rentAmount numeric(12,2)` CHECK ≥ 0 — renta/hospedaje (decisión del usuario 10-11-2026) |
| `commission_percent` snapshot | Ya existe: `Booking.commissionPercent numeric(5,2)` (T-4736) |

Orden: Respaldo → QA → main → deploy. **Sin el SQL fallan todos los INSERT en `Booking`**, porque Drizzle incluye todas las columnas del schema: se rompen el sync iCal, los bloqueos y las altas de reserva, además de `/panel/reservas/[id]`. Las reservas existentes quedan en NULL.

## 3. Cálculo (`apps/web/src/lib/booking-breakdown.ts`)

- **Comisión = renta × % congelado.** El aseo y los impuestos **no** generan comisión.
- **Redondeo:** a centavos, **mitad hacia arriba**, una sola vez al final. Se hace con enteros (BigInt, centavos × centésimas de punto / 10 000), sin flotantes.
  - 1,234.55 × 12.50 % = 154.31875 → **154.32**
  - 100.10 × 2.50 % = 2.5025 → **2.50**
  - 0.10 × 5 % = 0.005 → **0.01**
- **Sin renta o sin %** (reserva sin colaborador o legacy): la comisión es «—».
- **Total mostrado** = renta + aseo + impuestos capturados. La comisión no se suma: es un pago al colaborador.
- **Importes válidos:** número ≥ 0 con punto decimal y hasta 2 decimales, máximo 9,999,999,999.99. Vacío = sin dato. Se rechazan negativos, comas, exponentes, símbolos y espacios internos.
- La misma función calcula en la pantalla (en vivo) y valida en el servidor.

### 3.1 Renta automática e IVA 16 % (pedido del usuario, 10-11-2026)

- **Regla única de cotización:** `lib/stay-quote.ts` (`quoteStay`) se extrajo de `MessageForm`, que ahora la usa. Así el panel cobra lo mismo que vio el huésped. Se cobra noche por noche y la salida no se cobra. Sábado y domingo son fin de semana. Las temporadas cuentan con inicio y fin incluidos, y gana la de mayor prioridad; si no hay temporada, se usa la tarifa base. Si alguna noche no tiene precio, el resultado es null. Un test compara 400 casos aleatorios con la regla anterior: dan lo mismo.
- **Al confirmar** (`/api/bookings/create`) se guardan `rentAmount` (cotización con las tarifas **vigentes en ese momento**) y `taxes` = 16 % de la renta. El aseo todavía no existe en ese punto. Si falla, la reserva se crea igual.
- **En la vista**, una reserva sin renta guardada (legacy o iCal) se **precarga** con la cotización actual y un aviso. **No se guarda** hasta pulsar «Guardar desglose». Si la renta guardada difiere de la tarifa, aparece el botón «Usar tarifa de la propiedad ($X)».
- **IVA:** `taxes` = 16 % × (renta + aseo), a centavos y con la mitad hacia arriba (`suggestedTaxes`, `DEFAULT_TAX_PERCENT`).
  - Está en modo automático mientras no se escriba otro importe, y se recalcula al cambiar la renta o el aseo.
  - Si se escribe a mano, pasa a manual y deja de recalcularse; «Calcular 16 % (IVA)» lo devuelve a automático.
  - Un impuesto guardado que no coincide con el 16 % se respeta como manual.

## 4. Panel

- **`/panel/reservas/[id]`**, solo para ADMIN o el colaborador dueño de la propiedad. Cualquier otro caso, o un bloqueo, da 404.
  - Muestra propiedad, fechas, origen, huésped y referido.
  - Tres campos editables.
  - El % y la comisión son de solo lectura y se recalculan al escribir.
  - Las reservas legacy muestran un aviso y los campos vacíos.
- **`/panel/reservas`** («Reservas» en el menú de ADMIN y colaborador): lista de reservas sin bloqueos, con renta, aseo, impuestos, referido (%) y comisión derivada. El ADMIN ve todas; el colaborador, las de sus propiedades; otros roles son redirigidos.
- **Otros enlaces de entrada:** «Ver reserva» en la lista de reservas de `/panel/consultas` y «Ver reserva y desglose» en el detalle del calendario (`CalendarBoard`). En ninguno de los dos aparece para bloqueos.
- **API `PATCH /api/panel/bookings/[id]`:**
  - solo acepta `rentAmount`, `cleaningCost` y `taxes` (cualquier otra clave, incluido el %, da 400);
  - solo actualiza los campos presentes: un PATCH parcial no vacía los demás, y un valor vacío explícito borra ese dato;
  - responde `no-store`.

## 5. Límites

- **Supuesto:** el 16 % se aplica sobre renta **+ aseo**, como IVA de ambos servicios. No incluye ISH (impuesto estatal al hospedaje). Si la base debe ser solo la renta, se cambia en `suggestedTaxes`.
- Cambiar las tarifas después de confirmar no reescribe la renta guardada; el botón «Usar tarifa» ofrece la vigente.

- No hay importación automática de precios (Airbnb, tarifas): todo se captura a mano.
- No hay moneda distinta de MXN.
- No hay historial de cambios del desglose. Lo guardado es lo último que se capturó.
- La última escritura gana: el formulario manda los tres campos, así que dos personas editando a la vez se pisan sin aviso.
- El formato de miles (sobre todo el espacio de fr-FR) depende de los datos ICU de Node y del navegador. Puede dar un aviso de hidratación en consola; el importe no cambia.
- La vista muestra al colaborador dueño el correo del huésped, igual que ya lo hacen consultas y el calendario.
