import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import { paymentCategoriesTable } from './paymentCategories';
import { employeesTable } from './employees';

export const ratesTable = sqliteTable('rates', {
  id: integer('id').primaryKey(),
  amountCents: integer('amount_cents').notNull(),
  employeeId: integer('employee_id')
    .references(() => employeesTable.id)
    .notNull(),
  paymentCategoryId: integer('payment_category_id')
    .references(() => paymentCategoriesTable.id)
    .notNull(),
  effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const rateSelectSchema = createSelectSchema(ratesTable);
export const rateInsertSchema = createInsertSchema(ratesTable);
export const rateUpdateSchema = createUpdateSchema(ratesTable);

export type SelectRate = typeof ratesTable.$inferSelect;
export type InsertRate = typeof ratesTable.$inferInsert;
