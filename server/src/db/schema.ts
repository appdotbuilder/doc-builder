
import { serial, text, pgTable, timestamp, numeric, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const subscriptionTypeEnum = pgEnum('subscription_type', ['free', 'premium']);
export const documentStatusEnum = pgEnum('document_status', ['draft', 'completed', 'trashed']);
export const fileTypeEnum = pgEnum('file_type', ['pdf', 'doc', 'docx']);
export const purchaseTypeEnum = pgEnum('purchase_type', ['subscription', 'individual_document']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar_url: text('avatar_url'),
  subscription_type: subscriptionTypeEnum('subscription_type').notNull().default('free'),
  subscription_expires_at: timestamp('subscription_expires_at'),
  trial_ends_at: timestamp('trial_ends_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Template categories table
export const templateCategoriesTable = pgTable('template_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon_url: text('icon_url'),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Templates table
export const templatesTable = pgTable('templates', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category_id: integer('category_id').notNull(),
  template_data: jsonb('template_data').notNull(),
  preview_url: text('preview_url'),
  is_premium: boolean('is_premium').notNull().default(false),
  price: numeric('price', { precision: 10, scale: 2 }),
  downloads_count: integer('downloads_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// User documents table
export const userDocumentsTable = pgTable('user_documents', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  template_id: integer('template_id'),
  title: text('title').notNull(),
  document_data: jsonb('document_data').notNull(),
  file_url: text('file_url'),
  file_type: fileTypeEnum('file_type'),
  status: documentStatusEnum('status').notNull().default('draft'),
  is_favorite: boolean('is_favorite').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Purchases table
export const purchasesTable = pgTable('purchases', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  template_id: integer('template_id'),
  purchase_type: purchaseTypeEnum('purchase_type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  payment_status: paymentStatusEnum('payment_status').notNull().default('pending'),
  payment_provider: text('payment_provider'),
  payment_provider_id: text('payment_provider_id'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  documents: many(userDocumentsTable),
  purchases: many(purchasesTable)
}));

export const templateCategoriesRelations = relations(templateCategoriesTable, ({ many }) => ({
  templates: many(templatesTable)
}));

export const templatesRelations = relations(templatesTable, ({ one, many }) => ({
  category: one(templateCategoriesTable, {
    fields: [templatesTable.category_id],
    references: [templateCategoriesTable.id]
  }),
  userDocuments: many(userDocumentsTable),
  purchases: many(purchasesTable)
}));

export const userDocumentsRelations = relations(userDocumentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userDocumentsTable.user_id],
    references: [usersTable.id]
  }),
  template: one(templatesTable, {
    fields: [userDocumentsTable.template_id],
    references: [templatesTable.id]
  })
}));

export const purchasesRelations = relations(purchasesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [purchasesTable.user_id],
    references: [usersTable.id]
  }),
  template: one(templatesTable, {
    fields: [purchasesTable.template_id],
    references: [templatesTable.id]
  })
}));

// Export all tables for drizzle queries
export const tables = {
  users: usersTable,
  templateCategories: templateCategoriesTable,
  templates: templatesTable,
  userDocuments: userDocumentsTable,
  purchases: purchasesTable
};
