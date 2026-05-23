import { viewAsOfInstant } from '@/lib/date';
import { startOfMonth } from 'date-fns';
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { hoursInputInRow, pickCreatePayslipMonth, selectComboboxOption } from './browser-actions';
import { renderBrowserWorkbench } from './browser-helpers';
import { payslipCategoryRates } from './fixtures';
import { createPayslipMutation } from './mock-trpc';
import { resetTestStores } from './stores';

describe('payslips (browser)', () => {
  beforeEach(() => {
    resetTestStores();
    createPayslipMutation.mockClear();
  });

  it('shows draft line amount and footer total from rate x hours', async () => {
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: payslipCategoryRates,
      initialViewAsOfMonth: startOfMonth(new Date('2026-05-01')),
    });

    await pickCreatePayslipMonth(screen, 'May');
    await expect.element(screen.getByText('May 2026').first()).toBeVisible();
    await screen.getByRole('button', { name: 'Add payment' }).click();
    await selectComboboxOption(screen, 'Select category', 'Hourly Rate');
    await hoursInputInRow(screen, 'Hourly Rate').fill('8.50');

    await expect.element(screen.getByText('$25.00/hr')).toBeVisible();
    await expect.element(screen.getByText('$212.50').first()).toBeVisible();
    await expect.element(screen.getByText('$212.50').last()).toBeVisible();
  });

  it('creates a payslip with payment date and line items', async () => {
    const paymentMonth = startOfMonth(new Date('2026-05-01'));
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: payslipCategoryRates,
      initialViewAsOfMonth: paymentMonth,
    });

    await pickCreatePayslipMonth(screen, 'May');
    await screen.getByRole('button', { name: 'Add payment' }).click();
    await selectComboboxOption(screen, 'Select category', 'Hourly Rate');
    await hoursInputInRow(screen, 'Hourly Rate').fill('8.50');

    const save = screen.getByRole('button', { name: 'Save' });
    await expect.element(save).not.toBeDisabled();
    await save.click({ force: true });

    await expect.poll(() => createPayslipMutation.mock.calls.length).toBe(1);
    expect(createPayslipMutation.mock.calls[0]?.[0]).toEqual({
      employeeId: 1,
      paymentDate: viewAsOfInstant(paymentMonth),
      lineItems: [{ paymentCategoryId: 1, hours: 8.5 }],
    });
    await expect.element(screen.getByRole('button', { name: /May 2026 pay slip, \$212\.50/ })).toBeVisible();
  });

  it('adds multiple categories with rounded combined total', async () => {
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: payslipCategoryRates,
      initialViewAsOfMonth: startOfMonth(new Date('2026-05-01')),
    });

    await pickCreatePayslipMonth(screen, 'May');
    await screen.getByRole('button', { name: 'Add payment' }).click();
    await selectComboboxOption(screen, 'Select category', 'Hourly Rate');
    await hoursInputInRow(screen, 'Hourly Rate').fill('8');
    await screen.getByRole('button', { name: 'Add payment' }).click();
    await selectComboboxOption(screen, 'Select category', 'Overtime Hourly');
    await hoursInputInRow(screen, 'Overtime Hourly').fill('2.25');

    await expect.element(screen.getByText('$200.00').first()).toBeVisible();
    await expect.element(screen.getByText('$84.38')).toBeVisible();
    await expect.element(screen.getByText('$284.38')).toBeVisible();

    const save = screen.getByRole('button', { name: 'Save' });
    await expect.element(save).not.toBeDisabled();
    await save.click({ force: true });

    await expect.poll(() => createPayslipMutation.mock.calls.length).toBe(1);
    expect(createPayslipMutation.mock.calls[0]?.[0].lineItems).toEqual([
      { paymentCategoryId: 1, hours: 8 },
      { paymentCategoryId: 2, hours: 2.25 },
    ]);
  });

  it('does not submit when billable hours are empty', async () => {
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: payslipCategoryRates,
      initialViewAsOfMonth: startOfMonth(new Date('2026-05-01')),
    });

    await pickCreatePayslipMonth(screen, 'May');
    await screen.getByRole('button', { name: 'Add payment' }).click();
    await selectComboboxOption(screen, 'Select category', 'Hourly Rate');
    const save = screen.getByRole('button', { name: 'Save' });
    await expect.element(save).not.toBeDisabled();
    await save.click({ force: true });

    expect(createPayslipMutation).not.toHaveBeenCalled();
  });
});
