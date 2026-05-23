import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayslipsSection } from '@/components/PayslipsSection';
import { selectComboboxOption, getHoursInputForCategory } from './combobox';
import { resetTestStores, seedEmployeeRates } from './stores';
import { payslipCategoryRates } from './fixtures';
import { renderPayslipsSection } from './render';
import { viewAsOfInstant } from '@/lib/date';

const may2026ViewAsOfAt = viewAsOfInstant(new Date('2026-05-01'));

function openCreatePayslipForm(monthLabel = 'May') {
  fireEvent.click(screen.getByRole('button', { name: 'Create Payslip' }));
  fireEvent.click(screen.getByRole('button', { name: monthLabel }));
}

describe('create payslip', () => {
  const onCreatePayslip = vi.fn();

  beforeEach(() => {
    onCreatePayslip.mockReset();
    resetTestStores();
    seedEmployeeRates(1, payslipCategoryRates);
  });

  it('creates a payslip with view-as-of payment date and line items', async () => {
    await renderPayslipsSection(<PayslipsSection employeeId={1} onCreatePayslip={onCreatePayslip} />, {
      employeeId: 1,
      rates: payslipCategoryRates,
      initialViewAsOfMonth: new Date('2026-05-01'),
    });

    openCreatePayslipForm();
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

    openCreatePayslipForm();
    fireEvent.click(screen.getByRole('button', { name: 'Add payment' }));
    await selectComboboxOption('Select category', 'Hourly Rate');
    fireEvent.change(getHoursInputForCategory('Hourly Rate'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add payment' }));
    await selectComboboxOption('Select category', 'Overtime Hourly');
    expect(screen.queryByRole('button', { name: 'Add payment' })).toBeNull();
    fireEvent.change(getHoursInputForCategory('Overtime Hourly'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onCreatePayslip).toHaveBeenCalledOnce());
    expect(onCreatePayslip.mock.calls[0][0].lineItems).toHaveLength(2);
  });

  it('disables save button when no line items', async () => {
    await renderPayslipsSection(<PayslipsSection employeeId={1} onCreatePayslip={onCreatePayslip} />, {
      employeeId: 1,
      rates: payslipCategoryRates,
    });

    openCreatePayslipForm();
    const saveButton = (await screen.findByRole('button', { name: 'Save' })) as HTMLButtonElement;
    await waitFor(() => expect(saveButton.disabled).toBe(true));

    fireEvent.click(saveButton);
    expect(onCreatePayslip).not.toHaveBeenCalled();
  });
});
