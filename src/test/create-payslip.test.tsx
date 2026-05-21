import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayslipsSection } from '@/components/PayslipsSection';
import { selectComboboxOption, getHoursInputForCategory } from './combobox';
import { categoryRatesByEmployee } from './mock-trpc-store';
import { payslipCategoryRates } from './fixtures';
import { renderPayslipsSection } from './render';

describe('create payslip', () => {
  const onCreatePayslip = vi.fn();

  beforeEach(() => {
    onCreatePayslip.mockReset();
    categoryRatesByEmployee.set(1, payslipCategoryRates);
  });

  it('creates a payslip with payment date and line items', async () => {
    await renderPayslipsSection(<PayslipsSection employeeId={1} onCreatePayslip={onCreatePayslip} />, {
      employeeId: 1,
      rates: payslipCategoryRates,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add payslip' }));

    await waitFor(() => expect(screen.getByLabelText(/^Payment date$/i)).toBeTruthy());
    await waitFor(() => {
      expect((screen.getByPlaceholderText('Add payment category') as HTMLInputElement).disabled).toBe(false);
    });

    fireEvent.change(screen.getByLabelText(/^Payment date$/i), { target: { value: '2026-05-10' } });

    await selectComboboxOption('Add payment category', 'Hourly Rate');

    fireEvent.change(getHoursInputForCategory('Hourly Rate'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create payslip' }));

    await waitFor(() => expect(onCreatePayslip).toHaveBeenCalledOnce());
    expect(onCreatePayslip).toHaveBeenCalledWith({
      employeeId: 1,
      paymentDate: new Date('2026-05-10T00:00:00'),
      lineItems: [
        {
          paymentCategoryId: 1,
          rateId: 1,
          hours: 8,
        },
      ],
    });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Create payslip' })).toBeNull());
  });

  it('adds multiple categories before submit', async () => {
    await renderPayslipsSection(<PayslipsSection employeeId={1} onCreatePayslip={onCreatePayslip} />, {
      employeeId: 1,
      rates: payslipCategoryRates,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add payslip' }));
    await waitFor(() => {
      expect((screen.getByPlaceholderText('Add payment category') as HTMLInputElement).disabled).toBe(false);
    });

    await selectComboboxOption('Add payment category', 'Hourly Rate');
    fireEvent.change(getHoursInputForCategory('Hourly Rate'), { target: { value: '6' } });
    await selectComboboxOption('Add payment category', 'Overtime Hourly');
    expect(screen.getByText('All categories added')).toBeTruthy();
    fireEvent.change(getHoursInputForCategory('Overtime Hourly'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create payslip' }));

    await waitFor(() => expect(onCreatePayslip).toHaveBeenCalledOnce());
    expect(onCreatePayslip.mock.calls[0][0].lineItems).toHaveLength(2);
  });

  it('does not submit without line items', async () => {
    await renderPayslipsSection(<PayslipsSection employeeId={1} onCreatePayslip={onCreatePayslip} />, {
      employeeId: 1,
      rates: payslipCategoryRates,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add payslip' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create payslip' })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Create payslip' }));

    await waitFor(() => expect(screen.getByText('Add at least one payment category')).toBeTruthy());
    expect(onCreatePayslip).not.toHaveBeenCalled();
  });
});
