import { pgTable, pgEnum, text, timestamp, integer, boolean, date, doublePrecision, varchar, index, unique, foreignKey, primaryKey, check, jsonb } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum("UserRole", ["ADMIN", "VIEWER", "CLIENT", "COLLABORATOR"]);
export const mediaTypeEnum = pgEnum('MediaType', ['PHOTO', 'VIDEO']);

export const users = pgTable("User", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  passwordHash: text("passwordHash"),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  role: userRoleEnum("role").notNull().default("CLIENT"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const properties = pgTable('Property', {
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
  city: text('city').notNull(),
  maxGuests: integer('maxGuests').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: doublePrecision('bathrooms').notNull(),
  published: boolean('published').notNull().default(false),
  ownerId: text('ownerId').notNull().references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  baseWeekdayPrice: integer('baseWeekdayPrice'),
  baseWeekendPrice: integer('baseWeekendPrice'),
}, table => [index('Property_ownerId_idx').on(table.ownerId)]);

export const media = pgTable('Media', {
  id: text('id').primaryKey(),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  type: mediaTypeEnum('type').notNull().default('PHOTO'),
  order: integer('order').notNull().default(0),
  category: varchar('category', { length: 50 }).default('principal').notNull(),
}, table => [unique('Media_id_propertyId_unique').on(table.id, table.propertyId)]);

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
});

export const icalFeeds = pgTable('IcalFeed', {
  id: text('id').primaryKey(),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  source: text('source').notNull().default('MANUAL'),
}, table => [unique('IcalFeed_id_propertyId_unique').on(table.id, table.propertyId)]);

export const bookings = pgTable('Booking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  icalFeedId: text('icalFeedId').references(() => icalFeeds.id),
  startDate: date('startDate').notNull(),
  endDate: date('endDate').notNull(),
  source: text('source').notNull().default('manual'),
  guestUserId: text('guestUserId').references(() => users.id),
}, table => [foreignKey({
  name: 'Booking_icalFeed_property_fk',
  columns: [table.icalFeedId, table.propertyId],
  foreignColumns: [icalFeeds.id, icalFeeds.propertyId],
})]);

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
}, table => [index('AdminUserAudit_target_created_idx').on(table.targetUserId, table.createdAt)]);

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
