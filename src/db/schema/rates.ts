import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';
import { startOfMonth } from 'date-fns';
import * as v from 'valibot';
import { isValidRateAmountInput, parseRateAmountInput } from '@/lib/currency';
import { employeesTable } from './employees';
import { paymentCategoriesTable } from './paymentCategories';

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

export const rateAmountSchema = v.pipe(
  v.string('Enter an amount'),
  v.nonEmpty('Enter an amount'),
  v.check(isValidRateAmountInput, 'Enter a valid amount'),
);

export const rateInsertSchema = createInsertSchema(ratesTable, {
  amountCents: (schema) => v.pipe(schema, v.minValue(0, 'Amount must be 0 or greater')),
  effectiveFrom: () => v.date('Enter an effective from date'),
});

export const rateCreateMutationSchema = v.object({
  amount: v.pipe(v.number(), v.minValue(0, 'Amount must be 0 or greater')),
  employeeId: rateInsertSchema.entries.employeeId,
  paymentCategoryId: rateInsertSchema.entries.paymentCategoryId,
  effectiveFrom: rateInsertSchema.entries.effectiveFrom,
});

export const rateCreateFormFieldsSchema = v.omit(
  createInsertSchema(ratesTable, {
    amountCents: () => rateAmountSchema,
  }),
  ['id', 'createdAt', 'effectiveFrom'],
);

export function parseRateCreateMutation(
  input: v.InferOutput<typeof rateCreateFormFieldsSchema>,
  effectiveFromMonth: Date,
): v.InferOutput<typeof rateCreateMutationSchema> {
  return v.parse(rateCreateMutationSchema, {
    amount: parseRateAmountInput(input.amountCents),
    employeeId: input.employeeId,
    paymentCategoryId: input.paymentCategoryId,
    effectiveFrom: startOfMonth(effectiveFromMonth),
  });
}

export const rateSelectSchema = createSelectSchema(ratesTable);
export const rateUpdateSchema = createUpdateSchema(ratesTable);

export type SelectRate = typeof ratesTable.$inferSelect;
export type InsertRate = typeof ratesTable.$inferInsert;
export type RateCreateFormInput = v.InferInput<typeof rateCreateFormFieldsSchema>;
export type RateCreateFormOutput = v.InferOutput<typeof rateCreateMutationSchema>;
export type RateCreateMutationInput = v.InferOutput<typeof rateCreateMutationSchema>;
