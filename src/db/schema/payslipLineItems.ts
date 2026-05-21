import { integer, numeric, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import { ratesTable } from './rates';
import { usersTable } from './users';
import { payslipsTable } from './payslips';

export const payslipLineItemsTable = sqliteTable('payslip_line_items', {
  id: integer('id').primaryKey(),
  payslipId: integer('payslip_id')
    .references(() => payslipsTable.id)
    .notNull(),
  rateId: integer('rate_id')
    .references(() => ratesTable.id)
    .notNull(),
  units: numeric('units').notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
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
