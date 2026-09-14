import { pgTable, text, integer, doublePrecision, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('Role', ['ADMIN', 'VIEWER']);
export const mediaTypeEnum = pgEnum('MediaType', ['PHOTO', 'VIDEO']);

export const users = pgTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('ADMIN'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
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
