import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/lib/trpc';

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type CategoryRate = RouterOutputs['paymentCategories']['forEmployee'][number];
export type CategoryRateGroup = {
  paymentCategoryId: number;
  paymentCategory: CategoryRate['paymentCategory'];
  currentRate: CategoryRate;
  rates: CategoryRate[];
};

type RatePeriod = { effectiveFrom: Date; effectiveTo: Date | null };

export function ratePeriodsOverlap(
  aFrom: Date,
  aTo: Date | null | undefined,
  bFrom: Date,
  bTo: Date | null | undefined,
) {
  const aToMs = aTo?.getTime() ?? Number.POSITIVE_INFINITY;
  const bToMs = bTo?.getTime() ?? Number.POSITIVE_INFINITY;
  return aFrom.getTime() < bToMs && bFrom.getTime() < aToMs;
}

export function rateActiveAt(rate: RatePeriod, at: Date) {
  return (
    rate.effectiveFrom.getTime() <= at.getTime() &&
    (rate.effectiveTo === null || rate.effectiveTo.getTime() > at.getTime())
  );
}

export function findSupersededRate<TRate extends RatePeriod & { id: number }>(
  rates: TRate[],
  newFrom: Date,
  newTo: Date | null | undefined,
) {
  return rates
    .filter(
      (rate) => ratePeriodsOverlap(rate.effectiveFrom, rate.effectiveTo, newFrom, newTo) && rateActiveAt(rate, newFrom),
    )
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
}

export function groupCategoryRates(rates: CategoryRate[], at: Date = new Date()): CategoryRateGroup[] {
  const groups = new Map<number, CategoryRate[]>();
  for (const rate of rates) {
    const existingRates = groups.get(rate.paymentCategoryId) ?? [];
    existingRates.push(rate);
    groups.set(rate.paymentCategoryId, existingRates);
  }

  return [...groups.entries()].map(([paymentCategoryId, groupRates]) => {
    const sortedRates = [...groupRates].sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
    const currentRate = sortedRates.find((rate) => rateActiveAt(rate, at)) ?? sortedRates[0];
    return {
      paymentCategoryId,
      paymentCategory: currentRate.paymentCategory,
      currentRate,
      rates: sortedRates,
    };
  });
}
