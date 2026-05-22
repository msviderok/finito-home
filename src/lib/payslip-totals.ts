import {
  findCurrentRateForCategory,
  getCategoryGroupAt,
  groupCategoryRates,
  type CategoryRate,
  type CategoryRateGroup,
} from '@/lib/category-rates';

export type PayslipLineItemForTotal = {
  paymentCategoryId: number;
  units: string | number;
  createAtAmountCents?: number | null;
};

export function filterRatesKnownAt<T extends { createdAt: Date }>(rates: T[], at: Date) {
  const atMs = at.getTime();
  return rates.filter((rate) => rate.createdAt.getTime() <= atMs);
}

export function getLineUnits(lineItem: PayslipLineItemForTotal) {
  const units = Number(lineItem.units);
  return Number.isFinite(units) ? units : 0;
}

export function getLineBaseAmountCents(
  lineItem: PayslipLineItemForTotal,
  rates: CategoryRate[],
  paymentDate: Date,
  createdAt: Date,
) {
  if (lineItem.createAtAmountCents != null) return lineItem.createAtAmountCents;

  const rate = findCurrentRateForCategory(
    filterRatesKnownAt(rates, createdAt),
    lineItem.paymentCategoryId,
    paymentDate,
  );
  const units = getLineUnits(lineItem);
  if (!rate || units === 0) return 0;
  return Math.round(rate.amountCents * units);
}

export function getLineBaseRateCents(
  lineItem: PayslipLineItemForTotal,
  rates: CategoryRate[],
  paymentDate: Date,
  createdAt: Date,
) {
  const units = getLineUnits(lineItem);
  if (lineItem.createAtAmountCents != null && units > 0) {
    return Math.round(lineItem.createAtAmountCents / units);
  }

  const rate = findCurrentRateForCategory(
    filterRatesKnownAt(rates, createdAt),
    lineItem.paymentCategoryId,
    paymentDate,
  );
  return rate?.amountCents ?? null;
}

export function calculatePayslipTotalCents(lineItems: PayslipLineItemForTotal[], groups: CategoryRateGroup[]) {
  return lineItems.reduce((sum, lineItem) => {
    const group = getCategoryGroupAt(groups, lineItem.paymentCategoryId);
    if (!group) return sum;
    const units = getLineUnits(lineItem);
    if (units === 0) return sum;
    return sum + Math.round(group.currentRate.amountCents * units);
  }, 0);
}

export function calculateBasePayslipTotalCents(
  lineItems: PayslipLineItemForTotal[],
  rates: CategoryRate[],
  paymentDate: Date,
  createdAt: Date,
) {
  return lineItems.reduce((sum, lineItem) => sum + getLineBaseAmountCents(lineItem, rates, paymentDate, createdAt), 0);
}

export function comparePayslipTotalsAt(
  lineItems: PayslipLineItemForTotal[],
  rates: CategoryRate[],
  paymentDate: Date,
  createdAt: Date,
  viewAsOfAt: Date,
) {
  const viewGroups = groupCategoryRates(rates, viewAsOfAt);
  const baseTotalCents = calculateBasePayslipTotalCents(lineItems, rates, paymentDate, createdAt);
  const viewTotalCents = calculatePayslipTotalCents(lineItems, viewGroups);

  return {
    viewGroups,
    baseTotalCents,
    viewTotalCents,
    differs: baseTotalCents !== viewTotalCents,
  };
}
