import { format, startOfMonth } from 'date-fns';
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { createCategoryRate, overwrittenHourlyRates } from './fixtures';
import { renderBrowserWorkbench } from './browser-helpers';
import { createRateMutation, dismissRateMutation } from './mock-trpc';
import { pickViewAsOfMonth } from './browser-actions';
import { resetTestStores } from './stores';

describe('rates (browser)', () => {
  beforeEach(() => {
    resetTestStores();
    createRateMutation.mockClear();
    dismissRateMutation.mockClear();
  });

  it('creates a rate with amount and effective-from from view-as-of month', async () => {
    const viewMonth = startOfMonth(new Date('2026-06-01'));
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: [createCategoryRate()],
      initialViewAsOfMonth: viewMonth,
    });

    await screen.getByRole('button', { name: 'Update rate' }).click();
    const rateInput = screen.getByRole('textbox');
    await rateInput.clear();
    await rateInput.fill('32.50');
    await screen.getByRole('button', { name: 'Save rate' }).click({ force: true });
    await expect.element(screen.getByText('$32.50')).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm new rate' }).click();

    await expect.poll(() => createRateMutation.mock.calls.length).toBe(1);
    expect(createRateMutation.mock.calls[0]?.[0]).toEqual({
      amount: 32.5,
      employeeId: 1,
      paymentCategoryId: 1,
      effectiveFrom: viewMonth,
    });
    await expect.element(screen.getByText('$32.50')).toBeVisible();
    await expect.element(screen.getByText('Jun 2026')).toBeVisible();
  });

  it('rejects empty rate amount on submit', async () => {
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: [createCategoryRate()],
    });

    await screen.getByRole('button', { name: 'Update rate' }).click();
    const rateInput = screen.getByRole('textbox');
    await rateInput.clear();
    await screen.getByRole('button', { name: 'Save rate' }).click({ force: true });

    expect(createRateMutation).not.toHaveBeenCalled();
  });

  it.each([
    { amountInput: '28.00', expectedAmount: 28, expectedText: '$28.00' },
    { amountInput: '22.50', expectedAmount: 22.5, expectedText: '$22.50' },
  ])('edits rate to $amountInput from a retroactive view-as-of month and carries it forward', async (scenario) => {
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: [createCategoryRate()],
      initialViewAsOfMonth: startOfMonth(new Date('2026-05-01')),
    });

    await pickViewAsOfMonth(screen, 'Feb');
    await expect.element(screen.getByText('$25.00')).toBeVisible();
    await screen.getByRole('button', { name: 'Update rate' }).click();
    await screen.getByRole('textbox').fill(scenario.amountInput);
    await screen.getByRole('button', { name: 'Save rate' }).click({ force: true });
    await screen.getByRole('button', { name: 'Confirm new rate' }).click();

    await expect.poll(() => createRateMutation.mock.calls.length).toBe(1);
    expect(createRateMutation.mock.calls[0]?.[0]).toMatchObject({
      amount: scenario.expectedAmount,
      effectiveFrom: startOfMonth(new Date('2026-02-01')),
    });
    await expect.element(screen.getByText(scenario.expectedText)).toBeVisible();

    await pickViewAsOfMonth(screen, 'May');
    await expect.element(screen.getByText(scenario.expectedText)).toBeVisible();

    await screen.getByRole('button', { name: 'View history' }).click();
    await expect.element(screen.getByText(scenario.expectedText).first()).toBeVisible();
    await expect.element(screen.getByText('$25.00').first()).toBeVisible();
  });

  it('reverts the latest rate overwrite after confirmation', async () => {
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: overwrittenHourlyRates,
      initialViewAsOfMonth: startOfMonth(new Date('2026-03-01')),
    });

    await expect.element(screen.getByText('$28.00')).toBeVisible();
    await screen.getByRole('button', { name: /Revert to previous rate from \$28\.00/ }).click();
    await expect.element(screen.getByText('$25.00')).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm revert' }).click();

    await expect.poll(() => dismissRateMutation.mock.calls.length).toBe(1);
    expect(dismissRateMutation.mock.calls[0]?.[0]).toEqual({ rateId: overwrittenHourlyRates[1]!.id });
    await expect.element(screen.getByText('$25.00')).toBeVisible();
    await expect.element(screen.getByText('$28.00')).not.toBeVisible();
  });

  it('shows rate history for the category', async () => {
    const { screen } = await renderBrowserWorkbench({
      employeeId: 1,
      rates: overwrittenHourlyRates,
      initialViewAsOfMonth: startOfMonth(new Date('2026-03-01')),
    });

    await screen.getByRole('button', { name: 'View history' }).click();
    await expect.element(screen.getByText(format(overwrittenHourlyRates[1]!.createdAt, 'MMM d, yyyy'))).toBeVisible();
    await expect
      .element(screen.getByText(format(overwrittenHourlyRates[1]!.effectiveFrom, 'MMM yyyy')).first())
      .toBeVisible();
  });
});
