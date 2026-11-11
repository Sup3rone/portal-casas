# Reporte mensual de comisiones (T-4739)

Reporte del **colaborador** (dueño de sus propiedades): reservas del mes con su desglose y la comisión de cada colaborador referidor. Se descarga en Excel y se envía solo cada mes a sus correos. El **ADMIN no lo usa**: administra funcionalidades (decisión del usuario, 10-11-2026). Para cualquier otro rol, la página da 404 y las APIs, 403.

## 1. Diagnóstico de infraestructura (10-11-2026)

| Pieza | Estado previo | Decisión |
|---|---|---|
| Correo | Resend (`lib/mailer.ts`), solo HTML, un destinatario, sin adjuntos | `sendEmail` acepta varios destinatarios y `attachments` (la API de Resend ya los soporta) |
| Cron | Nada: `vercel.json` solo tenía headers y `docker-compose.yml` es Postgres + MinIO para desarrollo | **Vercel Cron** en `apps/web/vercel.json`: `0 13 1 * *` (día 1, 13:00 UTC = 07:00 CDMX). Vercel manda `Authorization: Bearer $CRON_SECRET` |
| Excel | Sin librería | Generador propio `lib/xlsx.ts`, sin dependencias (ver §3) |
| Fechas | Reservas en columnas `date` («YYYY-MM-DD», sin zona). La fecha de hoy en MX ya existía: `inquiryToday()` (`America/Mexico_City`). En el panel se muestran con `Intl` `dateStyle: 'medium'` | El Excel usa ISO `YYYY-MM-DD` (sin ambigüedad entre es/en/fr ni de zona) |

## 2. Reglas del reporte (`lib/monthly-report.ts`)

- **Mes de una reserva:** el de su **fecha de entrada**, con **todos** sus importes.
  - Si cruza al mes siguiente, se marca: «Cruza de mes: 2 de 3 noches aquí · 1 en el siguiente».
  - En el mes siguiente aparece como «Continúa de 2026-11: importes contados allá», con importes vacíos, para no duplicar comisiones.
  - Una reserva que sale el día 1 no tiene noches en ese mes y no aparece en él.
- **Agrupación:** por propiedad, con subtotal por propiedad y total del mes. Las continuaciones no suman.
- **Comisión:** renta × % congelado (T-4738). Los totales se suman en centavos exactos.
- **Columnas:** fechas, huésped, referido por, renta, aseo, impuestos, total, % colaborador, comisión. En el Excel también propiedad, salida, noches (mes/total) y cruce de mes.
- **Datos del huésped:** **solo el nombre**, sin correo ni teléfono, igual en pantalla, Excel y correo.
- **Filtros:** mes (`?month=YYYY-MM`; por defecto el mes anterior) y colaborador referidor (solo los que aparecen en sus reservas). No hay paginación: la consulta ya está acotada a un mes y a sus propiedades.
- **Zona horaria:** el contenido no depende de ninguna zona, porque las fechas son civiles. Solo «qué mes es el anterior» se decide con la fecha de hoy en **America/Mexico_City** (UTC−6 fijo; México no tiene horario de verano desde 2022). Ejemplo: el 30-nov a las 23:30 en CDMX ya es 1-dic en UTC; con la hora UTC el cron reportaría noviembre por error, con la de MX reporta octubre.

## 3. Excel sin dependencias (`lib/xlsx.ts`)

Por qué no se usó una librería:
- **exceljs**: pesa ~1 MB instalado y trae decenas de dependencias.
- **SheetJS**: el paquete `xlsx@0.18.5` de npm está abandonado y tiene avisos de seguridad; la versión vigente se distribuye fuera de npm.
- Cualquier dependencia nueva cambia `pnpm-lock.yaml`, y Vercel instala con el lockfile congelado.

El reporte solo necesita una hoja con texto, números y negritas: ~130 líneas propias, auditables.

Cómo se arma:
- ZIP con método *stored* y CRC-32 propio, verificado con el vector estándar `123456789` → `CBF43926`.
- Cadenas inline, sin `sharedStrings`.
- Los números se escriben con su texto decimal exacto (`1234.55`), con formato `#,##0.00`.
- Negritas en el encabezado y los totales, y fila de encabezado congelada.
- Un texto que empieza con `= + - @` lleva un apóstrofo delante, para que no se interprete como fórmula.

Verificado con `openpyxl`, un lector independiente: abre sin advertencias, los números llegan como números, conserva el formato y las negritas, y Ñ, acentos y «» se leen bien.

## 4. Envío automático y bitácora

- **Destinatarios:** hasta 2 correos por colaborador (`User.reportEmails`, jsonb), capturados por él mismo en `/panel/reporte`. Se guardan en minúsculas y sin duplicados. Sin correos no se le envía nada.
- **Cron** (`/api/cron/monthly-report`):
  - si falta `CRON_SECRET` o tiene menos de 16 caracteres, responde 401 y lo registra en el log (falla cerrado);
  - compara el secreto con `timingSafeEqual`;
  - toma como mes el anterior a hoy en MX;
  - envía a cada colaborador con correos;
  - es **idempotente aunque corra dos veces a la vez**: antes de enviar, cada colaborador «reserva» su envío del mes con una fila `pending` bajo el índice único parcial `ReportDelivery_cron_once` (`userId`, `month` donde `trigger='cron'` y `status` es `pending` o `sent`), con `INSERT … ON CONFLICT DO NOTHING`. Un reintento de Vercel o un `curl` simultáneo queda como `skipped`;
  - un envío fallido pasa a `failed` y libera el hueco para el siguiente intento;
  - si el proceso muere a mitad, la fila queda `pending` y bloquea el reenvío automático (mejor no duplicar); el colaborador puede usar «Enviar ahora».
- **Bitácora `ReportDelivery`:** cada intento (`cron` o `manual`) deja una fila `sent`/`failed` con destinatarios, n.º de reservas y error. Si el último envío falló, `/panel/reporte` muestra un aviso con el error, y la tabla «Envíos» lista los 12 últimos. El fallo también va a `console.error` (logs de Vercel).
- **Envío manual / reenvío:** el botón «Enviar ahora el reporte de {mes}» manda el mes elegido **solo a los correos del propio colaborador**; no acepta destinatarios en la petición. Tiene un límite anti-abuso de **3 envíos manuales en 24 h** (`RATE_LIMITED`), contados en la bitácora.
- **Correo:** todo lo que se interpola en el HTML se escapa, incluido el nombre del colaborador, que controla el usuario. Los errores internos de BD se registran como `INTERNAL_ERROR` (el detalle va al log) para no mostrar SQL en el panel.
- **`CRON_SECRET`** de menos de 16 caracteres se rechaza y queda un `console.error` en cada ejecución, para que no falle en silencio.

## 5. Configuración (Emma, en Vercel)

| Variable | Valor | Nota |
|---|---|---|
| `CRON_SECRET` | Cadena aleatoria de ≥ 16 caracteres, p. ej. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` | Production. Vercel la manda como `Authorization: Bearer …` a los cron jobs |
| `RESEND_API_KEY` | Ya existe | — |
| `EMAIL_FROM` | Remitente con dominio verificado en Resend | Sin ella, `onboarding@resend.dev` solo entrega al dueño de la cuenta Resend |

Los **correos destinatarios no van en variables de entorno**: cada colaborador los captura en su panel (decisión del usuario, 10-11-2026, que sustituye a «1–2 correos por env» del pedido original).

## 6. Cómo probar / simular el cron

- **Local:** `CRON_SECRET=… pnpm dev` y después:
  `curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/monthly-report?month=2026-10"`.
  La respuesta trae `{ month, sent, failed, skipped, results }`. `?month=` solo sirve para probar: lleva el mismo secreto y se valida (`YYYY-MM`).
- **En Vercel:** Settings → Cron Jobs → «Run».
- **Tests offline:** `node scripts/test-monthly-report.cjs`.

## 7. Límites

- El reporte está en el idioma del panel (descarga). El correo automático y su Excel van en español.
- Resend en modo prueba (`onboarding@resend.dev`) solo entrega al dueño de la cuenta. El intento queda en la bitácora como `failed`, con el error de Resend.
- Sin paginación: si un colaborador llegara a cientos de reservas en un mes, la tabla sería larga, aunque correcta.
