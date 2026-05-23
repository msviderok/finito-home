import { fireEvent, screen, waitFor } from '@testing-library/react';
import { format, startOfMonth } from 'date-fns';
import { beforeEach, describe, expect, it } from 'vitest';
import { PaymentCategoriesSection } from '@/components/PaymentCategoriesSection';
import { hourlyCategoryRates } from './fixtures';
import { createRateMutation } from './mock-trpc';
import { renderWithProviders } from './render';
import { resetTestStores, seedEmployeeRates } from './stores';

describe('edit rate', () => {
  beforeEach(() => {
    resetTestStores();
    createRateMutation.mockReset();
    seedEmployeeRates(1, hourlyCategoryRates);
  });

  it('submits revised amount with effective from from retroactive view', async () => {
    const [, previousRate] = hourlyCategoryRates;
    await renderWithProviders(<PaymentCategoriesSection employeeId={1} onCreateRate={createRateMutation} />, {
      initialViewAsOfMonth: new Date('2026-03-01T00:00:00'),
    });

    expect(screen.getByText('$25.00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Update rate' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '28.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm new rate' }));

    await waitFor(() => expect(createRateMutation).toHaveBeenCalledOnce());
    expect(createRateMutation.mock.calls[0]?.[0]).toEqual({
      amount: 28,
      employeeId: 1,
      paymentCategoryId: 1,
      effectiveFrom: startOfMonth(new Date('2026-03-01T00:00:00')),
    });

    fireEvent.click(screen.getByRole('button', { name: 'View history' }));
    expect(screen.getByText(format(previousRate.createdAt, 'MMM d, yyyy'))).toBeTruthy();
    expect(screen.getByText(format(previousRate.effectiveFrom, 'MMM yyyy'))).toBeTruthy();
  });
});
