import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';

export const paymentCategoriesTable = sqliteTable('payment_categories', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
});

export const paymentCategorySelectSchema = createSelectSchema(paymentCategoriesTable);
export const paymentCategoryInsertSchema = createInsertSchema(paymentCategoriesTable);
export const paymentCategoryUpdateSchema = createUpdateSchema(paymentCategoriesTable);

export type SelectPaymentCategory = typeof paymentCategoriesTable.$inferSelect;
export type InsertPaymentCategory = typeof paymentCategoriesTable.$inferInsert;
