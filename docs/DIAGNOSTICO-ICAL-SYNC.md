# Diagnóstico — sync iCal no idempotente (T-4680, fase 1)

**Fecha:** 9 de noviembre de 2026. **Rama:** `alia/T-4680_ical-dedup-uid` (desde `main`). **Tipo:** solo lectura; no se cambió código.

Fuentes: código de `main`; consultas de solo lectura a **Respaldo** (`ep-solitary-shadow`); simulación con el arnés de tests del repo (SQLite en memoria y node-ical simulado, script temporal `scripts/diag-ical-twice.cjs`, que no se commitea). No se consultó producción.

## 1. De dónde viene el evento y dónde termina

| Paso | Dónde | Qué hace |
|---|---|---|
| Disparo | `CalendarBoard.tsx:54`, botón «Sincronizar» | `POST /api/ical/sync`. Lo ven ADMIN en `/admin/calendario` y `/panel/calendario`. **No hay cron.** |
| Feeds | `IcalFeed` (`id`, `propertyId`, `url`, `source`) | Se filtran por propiedades gestionadas y se omiten las anuales (`skippedAnnual`). **No existe UI ni API para crear feeds**: hoy se dan de alta solo por SQL. |
| Descarga y parseo | `node-ical@0.27.2`, `fromURL` | Devuelve un objeto indexado por UID. Las ediciones de una instancia (RECURRENCE-ID) van en `event.recurrences` y las RRULE en `event.rrule`; el sync no usa ninguna de las dos. |
| Escritura | `api/ical/sync/route.ts:45` | `INSERT` en `Booking` (`id` UUID nuevo, `propertyId`, `icalFeedId`, `startDate`, `endDate` como `toISOString().slice(0,10)`, `source` = `airbnb` si el feed es airbnb y **`google` en cualquier otro caso**). |
| UID | — | **No se guarda.** Solo se mete en un arreglo local para contar los eventos sincronizados. |

**Qué hace única una fila de `Booking` hoy:** solo su `id` UUID, distinto en cada inserción. En Respaldo, `Booking` tiene `Booking_pkey` e `idx_booking_property_dates`, este último **no único**. No existe ninguna restricción por feed+UID ni por feed+fechas.

## 2. Qué pasa al sincronizar (comprobado en el arnés)

Feed con dos eventos: `r1` (reserva, del 1 al 5 de marzo) y `b1` (bloqueo, del 10 al 12 de marzo).

| Sync | Feed | Filas del feed | Resultado |
|---|---|---|---|
| 1.ª | r1, b1 | 2 | Correcto |
| 2.ª | **El mismo feed** | **4** | ❌ Las dos filas se duplican |
| 3.ª | r1 con `STATUS:CANCELLED`, b1 ausente | **5** | ❌ La cancelada se inserta como ocupada; b1 nunca se borra |
| 4.ª | r1 movida un día (mismo UID) | **6** | ❌ Se crea una fila nueva; las fechas viejas siguen bloqueadas |

Además:
- **No es transaccional.** Si un feed falla a mitad del proceso, el endpoint devuelve 500 y deja insertadas las filas de los feeds anteriores. Un error de red en un feed corta los demás.
- **No guarda `lastSyncedAt`**, porque la columna no existe; el código registra «Skipping lastSyncedAt update».

## 3. Efecto en lo que ve la gente

| Consumidor | Qué hace con `Booking` | Efecto de los duplicados y de las filas fantasma |
|---|---|---|
| Ficha pública: `AvailabilityCalendar` (`casas/[slug]/page.tsx:58`) | Marca como ocupado cualquier día dentro de un rango | Los duplicados exactos no se notan, pero **cancelaciones y cambios de fecha dejan días bloqueados para siempre**: noches que no se pueden vender |
| Búsqueda `/casas` (`casas/page.tsx:58`) | `NOT EXISTS Booking` en el rango | La propiedad **desaparece de la búsqueda** en esas fechas fantasma |
| Consulta `POST /api/messages` (`:41-52`) | Rechaza fechas ocupadas | Rechaza consultas en fechas que en realidad están libres |
| Panel `CalendarBoard` / `panel/consultas` | Lista cada fila | Muestra entradas repetidas. **No se pueden desbloquear desde la UI**: `isUnlockableBlock` solo acepta `host-block`; se limpian solo por SQL |

## 4. Causa raíz y dónde corregir

**Causa raíz:** `route.ts` hace un `INSERT` incondicional por cada `VEVENT` y no guarda ni compara el UID, así que no hay nada que permita reconocer un evento ya importado. Tampoco hay reconciliación: nunca se borra ni se actualiza lo que dejó de estar en el feed.

**Dónde corregir:** dentro del bucle por feed de `api/ical/sync/route.ts`. Hay que reemplazar el `INSERT` por evento por una **reconciliación por feed**: el conjunto de UIDs vigentes del feed (sin los `CANCELLED`) pasa a ser la verdad de ese feed. Lo que coincide se inserta o se actualiza, y lo que no está se borra, incluidas las filas antiguas sin UID.

## 5. Otros hallazgos

- `Booking.summary` **existe en Respaldo** pero no está en `schema.ts` ni en ningún `scripts/sql`. Es una deriva del esquema; hay que confirmar si también existe en main.
- Cualquier feed que no sea airbnb se marca como `google`, aunque sea Booking.com o VRBO.
- Las fechas de los eventos de día completo dependen de la zona horaria del servidor (`toISOString`). En Vercel (UTC) es correcto; en un servidor con zona UTC+ se correrían un día.
- **Respaldo no tiene feeds ni filas iCal** (`IcalFeed` vacío; `Booking` tiene 4 manuales), así que allí no hay duplicados que limpiar.
- **Producción no se revisó.** Consulta de solo lectura para hacerlo:

```sql
SELECT "icalFeedId", "startDate", "endDate", count(*) AS copias
FROM "Booking" WHERE "icalFeedId" IS NOT NULL
GROUP BY 1, 2, 3 HAVING count(*) > 1 ORDER BY copias DESC;
```

## 6. Propuesta de corrección (fase 2, pendiente de aprobar)

**A) Recomendada: UID persistido y restricción en la base.**
1. SQL (aplicar en Respaldo y luego en main): columna `Booking.icalUid text` e índice **único parcial** `(icalFeedId, icalUid) WHERE icalFeedId IS NOT NULL`. La clave del UID incluye el RECURRENCE-ID cuando existe.
2. Una sentencia atómica por feed, que revalida el permiso: inserta o actualiza las fechas por `(icalFeedId, icalUid)` y borra las filas del feed cuyo UID ya no viene, o que no tienen UID (filas antiguas).
3. Los eventos `STATUS:CANCELLED` no entran en el conjunto vigente, así que se borran.
4. Si un feed falla al descargarse, **no se toca** ninguna de sus filas; se reporta en la respuesta (`failedFeeds`) y se sigue con los demás.
5. Test de regresión: el mismo feed dos veces da una fila por UID; también cubre cancelada, ausente, movida, feed caído y filas antiguas sin UID.

**B) Sin SQL:** reemplazar por feed (borrar todas sus filas e insertar las vigentes), deduplicando por UID en memoria. Es más simple y cabe mejor en 2 h, pero la base no lo garantiza: dos sincronizaciones al mismo tiempo podrían duplicar.

Se recomienda **A**: la base garantiza la unicidad aunque luego se añada un cron o haya reintentos, que es justo el riesgo del alta en Airbnb.

## 7. Fase 2 implementada (opción A)

| Pieza | Cambio |
|---|---|
| `scripts/sql/booking-ical-uid.sql` | `Booking.icalUid` e índice único parcial `Booking_icalFeed_uid_unique (icalFeedId, icalUid) WHERE icalFeedId IS NOT NULL`. No modifica filas. |
| `packages/db/src/schema.ts` | La misma columna y el mismo índice. |
| `apps/web/src/lib/ical-sync.ts` | Funciones puras: `isCalendar` (sin `VCALENDAR` cuenta como feed caído), `feedEvents` (una entrada por UID+RECURRENCE-ID, sin `CANCELLED`, y `nouid:<inicio>:<fin>` estable si falta el UID) e `icalDay` (los eventos de día completo usan la fecha local, no UTC). |
| `apps/web/src/app/api/ical/sync/route.ts` | Por feed: inserta o actualiza por `(icalFeedId, icalUid)` revalidando el permiso, y después borra las filas del feed que no están vigentes, incluidas las antiguas sin UID. Un feed caído o que devuelve HTML se salta sin tocar sus filas (`failedFeeds`). Si no se pudo leer ningún feed, responde 502. La respuesta añade `removed`. |
| `CalendarBoard.tsx` + `messages` | Si algún feed no se pudo leer, avisa «Sincronizado, pero N calendarios externos no se pudieron leer…» (es/en/fr). |
| `scripts/test-ical-idempotent.cjs` | Regresión: el mismo feed 2–3 veces da una fila por UID con el mismo id; una reserva movida actualiza su fila; cancelada y ausente se retiran; las filas antiguas sin UID se reemplazan; un feed caído o HTML conserva sus fechas; si ninguno se lee, 502; un calendario vacío válido limpia; manual y host-block quedan intactos; un colaborador solo reconcilia sus feeds. **Falla contra el `route.ts` anterior.** |

**Por qué no es una sola transacción:** el driver `neon-http` no tiene transacciones interactivas. Se ordenó para que un fallo parcial sea seguro: primero inserta o actualiza (el índice único impide duplicados aunque haya dos sincronizaciones a la vez) y después borra. Si el borrado falla, quedan fechas de más bloqueadas hasta el siguiente sync; nunca se liberan fechas por error.

**Sin resolver en esta tarea:** las RRULE no se expanden (se importa solo la primera ocurrencia, igual que antes; Airbnb no usa RRULE), los feeds que no son Airbnb se siguen marcando como `google`, y la deriva de `Booking.summary` sigue ahí.

## 8. Dar de alta el feed de Airbnb (cuando tengan el enlace)

No hay pantalla para hacerlo. En **Respaldo**, y después en main:

```sql
-- 1) Buscar la propiedad
SELECT id, slug, "rentalType" FROM "Property" WHERE slug = '<slug-de-la-casa>';
-- 2) Alta del feed (la URL de exportación de Airbnb lleva un token: no compartirla)
INSERT INTO "IcalFeed" (id, "propertyId", url, source)
VALUES (gen_random_uuid()::text, '<id-de-la-propiedad>', '<url .ics de Airbnb>', 'airbnb');
```

La propiedad tiene que ser `nocturna` o `ambas`: las `anual` se omiten.
