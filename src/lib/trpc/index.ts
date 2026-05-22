import { employees } from './router/employees';
import { paymentCategories } from './router/paymentCategories';
import { rates } from './router/rates';
import { t } from './trpc';

export { createTRPCContext } from './context';

export type AppRouter = typeof appRouter;
export const appRouter = t.router({
  employees,
  paymentCategories,
  rates,
});
