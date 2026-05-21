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

function rateEffectiveAt(rate: { effectiveFrom: Date }, at: Date) {
  return rate.effectiveFrom.getTime() <= at.getTime();
}

export function findCurrentRateForCategory(
  rates: Array<Pick<CategoryRate, 'paymentCategoryId' | 'effectiveFrom'>>,
  paymentCategoryId: number,
  at: Date = new Date(),
) {
  const categoryRates = rates.filter(
    (rate) => rate.paymentCategoryId === paymentCategoryId && rateEffectiveAt(rate, at),
  );
  if (categoryRates.length === 0) return undefined;
  return categoryRates.sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
}

export function getCategoryGroupAt(groups: CategoryRateGroup[], paymentCategoryId: number) {
  return groups.find((group) => group.paymentCategoryId === paymentCategoryId);
}

export function groupCategoryRates(rates: CategoryRate[], at: Date = new Date()): CategoryRateGroup[] {
  const groups = new Map<number, CategoryRate[]>();
  for (const rate of rates) {
    const existingRates = groups.get(rate.paymentCategoryId) ?? [];
    existingRates.push(rate);
    groups.set(rate.paymentCategoryId, existingRates);
  }

  return [...groups.entries()].map(([paymentCategoryId, groupRates]) => {
    const sortedRates = [...groupRates].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const currentRate = sortedRates.find((rate) => rateEffectiveAt(rate, at)) ?? sortedRates[sortedRates.length - 1]!;
    return {
      paymentCategoryId,
      paymentCategory: currentRate.paymentCategory,
      currentRate,
      rates: sortedRates,
    };
  });
}
