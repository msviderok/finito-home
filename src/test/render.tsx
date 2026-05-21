import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ViewAsOfProvider } from '@/contexts/view-as-of';
import type { CategoryRate } from '@/lib/category-rates';
import { trpc } from '@/router';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient },
) {
  const { queryClient: providedClient, ...renderOptions } = options ?? {};
  const queryClient = providedClient ?? createTestQueryClient();
  return {
    queryClient,
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <ViewAsOfProvider>{children}</ViewAsOfProvider>
        </QueryClientProvider>
      ),
      ...renderOptions,
    }),
  };
}

export async function renderPayslipsSection(ui: ReactElement, options: { employeeId: number; rates: CategoryRate[] }) {
  const queryClient = createTestQueryClient();
  await seedEmployeeCategoryRates(queryClient, options.employeeId, options.rates);
  seedPayslipList(queryClient, options.employeeId);
  return renderWithProviders(ui, { queryClient });
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
