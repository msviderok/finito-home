import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import * as v from 'valibot';
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

export function sanitizeHoursInput(value: string) {
  let sanitized = value.replace(/[^\d.]/g, '');
  const dotIndex = sanitized.indexOf('.');
  if (dotIndex !== -1) {
    sanitized = sanitized.slice(0, dotIndex + 1) + sanitized.slice(dotIndex + 1).replace(/\./g, '');
    const [whole, decimal = ''] = sanitized.split('.');
    sanitized = decimal ? `${whole}.${decimal.slice(0, 2)}` : `${whole}.`;
  }
  return sanitized;
}

export function parseHoursInput(value: string) {
  return Number(value);
}

export function isValidHoursInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !/^\d*\.?\d{0,2}$/.test(trimmed)) return false;
  const parsed = parseHoursInput(trimmed);
  return Number.isFinite(parsed) && parsed > 0;
}

export const payslipDraftLineItemFormSchema = v.object({
  paymentCategoryId: v.number(),
  rateId: v.number(),
  hours: v.pipe(
    v.string('Enter billable hours'),
    v.nonEmpty('Enter billable hours'),
    v.check(isValidHoursInput, 'Enter valid billable hours'),
  ),
});

export const payslipDraftFormSchema = v.pipe(
  v.object({
    employeeId: v.number(),
    paymentDate: v.date('Enter a payment date'),
    lineItems: v.pipe(v.array(payslipDraftLineItemFormSchema), v.minLength(1, 'Add at least one payment category')),
  }),
  v.transform((input) => ({
    ...input,
    lineItems: input.lineItems.map((item) => ({
      ...item,
      hours: parseHoursInput(item.hours),
    })),
  })),
);

export type SelectPayslip = typeof payslipsTable.$inferSelect;
export type InsertPayslip = typeof payslipsTable.$inferInsert;
export type PayslipDraftFormInput = v.InferInput<typeof payslipDraftFormSchema>;
export type PayslipDraftFormOutput = v.InferOutput<typeof payslipDraftFormSchema>;
