import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import { paymentCategories } from './paymentCategories';
import { employees } from './employees';

export const rates = sqliteTable('rates', {
  id: integer('id').primaryKey(),
  amountCents: integer('amount_cents').notNull(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  paymentCategoryId: integer('payment_category_id')
    .references(() => paymentCategories.id)
    .notNull(),
  effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const rateSelectSchema = createSelectSchema(rates);
export const rateInsertSchema = createInsertSchema(rates);
export const rateUpdateSchema = createUpdateSchema(rates);

export type SelectRate = typeof rates.$inferSelect;
export type InsertRate = typeof rates.$inferInsert;
