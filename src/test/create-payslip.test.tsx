import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayslipsSection } from '@/components/PayslipsSection';
import { selectComboboxOption, getHoursInputForCategory } from './combobox';
import { categoryRatesByEmployee } from './mock-trpc-store';
import { payslipCategoryRates } from './fixtures';
import { renderPayslipsSection } from './render';
import { viewAsOfInstant } from '@/lib/view-as-of-date';

const may2026ViewAsOfAt = viewAsOfInstant(new Date('2026-05-01'));

describe('create payslip', () => {
  const onCreatePayslip = vi.fn();

  beforeEach(() => {
    onCreatePayslip.mockReset();
    categoryRatesByEmployee.set(1, payslipCategoryRates);
  });

  it('creates a payslip with view-as-of payment date and line items', async () => {
    await renderPayslipsSection(<PayslipsSection employeeId={1} onCreatePayslip={onCreatePayslip} />, {
      employeeId: 1,
      rates: payslipCategoryRates,
      initialViewAsOfMonth: new Date('2026-05-01'),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Payslip' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add payment' }));

    await selectComboboxOption('Select category', 'Hourly Rate');

    fireEvent.change(getHoursInputForCategory('Hourly Rate'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onCreatePayslip).toHaveBeenCalledOnce());
    expect(onCreatePayslip).toHaveBeenCalledWith({
      employeeId: 1,
      paymentDate: may2026ViewAsOfAt,
      lineItems: [
        {
          paymentCategoryId: 1,
          hours: 8,
        },
      ],
    });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save' })).toBeNull());
  });

  it('adds multiple categories before submit', async () => {
    await renderPayslipsSection(<PayslipsSection employeeId={1} onCreatePayslip={onCreatePayslip} />, {
      employeeId: 1,
      rates: payslipCategoryRates,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Payslip' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add payment' }));
    await selectComboboxOption('Select category', 'Hourly Rate');
    fireEvent.change(getHoursInputForCategory('Hourly Rate'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add payment' }));
    await selectComboboxOption('Select category', 'Overtime Hourly');
    expect(screen.getByText('All categories added')).toBeTruthy();
    fireEvent.change(getHoursInputForCategory('Overtime Hourly'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onCreatePayslip).toHaveBeenCalledOnce());
    expect(onCreatePayslip.mock.calls[0][0].lineItems).toHaveLength(2);
  });

  it('does not submit without line items', async () => {
    await renderPayslipsSection(<PayslipsSection employeeId={1} onCreatePayslip={onCreatePayslip} />, {
      employeeId: 1,
      rates: payslipCategoryRates,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Payslip' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('Add at least one payment category')).toBeTruthy());
    expect(onCreatePayslip).not.toHaveBeenCalled();
  });
});
