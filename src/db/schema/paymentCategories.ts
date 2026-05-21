import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';

export const paymentCategories = sqliteTable('payment_categories', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
});

export const paymentCategorySelectSchema = createSelectSchema(paymentCategories);
export const paymentCategoryInsertSchema = createInsertSchema(paymentCategories);
export const paymentCategoryUpdateSchema = createUpdateSchema(paymentCategories);

export type SelectPaymentCategory = typeof paymentCategories.$inferSelect;
export type InsertPaymentCategory = typeof paymentCategories.$inferInsert;
