import { fireEvent, screen, waitFor } from '@testing-library/react';
import { startOfMonth } from 'date-fns';
import { beforeEach, describe, expect, it } from 'vitest';
import { PaymentCategoriesSection } from '@/components/PaymentCategoriesSection';
import { createCategoryRate } from './fixtures';
import { createRateMutation } from './mock-trpc';
import { renderWithProviders } from './render';
import { resetTestStores, seedEmployeeRates } from './stores';

describe('create rate', () => {
  beforeEach(() => {
    resetTestStores();
    createRateMutation.mockReset();
    seedEmployeeRates(1, [createCategoryRate()]);
  });

  it('submits a new rate with updated amount and view-as-of effective from', async () => {
    await renderWithProviders(<PaymentCategoriesSection employeeId={1} onCreateRate={createRateMutation} />, {
      initialViewAsOfMonth: new Date('2026-06-01T00:00:00'),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Update rate' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '32.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm new rate' }));

    await waitFor(() => expect(createRateMutation).toHaveBeenCalledOnce());
    expect(createRateMutation.mock.calls[0]?.[0]).toEqual({
      amount: 32.5,
      employeeId: 1,
      paymentCategoryId: 1,
      effectiveFrom: startOfMonth(new Date('2026-06-01T00:00:00')),
    });
  });

  it('does not submit when rate amount is empty', async () => {
    await renderWithProviders(<PaymentCategoriesSection employeeId={1} onCreateRate={createRateMutation} />);

    fireEvent.click(screen.getByRole('button', { name: 'Update rate' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }));

    expect(createRateMutation).not.toHaveBeenCalled();
  });
});
