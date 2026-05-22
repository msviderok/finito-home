import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { InlineRateEditor } from '@/components/PaymentCategoriesSection';
import { overwrittenHourlyRates } from './fixtures';
import { dismissRateMutation } from './mock-trpc';
import { renderWithProviders } from './render';

describe('dismiss rate', () => {
  beforeEach(() => {
    dismissRateMutation.mockReset();
  });

  it('shows dismiss controls when multiple rates apply at the view-as-of date', () => {
    const [currentRate] = overwrittenHourlyRates;
    renderWithProviders(
      <InlineRateEditor
        currentRate={currentRate}
        history={overwrittenHourlyRates}
        employeeId={1}
        viewAsOfAt={new Date('2026-03-01T00:00:00')}
      />,
      { initialViewAsOfMonth: new Date('2026-03-01T00:00:00') },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rate history' }));

    expect(screen.getAllByRole('button', { name: /Dismiss \$/ })).toHaveLength(2);
  });

  it('calls dismiss mutation after confirmation', async () => {
    const [, overwriteRate] = overwrittenHourlyRates;
    renderWithProviders(
      <InlineRateEditor
        currentRate={overwriteRate}
        history={overwrittenHourlyRates}
        employeeId={1}
        viewAsOfAt={new Date('2026-03-01T00:00:00')}
      />,
      { initialViewAsOfMonth: new Date('2026-03-01T00:00:00') },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rate history' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss $28.00 rate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm dismiss' }));

    await waitFor(() => {
      expect(dismissRateMutation).toHaveBeenCalled();
      expect(dismissRateMutation.mock.calls[0]?.[0]).toEqual({ rateId: overwriteRate.id });
    });
  });
});
