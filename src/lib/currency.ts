export const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatRateAmount(amount: number) {
  return amount.toFixed(2);
}

export function sanitizeRateAmountInput(value: string) {
  let sanitized = value.replace(/[^\d.]/g, '');
  const dotIndex = sanitized.indexOf('.');
  if (dotIndex !== -1) {
    sanitized = sanitized.slice(0, dotIndex + 1) + sanitized.slice(dotIndex + 1).replace(/\./g, '');
    const [whole, decimal = ''] = sanitized.split('.');
    sanitized = decimal ? `${whole}.${decimal.slice(0, 2)}` : `${whole}.`;
  }
  return sanitized;
}

export function parseRateAmountInput(value: string) {
  return Number(value);
}

export function isValidRateAmountInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !/^\d*\.?\d{0,2}$/.test(trimmed)) return false;
  const parsed = parseRateAmountInput(trimmed);
  return Number.isFinite(parsed);
}

export function formatCents(cents: number) {
  return cents / 100;
}
