import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter as createTanStackRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { CategoryRate } from '@/lib/category-rates';
import { formatMonthInputValue } from '@/lib/date';
import type { AppRouter } from '@/lib/trpc';
import { trpc } from '@/router';
import { indexSearchSchema } from '@/routes/index';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export async function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient; initialViewAsOfMonth?: Date },
) {
  const { queryClient: providedClient, initialViewAsOfMonth, ...renderOptions } = options ?? {};
  const queryClient = providedClient ?? createTestQueryClient();
  const rootRoute = createRootRouteWithContext<{
    queryClient: QueryClient;
    trpc: TRPCOptionsProxy<AppRouter>;
  }>()();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    validateSearch: indexSearchSchema,
    component: () => ui,
  });
  const router = createTanStackRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({
      initialEntries: [`/?effectiveDate=${formatMonthInputValue(initialViewAsOfMonth ?? new Date())}`],
    }),
    context: {
      queryClient,
      trpc,
    },
    Wrap: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
  await router.load({ sync: true });

  return {
    queryClient,
    ...render(<RouterProvider router={router} />, {
      ...renderOptions,
    }),
  };
}

export async function renderPayslipsSection(
  ui: ReactElement,
  options: { employeeId: number; rates: CategoryRate[]; initialViewAsOfMonth?: Date },
) {
  const queryClient = createTestQueryClient();
  await seedEmployeeCategoryRates(queryClient, options.employeeId, options.rates);
  seedPayslipList(queryClient, options.employeeId);
  return renderWithProviders(ui, { queryClient, initialViewAsOfMonth: options.initialViewAsOfMonth });
}

export async function seedEmployeeCategoryRates(queryClient: QueryClient, employeeId: number, rates: CategoryRate[]) {
  const queryOptions = trpc.paymentCategories.forEmployee.queryOptions({ employeeId });
  queryClient.setQueryData(queryOptions.queryKey, rates);
  await queryClient.prefetchQuery(queryOptions);
}

export function seedPayslipList(queryClient: QueryClient, employeeId: number, payslips: [] = []) {
  const queryOptions = trpc.employees.payslips.list.queryOptions({ employeeId });
  queryClient.setQueryData(queryOptions.queryKey, payslips);
}
