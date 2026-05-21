import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import { employees } from './employees';
import { users } from './users';

export const payslips = sqliteTable('payslips', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  createdById: integer('created_by_id')
    .references(() => users.id)
    .notNull(),
});

export const payslipSelectSchema = createSelectSchema(payslips);
export const payslipInsertSchema = createInsertSchema(payslips);
export const payslipUpdateSchema = createUpdateSchema(payslips);

export type SelectPayslip = typeof payslips.$inferSelect;
export type InsertPayslip = typeof payslips.$inferInsert;
