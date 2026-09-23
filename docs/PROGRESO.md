# Progreso del Proyecto — Portal de Casas

## 🎉 Producción en línea
✅ Sitio desplegado en Vercel (deploy automático desde push a main)
✅ Propiedades con galerías de fotos desde base de datos (Neon PostgreSQL)
✅ Tres idiomas: español, inglés y francés (next-intl, rutas /es /en /fr)
✅ Mapa Google embebido por propiedad
✅ Calendario de disponibilidad público

## 🔐 Autenticación (Auth.js v5) — COMPLETADO
✅ Registro, login y logout con Auth.js v5 beta
✅ Roles: ADMIN / CLIENT (VIEWER reservado para futuro)
✅ Protección de /admin por rol en el middleware (proxy.ts fusionado con next-intl)
✅ Redirección post-login por rol (ADMIN → admin, CLIENT → mi cuenta)
✅ Recuperación de contraseña por email (Resend, token con expiración de 1 hora)
❌ Sistema antiguo de admin (cookie admin_session SHA-256): EXTINTO y eliminado

## 👤 Perfil de huésped — COMPLETADO
✅ Página /mi-cuenta con datos del usuario
✅ Historial de consultas enviadas (con estado leído/pendiente)
✅ Historial de reservas confirmadas
✅ Ciclo completo: consulta → confirmación del admin → reserva visible en el perfil

## 📬 Formulario de consultas — COMPLETADO
✅ Formulario por propiedad con fechas y mensaje
✅ Cotizador de precio en vivo (calcula noche por noche según temporada y día de semana)
✅ Aviso de fechas ocupadas antes de enviar
✅ Mensajes vinculados a la cuenta del usuario si está logueado (userId)

## 💰 Tarifas por temporada — COMPLETADO
✅ Tabla SeasonRate (precio entre semana / fin de semana / prioridad)
✅ Precios base por propiedad (columnas en Property)
✅ Panel admin /admin/tarifas (alta y borrado de temporadas sin SQL)
✅ Datos cargados: $4,000 entre semana, $4,500 finde, $7,500 del 20-dic al 2-ene
🔄 Pendiente: Semana Santa (esperando fechas confirmadas del cliente)

## 🛠️ Panel de administración — COMPLETADO
✅ /admin/mensajes: lista de consultas, etiqueta 👤 para usuarios registrados,
   modal con fechas editables, confirmar crea la reserva, eliminar mensaje
✅ /admin/tarifas: gestión de temporadas
✅ /admin/calendario: calendario de ocupación mensual por propiedad con
   colores por origen (morado manual, rosa Airbnb, azul Google)
✅ Menú desplegable de admin en el Navbar (solo visible para ADMIN)

## 📧 Emails automáticos (Resend) — INFRAESTRUCTURA LISTA
✅ Mailer central (src/lib/mailer.ts)
✅ Email de recuperación de contraseña — FUNCIONANDO
✅ Email de confirmación de reserva al huésped — FUNCIONANDO
   (registrados reciben al correo de su cuenta; anónimos, al del formulario)
🔄 Modo pruebas: solo entrega al correo de registro de Resend
🔄 Pendiente: verificar dominio del cliente en Resend para producción
🔄 Pendiente: botón de WhatsApp (wa.me) en el email y la web
🔄 Pendiente: notificación al servicio de limpieza (falta decidir diseño de contactos)

## 🔄 En proceso / esperando al cliente
- Links iCal de Airbnb (para el botón de sincronización del calendario admin)
- Verificación del dominio en Resend
- Fechas exactas de Semana Santa

## 📋 Backlog
- WhatsApp Cloud API de Meta (con costo por conversación, requiere plantillas aprobadas)
- Meses del calendario público en los 3 idiomas
- Limpieza de artefactos Prisma (carpetas viejas y dependencias)
- i18n completo de páginas de auth y mi-cuenta (hoy hardcodeadas en español)
- Cron de Vercel para sincronización iCal automática diaria
- Storage propio de imágenes (MinIO en Raspberry Pi o S3/R2)

## 🧠 Lecciones aprendidas (no repetir)
- Variables de entorno: nunca placeholders en código ni `set` viejos en la terminal
- Server Actions deben devolver void; errores van por redirect(?error=...)
- params en Next.js 16 son Promise → await siempre
- Convención DB: tablas PascalCase con comillas, columnas camelCase
- Validar en consola del servidor antes de teorizar (los errores del navegador mienten)
- Un cambio, un commit: saber exactamente quién rompió qué
