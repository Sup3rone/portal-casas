import { pgTable, pgEnum, text, timestamp, integer, boolean, date, doublePrecision } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("UserRole", ["ADMIN", "VIEWER", "CLIENT"]);
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
});

export const media = pgTable('Media', {
  id: text('id').primaryKey(),
  propertyId: text('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  type: mediaTypeEnum('type').notNull().default('PHOTO'),
  order: integer('order').notNull().default(0),
});

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
});

export const bookings = pgTable('Booking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text('propertyId').notNull(),
  icalFeedId: text('icalFeedId').references(() => icalFeeds.id),
  startDate: date('startDate').notNull(),
  endDate: date('endDate').notNull(),
  source: text('source').notNull().default('manual'),
  guestUserId: text('guestUserId').references(() => users.id),
});
