import type { CategoryRate } from '@/lib/category-rates';
import { viewAsOfInstant } from '@/lib/date';
import { findCurrentRateForCategory } from '@/lib/category-rates';
import { createCategoryRate } from './fixtures';

export const categoryRatesByEmployee = new Map<number, CategoryRate[]>();
export const deterministicCreatedAt = new Date('2026-05-23T12:00:00.000Z');

export type MockPayslipLineItem = {
  id: number;
  paymentCategoryId: number;
  units: string;
  createAtAmountCents: number;
  paymentCategory: { id: number; name: string };
};

export type MockPayslip = {
  id: number;
  employeeId: number;
  paymentDate: Date;
  createdAt: Date;
  lineItems: MockPayslipLineItem[];
};

export const payslipsByEmployee = new Map<number, MockPayslip[]>();
export const payslipDetailsById = new Map<number, MockPayslip>();

let nextRateId = 100;
let nextPayslipId = 100;
let nextLineItemId = 1000;

export function resetTestStores() {
  categoryRatesByEmployee.clear();
  payslipsByEmployee.clear();
  payslipDetailsById.clear();
  nextRateId = 100;
  nextPayslipId = 100;
  nextLineItemId = 1000;
}

export function seedEmployeeRates(employeeId: number, rates: CategoryRate[]) {
  categoryRatesByEmployee.set(
    employeeId,
    rates.map((rate) => ({ ...rate })),
  );
}

export function createRateInStore(input: {
  employeeId: number;
  paymentCategoryId: number;
  amount: number;
  effectiveFrom: Date;
}) {
  const rates = categoryRatesByEmployee.get(input.employeeId) ?? [];
  const template = rates.find((rate) => rate.paymentCategoryId === input.paymentCategoryId) ?? createCategoryRate();
  const rate = createCategoryRate({
    id: nextRateId++,
    employeeId: input.employeeId,
    paymentCategoryId: input.paymentCategoryId,
    paymentCategory: template.paymentCategory,
    amount: input.amount,
    amountCents: Math.round(input.amount * 100),
    effectiveFrom: input.effectiveFrom,
    createdAt: deterministicCreatedAt,
  });
  categoryRatesByEmployee.set(input.employeeId, [...rates, rate]);
  return rate;
}

export function dismissRateInStore(rateId: number) {
  for (const [employeeId, rates] of categoryRatesByEmployee.entries()) {
    const nextRates = rates.filter((rate) => rate.id !== rateId);
    if (nextRates.length !== rates.length) {
      categoryRatesByEmployee.set(employeeId, nextRates);
      return true;
    }
  }
  return false;
}

export function createPayslipInStore(input: {
  employeeId: number;
  paymentDate: Date;
  lineItems: Array<{ paymentCategoryId: number; hours: number }>;
}) {
  const rates = categoryRatesByEmployee.get(input.employeeId) ?? [];
  const paymentAt = viewAsOfInstant(input.paymentDate);
  const createdAt = deterministicCreatedAt;
  const lineItems = input.lineItems.map((item) => {
    const rate = findCurrentRateForCategory(rates, item.paymentCategoryId, paymentAt);
    if (!rate) throw new Error('Missing rate for category');
    return {
      id: nextLineItemId++,
      paymentCategoryId: item.paymentCategoryId,
      units: item.hours.toFixed(2),
      createAtAmountCents: Math.round(rate.amountCents * item.hours),
      paymentCategory: (rate as any).paymentCategory,
    };
  });
  const payslip: MockPayslip = {
    id: nextPayslipId++,
    employeeId: input.employeeId,
    paymentDate: paymentAt,
    createdAt,
    lineItems,
  };
  const list = payslipsByEmployee.get(input.employeeId) ?? [];
  payslipsByEmployee.set(input.employeeId, [payslip, ...list]);
  payslipDetailsById.set(payslip.id, payslip);
  return payslip;
}

export function getPayslipById(id: number) {
  const detail = payslipDetailsById.get(id);
  if (detail) return detail;

  for (const payslips of payslipsByEmployee.values()) {
    const payslip = payslips.find((entry) => entry.id === id);
    if (payslip) return payslip;
  }
  return null;
}
