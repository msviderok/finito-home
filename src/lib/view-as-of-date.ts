import { endOfMonth, isSameMonth, startOfMonth } from 'date-fns';

export function currentViewAsOfMonth() {
  return startOfMonth(new Date());
}

export function viewAsOfInstant(month: Date) {
  return endOfMonth(month);
}

export function isViewingCurrentMonth(month: Date) {
  return isSameMonth(month, new Date());
}

export function formatMonthInputValue(month: Date) {
  const year = month.getFullYear();
  const monthPart = String(month.getMonth() + 1).padStart(2, '0');
  return `${year}-${monthPart}`;
}

export function parseMonthInputValue(value: string) {
  const [yearPart, monthPart] = value.split('-');
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return currentViewAsOfMonth();
  }
  return startOfMonth(new Date(year, monthIndex, 1));
}
