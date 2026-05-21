import { defineRelations } from 'drizzle-orm';
import { employeesTable } from './employees';
import { paymentCategoriesTable } from './paymentCategories';
import { payslipLineItemsTable } from './payslipLineItems';
import { payslipsTable } from './payslips';
import { ratesTable } from './rates';
import { usersTable } from './users';

export const relations = defineRelations(
  {
    employees: employeesTable,
    paymentCategories: paymentCategoriesTable,
    payslipLineItems: payslipLineItemsTable,
    payslips: payslipsTable,
    rates: ratesTable,
    users: usersTable,
  },
  (r) => ({
    employees: {
      categoryRates: r.many.rates({ from: r.employees.id, to: r.rates.employeeId }),
      payslips: r.many.payslips({ from: r.employees.id, to: r.payslips.employeeId }),
    },
    paymentCategories: {
      rates: r.many.rates({ from: r.paymentCategories.id, to: r.rates.paymentCategoryId }),
    },
    payslipLineItems: {
      payslip: r.one.payslips({ from: r.payslipLineItems.payslipId, to: r.payslips.id }),
      rate: r.one.rates({ from: r.payslipLineItems.rateId, to: r.rates.id }),
      createdBy: r.one.users({ from: r.payslipLineItems.createdById, to: r.users.id }),
    },
    payslips: {
      employee: r.one.employees({ from: r.payslips.employeeId, to: r.employees.id }),
      createdBy: r.one.users({ from: r.payslips.createdById, to: r.users.id }),
      lineItems: r.many.payslipLineItems({ from: r.payslips.id, to: r.payslipLineItems.payslipId }),
    },
    rates: {
      paymentCategory: r.one.paymentCategories({ from: r.rates.paymentCategoryId, to: r.paymentCategories.id }),
      employee: r.one.employees({ from: r.rates.employeeId, to: r.employees.id }),
      previousRate: r.one.rates({ from: r.rates.previousRateId, to: r.rates.id }),
    },
    users: {
      payslips: r.many.payslips({ from: r.users.id, to: r.payslips.createdById }),
    },
  }),
);
