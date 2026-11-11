import { pgTable, pgEnum, text, timestamp, integer, boolean, date, doublePrecision, varchar, index, unique, foreignKey, primaryKey, check, jsonb, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum("UserRole", ["ADMIN", "VIEWER", "CLIENT", "COLLABORATOR"]);
export const mediaTypeEnum = pgEnum('MediaType', ['PHOTO', 'VIDEO']);

export const siteContent = pgTable('SiteContent', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
}, table => [check('SiteContent_key_check', sql`${table.key} in ('about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook', 'featured_property_id', 'contact_whatsapp', 'home_background_video', 'listing_background_image', 'about_title_es', 'about_title_en', 'about_title_fr', 'about_image', 'home_background_videos')`)]);

export const users = pgTable("User", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  canPublishProperties: boolean('canPublishProperties').notNull().default(false),
  // T-4736: el ADMIN permite que un COLLABORATOR cree sus propios enlaces de referido.
  canCreateReferralLinks: boolean('canCreateReferralLinks').notNull().default(false),
  // T-4739: hasta 2 correos a los que se envía el reporte mensual del colaborador.
  reportEmails: jsonb('reportEmails').$type<string[]>().notNull().default([]),
  passwordHash: text("passwordHash"),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  role: userRoleEnum("role").notNull().default("CLIENT"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, table => [
  check('User_reportEmails_check', sql`jsonb_typeof(${table.reportEmails}) = 'array' and jsonb_array_length(${table.reportEmails}) <= 2`),
]);

export const properties = pgTable('Property', {
  sectionsOrder: jsonb('sectionsOrder').$type<('destino' | 'amenidades' | 'habitaciones' | 'lugar' | 'advertencias' | 'mapa' | 'reserva')[]>(),
  sectionsEnabled: jsonb('sectionsEnabled').$type<Partial<Record<'destino' | 'amenidades' | 'habitaciones' | 'lugar' | 'advertencias' | 'mapa' | 'reserva', boolean>>>(),
  sectionTitles: jsonb('sectionTitles').$type<{ heroVideoUrl: string | null; titles: Partial<Record<string, Record<'es' | 'en' | 'fr', string>>> }>(),
  sectionBgInicio: text('sectionBgInicio'),
  sectionBgMapa: text('sectionBgMapa'),
  sectionBgReserva: text('sectionBgReserva'),
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  titleEs: text('titleEs').notNull(),
  titleEn: text('titleEn').notNull(),
  titleFr: text('titleFr').notNull(),
  descEs: text('descEs').notNull(),
  descEn: text('descEn').notNull(),
  descFr: text('descFr').notNull(),
  address: text('address').notNull(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  city: text('city').notNull(), // Legacy: conservado; ya no es obligatorio en el editor/API.
  state: text('state'),
  destinationCity: text('destinationCity'), // city del catálogo; evita colisión con city legacy.
  maxGuests: integer('maxGuests').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: doublePrecision('bathrooms').notNull(),
  published: boolean('published').notNull().default(false),
  ownerId: text('ownerId').notNull().references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  baseWeekdayPrice: integer('baseWeekdayPrice'),
  baseWeekendPrice: integer('baseWeekendPrice'),
  rentalType: text('rentalType').$type<'nocturna' | 'anual' | 'ambas'>().notNull().default('nocturna'),
  contactName: text('contactName'),
  contactEmail: text('contactEmail'),
  whatsapp: text('whatsapp'),
  // T-4683: WhatsApp de la persona de limpieza (solo panel; nunca se publica).
  cleaningWhatsapp: text('cleaningWhatsapp'),
}, table => [
  index('Property_ownerId_idx').on(table.ownerId),
  check('Property_section_titles_check', sql`${table.sectionTitles} is null or jsonb_typeof(${table.sectionTitles}) = 'object'`),
  check('Property_destination_pair_check', sql`(${table.state} is null and ${table.destinationCity} is null) or (${table.state} is not null and ${table.destinationCity} is not null and btrim(${table.state}) <> '' and btrim(${table.destinationCity}) <> '')`),
  check('Property_rentalType_check', sql`${table.rentalType} in ('nocturna', 'anual', 'ambas')`),
  check('Property_whatsapp_check', sql`${table.whatsapp} is null or ${table.whatsapp} ~ '^[0-9]{8,15}$'`),
  check('Property_cleaningWhatsapp_check', sql`${table.cleaningWhatsapp} is null or ${table.cleaningWhatsapp} ~ '^[0-9]{8,15}$'`),
]);

export const media = pgTable('Media', {
  id: text('id').primaryKey(),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  type: mediaTypeEnum('type').notNull().default('PHOTO'),
  order: integer('order').notNull().default(0),
  category: varchar('category', { length: 50 }).default('principal').notNull(),
  isCover: boolean('isCover').notNull().default(false),
  coverOrder: integer('coverOrder'),
}, table => [
  unique('Media_id_propertyId_unique').on(table.id, table.propertyId),
  check('Media_cover_check', sql`(${table.isCover} and ${table.type} = 'PHOTO' and ${table.coverOrder} is not null and ${table.coverOrder} between 0 and 4) or (not ${table.isCover} and ${table.coverOrder} is null)`),
]);

export const propertySections = pgTable('PropertySection', {
  propertyId: text('propertyId').notNull(),
  section: varchar('section', { length: 20 }).notNull(),
  descriptionEs: text('descriptionEs'),
  descriptionEn: text('descriptionEn'),
  descriptionFr: text('descriptionFr'),
  heroMediaId: text('heroMediaId'),
  photoMediaIds: jsonb('photoMediaIds').$type<string[]>(),
}, table => [
  primaryKey({ columns: [table.propertyId, table.section] }),
  check('PropertySection_section_check', sql`${table.section} in ('destino', 'amenidades', 'habitaciones', 'lugar', 'advertencias')`),
  check('PropertySection_photos_check', sql`${table.photoMediaIds} is null or case when jsonb_typeof(${table.photoMediaIds}) = 'array' then jsonb_array_length(${table.photoMediaIds}) <= 2 else false end`),
  foreignKey({ name: 'PropertySection_property_fk', columns: [table.propertyId], foreignColumns: [properties.id] }).onDelete('cascade'),
  foreignKey({ name: 'PropertySection_hero_property_fk', columns: [table.heroMediaId, table.propertyId], foreignColumns: [media.id, media.propertyId] }).onDelete('no action'),
]);

// T-4736: programa de referidos. Nada se borra: "active" = false desactiva al colaborador y sus enlaces.
export const partners = pgTable('Partner', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  commissionPercent: numeric('commissionPercent', { precision: 5, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
  // Usuario COLLABORATOR ligado (al conceder el permiso); null = colaborador externo sin cuenta.
  userId: text('userId').references(() => users.id, { onDelete: 'restrict' }),
  // T-4767: dueño (COLLABORATOR) que administra a este referidor; null = alta del ADMIN (solo lo ve el ADMIN).
  ownerId: text('ownerId').references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, table => [
  unique('Partner_userId_unique').on(table.userId),
  index('Partner_ownerId_idx').on(table.ownerId),
  check('Partner_name_check', sql`btrim(${table.name}) <> ''`),
  check('Partner_commission_check', sql`${table.commissionPercent} >= 0 and ${table.commissionPercent} <= 100`),
]);

// propertyId null = enlace general; con valor = enlace a esa ficha.
export const referralLinks = pgTable('ReferralLink', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  partnerId: text('partnerId').notNull().references(() => partners.id, { onDelete: 'restrict' }),
  propertyId: text('propertyId').references(() => properties.id, { onDelete: 'restrict' }),
  code: text('code').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, table => [
  unique('ReferralLink_code_unique').on(table.code),
  check('ReferralLink_code_check', sql`${table.code} ~ '^[A-Z0-9-]{4,32}$'`),
  index('ReferralLink_partnerId_idx').on(table.partnerId),
  index('ReferralLink_propertyId_idx').on(table.propertyId),
]);

export const messages = pgTable('Message', {
  id: text('id').primaryKey(),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  lang: text('lang').notNull().default('es'),
  body: text('body').notNull(),
  startDate: date('startDate'),
  endDate: date('endDate'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  userId: text('userId').references(() => users.id),
  // T-4736: atribución leída de la cookie de referido al enviar la consulta.
  referredByPartnerId: text('referredByPartnerId').references(() => partners.id, { onDelete: 'restrict' }),
  referralLinkId: text('referralLinkId').references(() => referralLinks.id, { onDelete: 'restrict' }),
}, table => [index('Message_referredByPartnerId_idx').on(table.referredByPartnerId)]);

export const icalFeeds = pgTable('IcalFeed', {
  id: text('id').primaryKey(),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  source: text('source').notNull().default('MANUAL'),
  // T-4739: estado de la última sincronización (botón, cron diario o refresco antes de una consulta).
  lastAttemptAt: timestamp('lastAttemptAt', { withTimezone: true }),
  lastSyncedAt: timestamp('lastSyncedAt', { withTimezone: true }),
  lastError: text('lastError'),
}, table => [unique('IcalFeed_id_propertyId_unique').on(table.id, table.propertyId)]);

export const bookings = pgTable('Booking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  icalFeedId: text('icalFeedId').references(() => icalFeeds.id),
  startDate: date('startDate').notNull(),
  endDate: date('endDate').notNull(),
  source: text('source').notNull().default('manual'),
  guestUserId: text('guestUserId').references(() => users.id),
  // T-4680: UID del VEVENT (+RECURRENCE-ID) para que el sync iCal sea idempotente.
  icalUid: text('icalUid'),
  // T-4736: copiada de la consulta al confirmar la reserva; null = sin atribución.
  referredByPartnerId: text('referredByPartnerId').references(() => partners.id, { onDelete: 'restrict' }),
  referralLinkId: text('referralLinkId').references(() => referralLinks.id, { onDelete: 'restrict' }),
  // Consulta de la que salió la atribución: una consulta atribuye como mucho UNA reserva. Sin FK: las consultas se pueden borrar.
  referralMessageId: text('referralMessageId'),
  // % de comisión congelado al confirmar; editar el colaborador no cambia lo ya atribuido.
  commissionPercent: numeric('commissionPercent', { precision: 5, scale: 2 }),
  // T-4738: desglose para facturar (MXN, nullable = sin capturar). Comisión = rentAmount × commissionPercent.
  rentAmount: numeric('rentAmount', { precision: 12, scale: 2 }),
  cleaningCost: numeric('cleaningCost', { precision: 12, scale: 2 }),
  taxes: numeric('taxes', { precision: 12, scale: 2 }),
}, table => [index('Booking_referredByPartnerId_idx').on(table.referredByPartnerId),
  check('Booking_rentAmount_check', sql`${table.rentAmount} is null or ${table.rentAmount} >= 0`),
  check('Booking_cleaningCost_check', sql`${table.cleaningCost} is null or ${table.cleaningCost} >= 0`),
  check('Booking_taxes_check', sql`${table.taxes} is null or ${table.taxes} >= 0`),
  uniqueIndex('Booking_referralMessageId_unique').on(table.referralMessageId).where(sql`${table.referralMessageId} is not null`), foreignKey({
  name: 'Booking_icalFeed_property_fk',
  columns: [table.icalFeedId, table.propertyId],
  foreignColumns: [icalFeeds.id, icalFeeds.propertyId],
}), uniqueIndex('Booking_icalFeed_uid_unique').on(table.icalFeedId, table.icalUid).where(sql`${table.icalFeedId} is not null`)]);

export const blockDates = pgTable('BlockDate', {
  id: text('id').primaryKey(),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  startDate: date('startDate').notNull(),
  endDate: date('endDate').notNull(),
  createdBy: text('createdBy').notNull().references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, table => [
  check('BlockDate_range_check', sql`${table.endDate} > ${table.startDate}`),
  index('BlockDate_property_dates_idx').on(table.propertyId, table.startDate, table.endDate),
]);

export const seasonRates = pgTable('SeasonRate', {
  id: text('id').primaryKey(),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                    // ej: "Temporada alta navidad"
  startDate: date('startDate').notNull(),           // YYYY-MM-DD
  endDate: date('endDate').notNull(),
  weekdayPrice: integer('weekdayPrice').notNull(),  // MXN por noche lun-vie
  weekendPrice: integer('weekendPrice').notNull(),  // MXN por noche sáb-dom
  priority: integer('priority').notNull().default(0), // mayor = gana si se solapan temporadas
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
});

// T-4739: bitácora de envíos del reporte mensual (automático o manual). Los fallos se muestran en /panel/reporte.
export const reportDeliveries = pgTable('ReportDelivery', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'restrict' }),
  month: text('month').notNull(),
  trigger: text('trigger').$type<'cron' | 'manual'>().notNull(),
  status: text('status').$type<'pending' | 'sent' | 'failed'>().notNull(),
  recipients: jsonb('recipients').$type<string[]>().notNull().default([]),
  bookingCount: integer('bookingCount').notNull().default(0),
  error: text('error'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('ReportDelivery_user_month_idx').on(table.userId, table.month, table.createdAt),
  check('ReportDelivery_month_check', sql`${table.month} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
  check('ReportDelivery_trigger_check', sql`${table.trigger} in ('cron', 'manual')`),
  check('ReportDelivery_status_check', sql`${table.status} in ('pending', 'sent', 'failed')`),
  // Un solo envío automático vivo (pending/sent) por colaborador y mes: el cron no duplica aunque corra dos veces.
  uniqueIndex('ReportDelivery_cron_once').on(table.userId, table.month).where(sql`${table.trigger} = 'cron' and ${table.status} in ('pending', 'sent')`),
]);

export const passwordResetTokens = pgTable('PasswordResetToken', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  usedAt: timestamp('usedAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
});

// Migración propuesta en scripts/sql/admin-user-audit.sql; aplicación manual.
// Sin FK: preservar el historial aunque se eliminen usuarios. Nunca guardar secretos.
export const adminUserAudit = pgTable('AdminUserAudit', {
  id: text('id').primaryKey(),
  actorId: text('actorId').notNull(),
  targetUserId: text('targetUserId').notNull(),
  action: text('action').notNull(),
  previousRole: text('previousRole'),
  newRole: text('newRole'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('AdminUserAudit_target_created_idx').on(table.targetUserId, table.createdAt),
  check('AdminUserAudit_action_check', sql`${table.action} in ('ROLE_CHANGE', 'PASSWORD_RESET', 'PUBLICATION_PERMISSION', 'REFERRAL_PERMISSION')`),
]);

// Historial sin FK: debe sobrevivir a la eliminación de recursos de negocio.
export const ownershipMigrations = pgTable('OwnershipMigration', {
  key: text('key').primaryKey(),
  defaultOwnerId: text('defaultOwnerId').notNull(),
  ownerColumnExisted: boolean('ownerColumnExisted').notNull(),
  ownerWasRequired: boolean('ownerWasRequired').notNull(),
  appliedAt: timestamp('appliedAt', { withTimezone: true }).notNull().defaultNow(),
  revertedAt: timestamp('revertedAt', { withTimezone: true }),
});

export const ownershipMigrationAudit = pgTable('OwnershipMigrationAudit', {
  migrationKey: text('migrationKey').notNull(),
  propertyId: text('propertyId').notNull(),
  previousOwnerId: text('previousOwnerId'),
  assignedOwnerId: text('assignedOwnerId').notNull(),
  changed: boolean('changed').notNull(),
  recordedAt: timestamp('recordedAt', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.migrationKey, table.propertyId] })]);
