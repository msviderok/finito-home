import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PaymentCategoriesSection } from '@/components/PaymentCategoriesSection';
import { createCategoryRate, overwrittenHourlyRates } from './fixtures';
import { dismissRateMutation } from './mock-trpc';
import { renderWithProviders } from './render';
import { resetTestStores, seedEmployeeRates } from './stores';

describe('dismiss rate', () => {
  beforeEach(() => {
    resetTestStores();
    dismissRateMutation.mockReset();
    seedEmployeeRates(1, overwrittenHourlyRates);
  });

  it('shows revert control when multiple rates apply at the view-as-of date', async () => {
    await renderWithProviders(<PaymentCategoriesSection employeeId={1} onCreateRate={() => {}} />, {
      initialViewAsOfMonth: new Date('2026-03-01T00:00:00'),
    });

    expect(screen.getByRole('button', { name: /Revert to previous rate from \$28\.00/ })).toBeTruthy();
  });

  it('reverts latest rate change from the primary button', async () => {
    const [, overwriteRate] = overwrittenHourlyRates;
    await renderWithProviders(<PaymentCategoriesSection employeeId={1} onCreateRate={() => {}} />, {
      initialViewAsOfMonth: new Date('2026-03-01T00:00:00'),
    });

    fireEvent.click(screen.getByRole('button', { name: /Revert to previous rate from \$28\.00/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm revert' }));

    await waitFor(() => {
      expect(dismissRateMutation).toHaveBeenCalled();
      expect(dismissRateMutation.mock.calls[0]?.[0]).toEqual({ rateId: overwriteRate.id });
    });
  });

  it('shows the rate that will be shown after dismissing the current rate', async () => {
    seedEmployeeRates(1, [
      createCategoryRate({
        id: 20,
        amountCents: 2_500,
        effectiveFrom: new Date('2026-01-01T00:00:00'),
        createdAt: new Date('2026-01-15T00:00:00'),
        amount: 25,
      }),
      createCategoryRate({
        id: 21,
        amountCents: 2_800,
        effectiveFrom: new Date('2026-06-01T00:00:00'),
        createdAt: new Date('2026-05-23T00:00:00'),
        amount: 28,
      }),
    ]);

    await renderWithProviders(<PaymentCategoriesSection employeeId={1} onCreateRate={() => {}} />, {
      initialViewAsOfMonth: new Date('2026-03-01T00:00:00'),
    });

    fireEvent.click(screen.getByRole('button', { name: /Revert to previous rate from \$25\.00/ }));

    expect(screen.getByText('$28.00')).toBeTruthy();
  });
});
