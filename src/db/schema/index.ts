import { employeesTable } from './employees';
import { paymentCategoriesTable } from './paymentCategories';
import { payslipLineItemsTable } from './payslipLineItems';
import { payslipsTable } from './payslips';
import { ratesTable } from './rates';
import { usersTable } from './users';

export const schema = {
  employees: employeesTable,
  paymentCategories: paymentCategoriesTable,
  payslipLineItems: payslipLineItemsTable,
  payslips: payslipsTable,
  rates: ratesTable,
  users: usersTable,
};

export * from './employees';
export * from './paymentCategories';
export * from './payslipLineItems';
export * from './payslips';
export * from './rates';
export * from './users';
export { relations } from './relations';
