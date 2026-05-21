import { integer, numeric, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import { rates } from './rates';
import { users } from './users';
import { payslips } from './payslips';

export const payslipLineItems = sqliteTable('payslip_line_items', {
  id: integer('id').primaryKey(),
  payslipId: integer('payslip_id')
    .references(() => payslips.id)
    .notNull(),
  rateId: integer('rate_id')
    .references(() => rates.id)
    .notNull(),
  units: numeric('units').notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
  totalAmountCents: integer('total_amount_cents').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  createdById: integer('created_by_id')
    .references(() => users.id)
    .notNull(),
});

export const payslipLineItemSelectSchema = createSelectSchema(payslipLineItems);
export const payslipLineItemInsertSchema = createInsertSchema(payslipLineItems);
export const payslipLineItemUpdateSchema = createUpdateSchema(payslipLineItems);

export type SelectPayslipLineItem = typeof payslipLineItems.$inferSelect;
export type InsertPayslipLineItem = typeof payslipLineItems.$inferInsert;
