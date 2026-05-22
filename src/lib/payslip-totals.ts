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
};

export function filterRatesKnownAt<T extends { createdAt: Date }>(rates: T[], at: Date) {
  const atMs = at.getTime();
  return rates.filter((rate) => rate.createdAt.getTime() <= atMs);
}

export function calculatePayslipTotalCents(lineItems: PayslipLineItemForTotal[], groups: CategoryRateGroup[]) {
  return lineItems.reduce((sum, lineItem) => {
    const group = getCategoryGroupAt(groups, lineItem.paymentCategoryId);
    if (!group) return sum;
    const units = Number(lineItem.units);
    if (!Number.isFinite(units)) return sum;
    return sum + Math.round(group.currentRate.amountCents * units);
  }, 0);
}

/** Totals using the same rate selection as payslip creation (rates known at createdAt, effective at paymentDate). */
export function calculateBasePayslipTotalCents(
  lineItems: PayslipLineItemForTotal[],
  rates: CategoryRate[],
  paymentDate: Date,
  createdAt: Date,
) {
  const ratesAtCreation = filterRatesKnownAt(rates, createdAt);

  return lineItems.reduce((sum, lineItem) => {
    const rate = findCurrentRateForCategory(ratesAtCreation, lineItem.paymentCategoryId, paymentDate);
    if (!rate) return sum;
    const units = Number(lineItem.units);
    if (!Number.isFinite(units)) return sum;
    return sum + Math.round(rate.amountCents * units);
  }, 0);
}

export function getBaseRateForLineItem(
  rates: CategoryRate[],
  paymentCategoryId: number,
  paymentDate: Date,
  createdAt: Date,
) {
  return findCurrentRateForCategory(filterRatesKnownAt(rates, createdAt), paymentCategoryId, paymentDate);
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
