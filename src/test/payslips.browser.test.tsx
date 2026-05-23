import './mock-trpc';
import { startOfMonth } from 'date-fns';
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { hoursInputInRow, pickCreatePayslipMonth, selectComboboxOption } from './browser-actions';
import { renderBrowserWorkbench } from './browser-helpers';
import { payslipCategoryRates } from './fixtures';
import { resetTestStores } from './stores';

describe('payslips (browser)', () => {
  beforeEach(() => {
    resetTestStores();
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

    await expect.element(screen.getByRole('button', { name: /May 2026 payslip, \$212\.50/ })).toBeVisible();
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

    await expect.element(screen.getByRole('button', { name: /May 2026 payslip, \$284\.38/ })).toBeVisible();
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
    const hoursInput = hoursInputInRow(screen, 'Hourly Rate');
    const save = screen.getByRole('button', { name: 'Save' });
    await expect.element(save).not.toBeDisabled();
    await save.click({ force: true });
    await expect.element(hoursInput).toHaveAttribute('aria-invalid', 'true');
  });
});
