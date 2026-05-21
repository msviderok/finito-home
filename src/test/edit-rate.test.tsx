import { fireEvent, screen, waitFor } from '@testing-library/react';
import { startOfMonth } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InlineRateEditor } from '@/components/RateEditPopover';
import { hourlyCategoryRates } from './fixtures';
import { renderWithProviders } from './render';

describe('edit rate', () => {
  const onCreateRate = vi.fn();

  beforeEach(() => {
    onCreateRate.mockReset();
  });

  it('submits revised amount with effective from from retroactive view', async () => {
    const [currentRate, previousRate] = hourlyCategoryRates;
    renderWithProviders(
      <InlineRateEditor
        currentRate={currentRate}
        history={hourlyCategoryRates}
        employeeId={1}
        onCreateRate={onCreateRate}
      />,
      { initialViewAsOfMonth: new Date('2026-03-01T00:00:00') },
    );

    expect((screen.getByLabelText(/^Rate$/i) as HTMLInputElement).value).toBe('25.00');

    fireEvent.change(screen.getByLabelText(/^Rate$/i), { target: { value: '28.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add rate' }));

    await waitFor(() => expect(onCreateRate).toHaveBeenCalledOnce());
    expect(onCreateRate).toHaveBeenCalledWith({
      amount: 28,
      employeeId: 1,
      paymentCategoryId: 1,
      effectiveFrom: startOfMonth(new Date('2026-03-01T00:00:00')),
    });
    expect(screen.getByText('Current')).toBeTruthy();
    expect(screen.getByText(previousRate.effectiveFrom.toLocaleDateString())).toBeTruthy();
  });
});
