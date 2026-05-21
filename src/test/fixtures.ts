import type { CategoryRate } from '@/lib/category-rates';

const paymentCategory = { id: 1, name: 'Hourly Rate' };

export function createCategoryRate(overrides: Partial<CategoryRate> = {}): CategoryRate {
  return {
    id: 1,
    amountCents: 2_500,
    employeeId: 1,
    paymentCategoryId: 1,
    effectiveFrom: new Date('2026-01-01T00:00:00'),
    effectiveTo: null,
    createdAt: new Date('2026-01-01T00:00:00'),
    previousRateId: null,
    paymentCategory,
    amount: 25,
    ...overrides,
  };
}

export const hourlyCategoryRates: CategoryRate[] = [
  createCategoryRate(),
  createCategoryRate({
    id: 2,
    amountCents: 3_000,
    effectiveFrom: new Date('2025-06-01T00:00:00'),
    effectiveTo: new Date('2026-01-01T00:00:00'),
    amount: 30,
  }),
];

export const payslipCategoryRates: CategoryRate[] = [
  createCategoryRate(),
  createCategoryRate({
    id: 3,
    paymentCategoryId: 2,
    paymentCategory: { id: 2, name: 'Overtime Hourly' },
    amountCents: 3_750,
    amount: 37.5,
  }),
];
