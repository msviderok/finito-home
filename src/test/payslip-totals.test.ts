import { describe, expect, it } from 'vitest';
import { comparePayslipTotalsAt } from '@/lib/payslip-totals';
import { createCategoryRate } from './fixtures';

describe('comparePayslipTotalsAt', () => {
  const lineItems = [{ paymentCategoryId: 1, units: 10 }];
  const paymentDate = new Date('2026-01-31T23:59:59');
  const createdAt = new Date('2026-02-01T00:00:00');
  const rates = [
    createCategoryRate({
      effectiveFrom: new Date('2026-01-01T00:00:00'),
      createdAt: new Date('2026-01-01T00:00:00'),
      amountCents: 2_500,
      amount: 25,
    }),
    createCategoryRate({
      id: 2,
      effectiveFrom: new Date('2026-06-01T00:00:00'),
      createdAt: new Date('2026-06-01T00:00:00'),
      amountCents: 3_000,
      amount: 30,
    }),
  ];

  it('keeps the base total from rates known at payslip creation', () => {
    const result = comparePayslipTotalsAt(lineItems, rates, paymentDate, createdAt, new Date('2026-06-30T23:59:59'));

    expect(result.baseTotalCents).toBe(25_000);
    expect(result.viewTotalCents).toBe(30_000);
    expect(result.differs).toBe(true);
  });

  it('uses stored createAtAmountCents as the submitted base total', () => {
    const result = comparePayslipTotalsAt(
      [{ paymentCategoryId: 1, units: 10, createAtAmountCents: 24_750 }],
      rates,
      paymentDate,
      createdAt,
      new Date('2026-06-30T23:59:59'),
    );

    expect(result.baseTotalCents).toBe(24_750);
    expect(result.viewTotalCents).toBe(30_000);
    expect(result.differs).toBe(true);
  });

  it('reports equal totals when view-as-of matches the base slip', () => {
    const result = comparePayslipTotalsAt(lineItems, rates, paymentDate, createdAt, new Date('2026-02-28T23:59:59'));

    expect(result.baseTotalCents).toBe(25_000);
    expect(result.viewTotalCents).toBe(25_000);
    expect(result.differs).toBe(false);
  });
});
