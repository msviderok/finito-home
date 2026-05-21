import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import { employeesTable } from './employees';
import { usersTable } from './users';

export const payslipsTable = sqliteTable('payslips', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employeesTable.id)
    .notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  createdById: integer('created_by_id')
    .references(() => usersTable.id)
    .notNull(),
});

export const payslipSelectSchema = createSelectSchema(payslipsTable);
export const payslipInsertSchema = createInsertSchema(payslipsTable);
export const payslipUpdateSchema = createUpdateSchema(payslipsTable);

export type SelectPayslip = typeof payslipsTable.$inferSelect;
export type InsertPayslip = typeof payslipsTable.$inferInsert;
