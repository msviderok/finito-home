import { fireEvent, screen, waitFor } from '@testing-library/react';
import { startOfMonth } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InlineRateEditor } from '@/components/RateEditPopover';
import { createCategoryRate } from './fixtures';
import { renderWithProviders } from './render';

describe('create rate', () => {
  const onCreateRate = vi.fn();

  beforeEach(() => {
    onCreateRate.mockReset();
  });

  it('submits a new rate with updated amount and effective from', async () => {
    const currentRate = createCategoryRate();
    renderWithProviders(
      <InlineRateEditor currentRate={currentRate} history={[currentRate]} employeeId={1} onCreateRate={onCreateRate} />,
    );

    fireEvent.change(screen.getByLabelText(/^Rate$/i), { target: { value: '32.50' } });
    fireEvent.change(screen.getByLabelText(/^Effective from$/i), { target: { value: '2026-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add rate' }));

    await waitFor(() => expect(onCreateRate).toHaveBeenCalledOnce());
    expect(onCreateRate).toHaveBeenCalledWith({
      amount: 32.5,
      employeeId: 1,
      paymentCategoryId: 1,
      effectiveFrom: startOfMonth(new Date('2026-06-15T00:00:00')),
      previousRateId: 1,
      effectiveTo: undefined,
    });
  });

  it('does not submit when rate amount is empty', async () => {
    const currentRate = createCategoryRate();
    renderWithProviders(
      <InlineRateEditor currentRate={currentRate} history={[currentRate]} employeeId={1} onCreateRate={onCreateRate} />,
    );

    fireEvent.change(screen.getByLabelText(/^Rate$/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add rate' }));

    expect(onCreateRate).not.toHaveBeenCalled();
  });
});
