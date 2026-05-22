import { integer, numeric, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import { paymentCategoriesTable } from './paymentCategories';
import { payslipsTable } from './payslips';
import { usersTable } from './users';

export const payslipLineItemsTable = sqliteTable('payslip_line_items', {
  id: integer('id').primaryKey(),
  payslipId: integer('payslip_id')
    .references(() => payslipsTable.id)
    .notNull(),
  paymentCategoryId: integer('payment_category_id')
    .references(() => paymentCategoriesTable.id)
    .notNull(),
  units: numeric('units').notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
  createAtAmountCents: integer('create_at_amount_cents'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  createdById: integer('created_by_id')
    .references(() => usersTable.id)
    .notNull(),
});

export const payslipLineItemSelectSchema = createSelectSchema(payslipLineItemsTable);
export const payslipLineItemInsertSchema = createInsertSchema(payslipLineItemsTable);
export const payslipLineItemUpdateSchema = createUpdateSchema(payslipLineItemsTable);

export type SelectPayslipLineItem = typeof payslipLineItemsTable.$inferSelect;
export type InsertPayslipLineItem = typeof payslipLineItemsTable.$inferInsert;
