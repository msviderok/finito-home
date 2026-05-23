import { fireEvent, screen, waitFor } from '@testing-library/react';
import { startOfMonth } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RateAmount } from '@/components/PaymentCategoriesSection';
import { createCategoryRate } from './fixtures';
import { renderWithProviders } from './render';

describe('create rate', () => {
  const onCreateRate = vi.fn();

  beforeEach(() => {
    onCreateRate.mockReset();
  });

  it('submits a new rate with updated amount and view-as-of effective from', async () => {
    const currentRate = createCategoryRate();
    await renderWithProviders(<RateAmount rate={currentRate} editing={false} onSettled={onCreateRate} />, {
      initialViewAsOfMonth: new Date('2026-06-01T00:00:00'),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit rate' }));
    fireEvent.change(screen.getByLabelText(/^Rate$/i), { target: { value: '32.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }));

    await waitFor(() => expect(onCreateRate).toHaveBeenCalledOnce());
    expect(onCreateRate).toHaveBeenCalledWith({
      amount: 32.5,
      employeeId: 1,
      paymentCategoryId: 1,
      effectiveFrom: startOfMonth(new Date('2026-06-01T00:00:00')),
    });
  });

  it('does not submit when rate amount is empty', async () => {
    const currentRate = createCategoryRate();
    await renderWithProviders(<RateAmount rate={currentRate} editing={false} onSettled={onCreateRate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit rate' }));
    fireEvent.change(screen.getByLabelText(/^Rate$/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }));

    expect(onCreateRate).not.toHaveBeenCalled();
  });
});
