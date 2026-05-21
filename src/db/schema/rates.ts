import { integer, sqliteTable, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
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
  effectiveTo: integer('effective_to', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  previousRateId: integer('previous_rate_id').references((): AnySQLiteColumn => ratesTable.id),
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
  previousRateId: v.optional(rateInsertSchema.entries.previousRateId),
  effectiveTo: v.optional(rateInsertSchema.entries.effectiveTo),
});

export const rateCreateFormSchema = v.pipe(
  v.omit(
    createInsertSchema(ratesTable, {
      amountCents: () => rateAmountSchema,
      effectiveFrom: () => v.date('Enter an effective from date'),
    }),
    ['id', 'createdAt'],
  ),
  v.transform((input) =>
    v.parse(rateCreateMutationSchema, {
      amount: parseRateAmountInput(input.amountCents),
      employeeId: input.employeeId,
      paymentCategoryId: input.paymentCategoryId,
      effectiveFrom: startOfMonth(input.effectiveFrom),
      previousRateId: input.previousRateId,
      effectiveTo: input.effectiveTo,
    }),
  ),
);

export const rateSelectSchema = createSelectSchema(ratesTable);
export const rateUpdateSchema = createUpdateSchema(ratesTable);

export type SelectRate = typeof ratesTable.$inferSelect;
export type InsertRate = typeof ratesTable.$inferInsert;
export type RateCreateFormInput = v.InferInput<typeof rateCreateFormSchema>;
export type RateCreateFormOutput = v.InferOutput<typeof rateCreateFormSchema>;
export type RateCreateMutationInput = v.InferOutput<typeof rateCreateMutationSchema>;
