import type { Locator } from 'vite-plus/test/browser/context';

export async function selectComboboxOption(
  page: {
    getByPlaceholder: (text: string) => Locator;
    getByRole: (role: string, options?: { name?: string | RegExp }) => Locator;
  },
  placeholder: string,
  optionLabel: string,
) {
  const input = page.getByPlaceholder(placeholder);
  await input.click();
  const option = page.getByRole('option').filter({ hasText: optionLabel });
  await option.click();
}

export async function pickViewAsOfMonth(
  page: { getByRole: (role: string, options?: { name?: string | RegExp }) => Locator },
  monthLabel: string,
) {
  await page.getByRole('button', { name: 'View data as of month' }).click();
  await page.getByRole('button', { name: monthLabel }).click();
}

export async function pickCreatePayslipMonth(
  page: { getByRole: (role: string, options?: { name?: string | RegExp }) => Locator },
  monthLabel: string,
) {
  await page.getByRole('button', { name: 'Create Payslip' }).click();
  await page.getByRole('button', { name: monthLabel }).click();
}

export async function pickPaymentMonth(
  page: { getByRole: (role: string, options?: { name?: string | RegExp }) => Locator },
  monthLabel: string,
) {
  await page.getByRole('button', { name: 'Payment month' }).click();
  await page.getByRole('button', { name: monthLabel }).click();
}

export function hoursInputInRow(page: { getByText: (text: string) => any }, categoryLabel: string) {
  return page.getByText(categoryLabel).locator('xpath=ancestor::tr[1]').getByRole('textbox');
}
